import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { moduleMaterialSchema } from "@/lib/schemas/training";
import {
  addModuleMaterial,
  getModuleById,
  listModuleMaterials,
} from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id: moduleId } = await params;

  const before = await getModuleById(moduleId);
  if (!before) {
    return NextResponse.json(
      { ok: false, error: "Module not found." },
      { status: 404 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = moduleMaterialSchema.safeParse(json);
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

  const existing = await listModuleMaterials(moduleId);
  const sortOrder = parsed.data.sortOrder ?? existing.length;

  const result = await addModuleMaterial({
    moduleId,
    title: parsed.data.title,
    storagePath: parsed.data.storagePath,
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    byteSize: parsed.data.byteSize,
    sortOrder,
  });
  if (!result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not add material." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.moduleMaterialAdded,
    targetType: TRAINING_AUDIT_TARGET_TYPES.module,
    targetId: moduleId,
    metadata: {
      material_id: result.id,
      filename: parsed.data.filename,
      storage_path: parsed.data.storagePath,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, id: result.id });
}
