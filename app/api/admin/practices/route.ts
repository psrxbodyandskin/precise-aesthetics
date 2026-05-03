import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/server";
import {
  practiceProvisioningSchema,
  PRACTICE_STATUSES,
} from "@/lib/schemas/practice";
import {
  insertPractice,
  insertPlaceholderPracticeUser,
  insertPracticeDevices,
  listPractices,
} from "@/lib/admin/practices";
import {
  createPracticeAuthUser,
  setPracticeIdClaim,
  generateInviteLink,
} from "@/lib/admin/inviteUser";
import { sendPracticeInvite } from "@/lib/resend/send";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// ----------------------------------------------------------------
// POST /api/admin/practices — provision a new practice
// ----------------------------------------------------------------
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

  const parsed = practiceProvisioningSchema.safeParse(json);
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
  const values = parsed.data;
  const ip = getClientIp(req.headers);

  // Step 1: create auth user (role=practice in app_metadata, no practice_id yet)
  const authResult = await createPracticeAuthUser({ email: values.primaryEmail });
  if (authResult.status === "error") {
    if (authResult.code === "email_exists") {
      return NextResponse.json(
        {
          ok: false,
          error: "A user with this email already exists.",
          field: "primaryEmail",
        },
        { status: 409 },
      );
    }
    console.error("[provision] createPracticeAuthUser failed", {
      email: values.primaryEmail,
      message: authResult.message,
      code: authResult.code,
    });
    return NextResponse.json(
      {
        ok: false,
        error: `Could not create auth account: ${authResult.message}`,
      },
      { status: 500 },
    );
  }
  const authUserId = authResult.authUserId;

  // Step 2: insert practices row
  const practiceResult = await insertPractice(values, {
    authUserId,
    provisionedBy: admin.id,
  });
  if (practiceResult.status === "error") {
    return NextResponse.json(
      { ok: false, error: "Could not save practice record." },
      { status: 500 },
    );
  }
  const practiceId = practiceResult.id;

  // Step 3: placeholder authorized user
  await insertPlaceholderPracticeUser(practiceId);

  // Step 4: device assignments
  if (values.devices.length > 0) {
    await insertPracticeDevices(practiceId, values.devices);
  }

  // Step 5: patch auth user with practice_id claim — UNLOCKS RLS for the
  // rest of the build. Without this, current_practice_id() returns null.
  const claimResult = await setPracticeIdClaim(authUserId, practiceId);
  if (claimResult.status === "error") {
    // Practice exists but claim failed — log loudly. Admin can manually
    // re-trigger via a future "Repair claim" action; not fatal here.
    console.error(
      "[provision] setPracticeIdClaim failed — practice_id claim NOT set",
      { authUserId, practiceId, error: claimResult.message },
    );
  }

  // Step 6: invite link + send branded email
  const inviteResult = await generateInviteLink(values.primaryEmail);
  let emailSent = false;
  if (inviteResult.status === "ok") {
    const sendResult = await sendPracticeInvite({
      to: values.primaryEmail,
      practiceName: values.name,
      inviteLink: inviteResult.link,
    });
    emailSent = sendResult.ok;
    if (!sendResult.ok) {
      console.error("[provision] invite email failed", { error: sendResult.error });
    }
  } else {
    console.error("[provision] generateInviteLink failed", {
      error: inviteResult.message,
    });
  }

  // Step 7: audit
  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.provisioned",
    targetType: "practice",
    targetId: practiceId,
    metadata: {
      email: values.primaryEmail,
      name: values.name,
      deviceCount: values.devices.length,
      claimSet: claimResult.status === "ok",
      emailSent,
    },
    ipAddress: ip === "unknown" ? undefined : ip,
  });

  return NextResponse.json({
    ok: true,
    id: practiceId,
    emailSent,
  });
}

// ----------------------------------------------------------------
// GET /api/admin/practices?status=...&search=...&limit=...&offset=...
// ----------------------------------------------------------------
const listQuerySchema = z.object({
  status: z.enum([...PRACTICE_STATUSES, "all"]).default("all"),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  await requireAdmin();
  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query" },
      { status: 400 },
    );
  }
  const { data, error, count } = await listPractices(parsed.data);
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not list practices." },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    practices: data ?? [],
    total: count ?? 0,
  });
}
