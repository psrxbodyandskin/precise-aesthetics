import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { markAllReadForAdmin } from "@/lib/notifications/queries";

export const runtime = "nodejs";

export async function POST() {
  const admin = await requireAdmin();
  await markAllReadForAdmin(admin.id);
  return NextResponse.json({ ok: true });
}
