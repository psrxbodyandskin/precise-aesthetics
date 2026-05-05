import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { acknowledgeAndComplete } from "@/lib/portal/training";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
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
  const { id: moduleId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const practiceUserId = (json as { practiceUserId?: string })?.practiceUserId;
  if (!practiceUserId || typeof practiceUserId !== "string") {
    return NextResponse.json(
      { ok: false, error: "practiceUserId required" },
      { status: 400 },
    );
  }

  const result = await acknowledgeAndComplete({
    practiceId: practice.id,
    practiceUserId,
    moduleId,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not acknowledge." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, row: result.row });
}
