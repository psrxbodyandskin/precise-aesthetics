import { NextResponse } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { unreadCountForPractice } from "@/lib/notifications/queries";

export const runtime = "nodejs";

// Polled by the bell every 60s while the tab is foreground.
// Cheap query — partial index on (practice_id) where read_at is null.
export async function GET() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json({ ok: true, count: 0 });
  }
  const count = await unreadCountForPractice(practice.id);
  return NextResponse.json({ ok: true, count });
}
