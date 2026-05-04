import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { protocolListQuerySchema } from "@/lib/schemas/protocol";
import { listProtocols } from "@/lib/admin/protocols";

export const runtime = "nodejs";

// GET /api/admin/protocols?status=...&indication=...&search=...&limit=...&offset=...
export async function GET(req: NextRequest) {
  await requireAdmin();
  const url = new URL(req.url);
  const parsed = protocolListQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    indication: url.searchParams.get("indication") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid query" },
      { status: 400 },
    );
  }

  const { data, error, count } = await listProtocols({
    status: parsed.data.status,
    indicationCategoryId: parsed.data.indication,
    search: parsed.data.search,
    limit: parsed.data.limit,
    offset: parsed.data.offset,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Could not list protocols." },
      { status: 500 },
    );
  }
  return NextResponse.json({
    ok: true,
    protocols: data ?? [],
    total: count ?? 0,
  });
}
