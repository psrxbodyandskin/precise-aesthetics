import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getClientIp } from "@/lib/rate-limit";
import { listVendors, createVendor } from "@/lib/admin/vendors";
import {
  vendorCreateSchema,
  vendorListFiltersSchema,
} from "@/lib/schemas/vendor";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const filters = vendorListFiltersSchema.safeParse({
    q: sp.get("q") ?? undefined,
    category: sp.getAll("category"),
    status: sp.getAll("status"),
  });
  if (!filters.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid filters" },
      { status: 400 },
    );
  }

  const result = await listVendors(filters.data);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, vendors: result.data });
}

export async function POST(req: NextRequest) {
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
  const parsed = vendorCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid submission",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const result = await createVendor(parsed.data, {
    actorId: admin.id,
    ipAddress: getClientIp(req.headers),
  });
  if (result.error || !result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Insert failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
