import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getClientIp } from "@/lib/rate-limit";
import {
  archiveVendor,
  getVendorById,
  updateVendor,
} from "@/lib/admin/vendors";
import { vendorUpdateSchema } from "@/lib/schemas/vendor";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;
  const result = await getVendorById(id);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  if (!result.data) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, vendor: result.data });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin();
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = vendorUpdateSchema.safeParse(json);
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

  const result = await updateVendor(id, parsed.data, {
    actorId: admin.id,
    ipAddress: getClientIp(req.headers),
  });
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}

// DELETE is soft — sets status='former'. Hard delete intentionally
// unavailable.
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin();
  const { id } = await params;

  const result = await archiveVendor(id, {
    actorId: admin.id,
    ipAddress: getClientIp(req.headers),
  });
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
