import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { listForPractice } from "@/lib/notifications/queries";
import {
  NOTIFICATION_CATEGORIES,
  type NotificationCategory,
} from "@/lib/schemas/notifications";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }

  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get("unread") === "1" || sp.get("unread") === "true";
  const page = Number.parseInt(sp.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(sp.get("pageSize") ?? "50", 10);
  const rawCategories = sp.getAll("category");
  const categories = rawCategories.filter((c): c is NotificationCategory =>
    (NOTIFICATION_CATEGORIES as readonly string[]).includes(c),
  );

  const result = await listForPractice(practice.id, {
    unreadOnly,
    categories,
    page: Number.isFinite(page) ? page : 1,
    pageSize: Number.isFinite(pageSize) ? pageSize : 50,
  });

  return NextResponse.json({ ok: true, ...result });
}
