import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { deleteModuleMaterial } from "@/lib/admin/training";
import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; materialId: string }> },
) {
  const admin = await requireAdmin();
  const { id: moduleId, materialId } = await params;

  const result = await deleteModuleMaterial(materialId);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not delete material." },
      { status: 500 },
    );
  }

  // Best-effort storage cleanup. Don't fail the request if delete
  // misses — the row is gone, the storage object is now orphaned but
  // not user-visible.
  if (result.storagePath) {
    const supabase = getServiceClient();
    await supabase.storage
      .from("training-materials")
      .remove([result.storagePath]);
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.moduleMaterialRemoved,
    targetType: TRAINING_AUDIT_TARGET_TYPES.module,
    targetId: moduleId,
    metadata: {
      material_id: materialId,
      storage_path: result.storagePath ?? null,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
