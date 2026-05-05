import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { moduleUpdateSchema } from "@/lib/schemas/training";
import {
  deleteModule,
  getModuleById,
  listModuleMaterials,
  updateModule,
} from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireAdmin();
  const { id } = await params;
  const moduleRow = await getModuleById(id);
  if (!moduleRow) {
    return NextResponse.json(
      { ok: false, error: "Module not found." },
      { status: 404 },
    );
  }
  const materials = await listModuleMaterials(id);
  return NextResponse.json({ ok: true, module: moduleRow, materials });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const parsed = moduleUpdateSchema.safeParse(json);
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

  const before = await getModuleById(id);
  if (!before) {
    return NextResponse.json(
      { ok: false, error: "Module not found." },
      { status: 404 },
    );
  }

  const result = await updateModule(id, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description:
      parsed.data.description === undefined
        ? undefined
        : parsed.data.description || null,
    requiredWatchPercentage: parsed.data.requiredWatchPercentage,
    status: parsed.data.status,
    lastUpdatedBy: admin.id,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not update." },
      { status: 500 },
    );
  }

  if (parsed.data.status && parsed.data.status !== before.status) {
    const verb =
      parsed.data.status === "published"
        ? TRAINING_AUDIT_VERBS.modulePublished
        : TRAINING_AUDIT_VERBS.moduleUnpublished;
    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: verb,
      targetType: TRAINING_AUDIT_TARGET_TYPES.module,
      targetId: id,
      metadata: { from: before.status, to: parsed.data.status },
      ipAddress: getClientIp(req.headers),
    });
  } else {
    await logAudit({
      actorId: admin.id,
      actorRole: "admin",
      action: TRAINING_AUDIT_VERBS.moduleUpdated,
      targetType: TRAINING_AUDIT_TARGET_TYPES.module,
      targetId: id,
      metadata: { fields: Object.keys(parsed.data) },
      ipAddress: getClientIp(req.headers),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  const { id } = await params;

  const result = await deleteModule(id);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not delete." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: "module.deleted",
    targetType: TRAINING_AUDIT_TARGET_TYPES.module,
    targetId: id,
    metadata: {},
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
