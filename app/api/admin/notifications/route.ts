import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { listForAdmin } from "@/lib/notifications/queries";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@/lib/schemas/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get("unread") === "1" || sp.get("unread") === "true";
  const page = Number.parseInt(sp.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(sp.get("pageSize") ?? "50", 10);
  const rawCategories = sp.getAll("category");
  const categories = rawCategories.filter((c): c is NotificationCategory =>
    (NOTIFICATION_CATEGORIES as readonly string[]).includes(c),
  );
  const result = await listForAdmin(admin.id, {
    unreadOnly,
    categories,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 50,
  });
  return NextResponse.json({ ok: true, ...result });
}
