import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getCurriculumForPractice } from "@/lib/portal/training";

export const runtime = "nodejs";

export async function GET(
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
  const detail = await getCurriculumForPractice({
    curriculumId: id,
    practiceId: practice.id,
    practiceUserId: null,
  });
  if (!detail) {
    return NextResponse.json(
      { ok: false, error: "Curriculum unavailable." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, ...detail });
}
