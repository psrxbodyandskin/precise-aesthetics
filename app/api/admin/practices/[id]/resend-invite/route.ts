import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getPracticeById } from "@/lib/admin/practices";
import { generateInviteLink } from "@/lib/admin/inviteUser";
import { sendPracticeInvite } from "@/lib/resend/send";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/admin/practices/[id]/resend-invite
//
// Re-issues the invite link. Useful when the original email was lost,
// expired, or the practice never opened it. Always logs audit.
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

  const linkResult = await generateInviteLink(practice.primary_email);
  if (linkResult.status === "error") {
    return NextResponse.json(
      { ok: false, error: "Could not generate invite link." },
      { status: 500 },
    );
  }

  const sendResult = await sendPracticeInvite({
    to: practice.primary_email,
    practiceName: practice.name,
    inviteLink: linkResult.link,
  });

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "practice.invite_resent",
    targetType: "practice",
    targetId: id,
    metadata: { emailSent: sendResult.ok },
    ipAddress: getClientIp(req.headers),
  });

  if (!sendResult.ok) {
    return NextResponse.json(
      { ok: false, error: "Could not send invite email." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
