import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import {
  isInboxItemType,
  isInboxStatus,
  listInboxItems,
} from "@/lib/admin/inbox";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requireAdmin();

  const sp = req.nextUrl.searchParams;
  const rawType = sp.get("type");
  const rawStatus = sp.get("status");
  const search = sp.get("search") ?? undefined;
  const page = Number.parseInt(sp.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(sp.get("pageSize") ?? "50", 10);

  const type =
    rawType === "all" || rawType === null
      ? "all"
      : isInboxItemType(rawType)
        ? rawType
        : "all";
  const status =
    rawStatus === "all" || rawStatus === null
      ? "all"
      : isInboxStatus(rawStatus)
        ? rawStatus
        : "all";

  try {
    const result = await listInboxItems({
      type,
      status,
      search,
      page: Number.isFinite(page) ? page : 1,
      pageSize: Number.isFinite(pageSize) ? pageSize : 50,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "List failed",
      },
      { status: 500 },
    );
  }
}
