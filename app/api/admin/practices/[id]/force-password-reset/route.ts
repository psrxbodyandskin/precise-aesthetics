import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getPracticeById } from "@/lib/admin/practices";
import { generateRecoveryLink } from "@/lib/admin/inviteUser";
import { sendPracticeRecovery } from "@/lib/resend/send";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/practices/[id]/force-password-reset
//
// Per ambiguity F: generates a recovery link, sends it via Resend with
// the PracticeRecovery template, logs audit. The practice clicks the
// link → /portal/reset-password/confirm → sets new password.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const { data: practice, error } = await getPracticeById(id);
  if (error || !practice) {
    return NextResponse.json(
      { ok: false, error: "Practice not found." },
      { status: 404 },
    );
  }

  const linkResult = await generateRecoveryLink(practice.primary_email);
  if (linkResult.status === "error") {
    return NextResponse.json(
      { ok: false, error: "Could not generate recovery link." },
      { status: 500 },
    );
  }

  const sendResult = await sendPracticeRecovery({
    to: practice.primary_email,
    practiceName: practice.name,
    recoveryLink: linkResult.link,
  });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.password_reset_requested",
    targetType: "practice",
    targetId: id,
    metadata: { emailSent: sendResult.ok },
    ipAddress: getClientIp(req.headers),
  });

  if (!sendResult.ok) {
    return NextResponse.json(
      { ok: false, error: "Could not send recovery email." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
