import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import {
  getPreferencesForAdmin,
  upsertPreferencesForAdmin,
} from "@/lib/notifications/queries";
import { preferencesUpdateSchema } from "@/lib/schemas/notifications";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  const row = await getPreferencesForAdmin(admin.id);
  return NextResponse.json({
    ok: true,
    preferences: row?.preferences ?? {},
    quietHoursStart: row?.quiet_hours_start ?? null,
    quietHoursEnd: row?.quiet_hours_end ?? null,
    quietHoursTimezone: row?.quiet_hours_timezone ?? null,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();

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

  const result = await upsertPreferencesForAdmin(admin.id, {
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
