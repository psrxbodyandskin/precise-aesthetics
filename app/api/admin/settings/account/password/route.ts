import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { requireAdmin } from "@/lib/auth/server";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";
import { passwordChangeSchema } from "@/lib/schemas/account";

export const runtime = "nodejs";

// P13.5 — change admin password.
//
// Flow:
//   1. requireAdmin() — must be logged in as admin
//   2. Re-auth check: verify current password by calling
//      signInWithPassword on a fresh non-persistent client (does NOT
//      replace the active session)
//   3. updateUser({ password }) on the cookie-aware client
//   4. supabase.auth.admin.signOut(userId, { scope: 'others' }) —
//      revoke other active sessions; the current session stays alive
//   5. Audit log: admin.password_changed

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.email) {
    return NextResponse.json(
      { ok: false, error: "Account has no email on record." },
      { status: 400 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = passwordChangeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid submission",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { ok: false, error: "New password must be different from current." },
      { status: 400 },
    );
  }

  // Step 1 — re-auth verification on a NON-PERSISTENT client.
  // The temporary session that signInWithPassword creates is discarded
  // when this request completes; the operator's active cookie session
  // is untouched.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "Auth misconfigured." },
      { status: 500 },
    );
  }

  const verifyClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyError } = await verifyClient.auth.signInWithPassword({
    email: admin.email,
    password: currentPassword,
  });

  if (verifyError) {
    return NextResponse.json(
      { ok: false, error: "Current password is incorrect." },
      { status: 401 },
    );
  }

  // Step 2 — update password via the cookie-aware client.
  const supabase = await getAuthServerClient();
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        error: updateError.message ?? "Could not change password.",
      },
      { status: 500 },
    );
  }

  // Step 3 — revoke OTHER sessions. Service-role admin API.
  // scope: 'others' keeps the current session alive so the operator
  // doesn't get bounced to the login page mid-action.
  const service = getServiceClient();
  const { error: signOutError } = await service.auth.admin.signOut(
    admin.id,
    "others",
  );

  // Log even if signOut errored — the password change itself succeeded.
  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.password_changed",
    targetType: "auth_user",
    targetId: admin.id,
    metadata: {
      other_sessions_revoked: !signOutError,
      sign_out_error: signOutError?.message ?? null,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    otherSessionsRevoked: !signOutError,
  });
}
