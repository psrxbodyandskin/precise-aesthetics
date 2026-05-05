import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { markReadForAdmin } from "@/lib/notifications/queries";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;
  const result = await markReadForAdmin({
    notificationId: id,
    adminUserId: admin.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not mark read." },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
