import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { upsertModuleProgress } from "@/lib/portal/training";
import { moduleProgressSchema } from "@/lib/schemas/training";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST /api/portal/training/modules/[id]/progress
//
// Called every 10 seconds during playback. Server clamps
// watch_percentage monotonically non-decreasing so a backseek
// cannot reduce progress.
//
// Rate-limited to 30/minute/practice (every 10s = 6/min, plus
// some headroom for resume + tab-switch flushes). The upsert is
// idempotent so a runaway client can't cause damage — the limit
// just protects against abuse.
//
// Body:
//   { practiceUserId: uuid, watchPercentage: 0..100, lastPositionSeconds: int }
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

  const limit = rateLimit({
    key: `module-progress:${practice.id}:${moduleId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many progress updates." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = moduleProgressSchema
    .extend({
      // practiceUserId is allowed-null at the schema level for now —
      // until P9 rolls out chair-side user pickers, the route caller
      // sends the current user's practice_authorized_users.id.
    })
    .safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  // practiceUserId is required to scope progress per-user
  const practiceUserId = (json as { practiceUserId?: string })?.practiceUserId;
  if (!practiceUserId || typeof practiceUserId !== "string") {
    return NextResponse.json(
      { ok: false, error: "practiceUserId required" },
      { status: 400 },
    );
  }

  const result = await upsertModuleProgress({
    practiceId: practice.id,
    practiceUserId,
    moduleId,
    watchPercentage: parsed.data.watchPercentage,
    lastPositionSeconds: parsed.data.lastPositionSeconds,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not save progress." },
      { status: 500 },
    );
  }

  // Don't audit-log progress saves — they fire every 10s and would
  // flood the audit log. Audit only the acknowledge/complete event.
  void getClientIp(req.headers);
  return NextResponse.json({ ok: true, row: result.row });
}
