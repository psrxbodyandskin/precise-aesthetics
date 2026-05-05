import { NextResponse } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { listCurriculaForPractice } from "@/lib/portal/training";

export const runtime = "nodejs";

export async function GET() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }
  const curricula = await listCurriculaForPractice(practice.id, null);
  return NextResponse.json({ ok: true, curricula });
}
