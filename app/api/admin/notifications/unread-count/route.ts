import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { unreadCountForAdmin } from "@/lib/notifications/queries";

export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  const count = await unreadCountForAdmin(admin.id);
  return NextResponse.json({ ok: true, count });
}
