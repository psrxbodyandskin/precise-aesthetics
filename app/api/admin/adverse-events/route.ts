import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/server";
import { ADVERSE_EVENT_STATUSES } from "@/lib/schemas/treatment";
import { listAdverseEvents } from "@/lib/admin/adverse-events";

export const runtime = "nodejs";

const querySchema = z.object({
  status: z.enum([...ADVERSE_EVENT_STATUSES, "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(req: NextRequest) {
  await requireAdmin();
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query" },
      { status: 400 },
    );
  }

  const { data, error, count } = await listAdverseEvents(parsed.data);
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not list adverse events." },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    events: data ?? [],
    total: count ?? 0,
  });
}
