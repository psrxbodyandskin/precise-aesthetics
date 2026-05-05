import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { curriculumAddModuleSchema } from "@/lib/schemas/training";
import { addModuleToCurriculum } from "@/lib/admin/training";
import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import {
  dispatchToPractice,
  listPracticesForDeviceOwnership,
} from "@/lib/notifications/dispatch";
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
  const { id: curriculumId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = curriculumAddModuleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid submission" },
      { status: 400 },
    );
  }

  const result = await addModuleToCurriculum({
    curriculumId,
    moduleId: parsed.data.moduleId,
    isRequired: parsed.data.isRequired,
  });
  if (!result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Could not add module." },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: admin.id,
    actorRole: "admin",
    action: TRAINING_AUDIT_VERBS.curriculumModuleAdded,
    targetType: TRAINING_AUDIT_TARGET_TYPES.curriculum,
    targetId: curriculumId,
    metadata: { module_id: parsed.data.moduleId },
    ipAddress: getClientIp(req.headers),
  });

  // P10 — fan out to every practice that owns this curriculum's
  // device. Mutable + in-app only (no email regardless of pref —
  // category is not email-eligible). event_id keyed per
  // (module, curriculum, practice) so re-runs don't duplicate.
  void (async () => {
    const supabase = getServiceClient();
    const { data: curriculum } = await supabase
      .from("training_curricula")
      .select("device_id, title")
      .eq("id", curriculumId)
      .single();
    if (!curriculum) return;
    const { data: moduleRow } = await supabase
      .from("training_modules")
      .select("title")
      .eq("id", parsed.data.moduleId)
      .single();
    const moduleTitle = (moduleRow as { title?: string } | null)?.title ??
      "New module";
    const practiceIds = await listPracticesForDeviceOwnership(
      curriculum.device_id,
    );
    for (const practiceId of practiceIds) {
      await dispatchToPractice(practiceId, {
        category: "training.new_module_added",
        eventId: `training.new_module_added.${parsed.data.moduleId}.curriculum.${curriculumId}.practice.${practiceId}`,
        title: `New training module: ${moduleTitle}`,
        body: `A new module was added to the ${curriculum.title} curriculum.`,
        linkPath: `/portal/training/${curriculumId}`,
        metadata: {
          module_id: parsed.data.moduleId,
          curriculum_id: curriculumId,
          device_id: curriculum.device_id,
        },
      });
    }
  })();

  return NextResponse.json({ ok: true, id: result.id });
}
