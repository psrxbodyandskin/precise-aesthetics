import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { moduleCreateSchema } from "@/lib/schemas/training";
import { createModule, listAllModules } from "@/lib/admin/training";
import { logAudit } from "@/lib/admin/audit";
import {
  TRAINING_AUDIT_VERBS,
  TRAINING_AUDIT_TARGET_TYPES,
} from "@/lib/schemas/training";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "all";
  const modules = await listAllModules({
    status: status as "all" | "draft" | "published" | "archived",
  });
  return NextResponse.json({ ok: true, modules });
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
  const parsed = moduleCreateSchema.safeParse(json);
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

  const result = await createModule({
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    requiredWatchPercentage: parsed.data.requiredWatchPercentage,
    createdBy: admin.id,
  });
  if (!result.id) {
    const message = result.error ?? "Could not create module.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message.includes("duplicate") ? 409 : 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.moduleCreated,
    targetType: TRAINING_AUDIT_TARGET_TYPES.module,
    targetId: result.id,
    metadata: { title: parsed.data.title, slug: parsed.data.slug },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, id: result.id });
}
