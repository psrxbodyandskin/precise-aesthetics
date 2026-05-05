import { NextResponse } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { markAllReadForPractice } from "@/lib/notifications/queries";

export const runtime = "nodejs";

export async function POST() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }
  await markAllReadForPractice(practice.id);
  return NextResponse.json({ ok: true });
}
