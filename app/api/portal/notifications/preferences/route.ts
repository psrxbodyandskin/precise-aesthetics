import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import {
  getPreferencesForPractice,
  upsertPreferencesForPractice,
} from "@/lib/notifications/queries";
import { preferencesUpdateSchema } from "@/lib/schemas/notifications";

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
  const row = await getPreferencesForPractice(practice.id);
  return NextResponse.json({
    ok: true,
    preferences: row?.preferences ?? {},
    quietHoursStart: row?.quiet_hours_start ?? null,
    quietHoursEnd: row?.quiet_hours_end ?? null,
    quietHoursTimezone: row?.quiet_hours_timezone ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
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
  const parsed = preferencesUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await upsertPreferencesForPractice(practice.id, {
    preferences: parsed.data.preferences,
    quietHours: parsed.data.quietHours,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not save." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
