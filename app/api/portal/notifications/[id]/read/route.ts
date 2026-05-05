import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { markReadForPractice } from "@/lib/notifications/queries";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }
  const { id } = await params;
  const result = await markReadForPractice({
    notificationId: id,
    practiceId: practice.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not mark read." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
