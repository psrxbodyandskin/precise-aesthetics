import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";
import { emailChangeSchema } from "@/lib/schemas/account";

export const runtime = "nodejs";

// P13.5 — initiate admin email change.
//
// Calls supabase.auth.updateUser({ email }) which triggers Supabase's
// standard confirmation flow: a link is emailed to the NEW address.
// The operator clicks the link to finalize. Until they confirm, the
// existing email stays active.
//
// Audit verb: admin.email_changed (initiation only).
// admin.email_change_confirmed is detected + logged on the settings
// page server-side once Supabase reports the new email is active
// (see /admin/settings/account page.tsx).

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = emailChangeSchema.safeParse(json);
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

  const { newEmail } = parsed.data;

  // No-op guard: if they typed the same email they already have.
  if (admin.email && newEmail === admin.email.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "That's already your email." },
      { status: 400 },
    );
  }

  const supabase = await getAuthServerClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message ?? "Could not initiate email change.",
      },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "admin.email_changed",
    targetType: "auth_user",
    targetId: admin.id,
    metadata: {
      from_email: admin.email,
      to_email_initiated: newEmail,
      // Confirmation pending — Supabase has emailed a link to the new address.
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    pending: true,
    confirmationSentTo: newEmail,
  });
}
