import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// P9 — Portal training/certification data layer.
//
// Reads + writes go through the service-role client; the route layer
// authorizes via requirePractice() and resolves the practice_id from
// the session before calling these functions. RLS would block the
// equivalent session-client reads anyway (Class A on module_progress
// and practice_certifications), so the pattern matches treatments.ts.
//
// Every function takes practiceId as the first parameter to keep the
// boundary explicit — this module never reads from `auth.uid()` or
// `current_practice_id()`.

export type TrainingModuleRow =
  Database["public"]["Tables"]["training_modules"]["Row"];
export type TrainingCurriculumRow =
  Database["public"]["Tables"]["training_curricula"]["Row"];
export type CurriculumModuleRow =
  Database["public"]["Tables"]["curriculum_modules"]["Row"];
export type ModuleMaterialRow =
  Database["public"]["Tables"]["module_materials"]["Row"];
export type ModuleProgressRow =
  Database["public"]["Tables"]["module_progress"]["Row"];
export type PracticeCertificationRow =
  Database["public"]["Tables"]["practice_certifications"]["Row"];

// ------------------------------------------------------------
// listCurriculaForPractice
// ------------------------------------------------------------
// Returns one row per device the practice owns, joined with the
// curriculum (if published) for that device + the practice's
// certification status. Drives /portal/training overview.
// ------------------------------------------------------------
export interface PortalCurriculumOverview {
  device_id: string;
  device_display_name: string;
  device_slug: string;
  curriculum: TrainingCurriculumRow | null;
  certification: PracticeCertificationRow | null;
  module_count: number;
  total_duration_seconds: number;
  modules_completed: number;
  modules_required: number;
}

export async function listCurriculaForPractice(
  practiceId: string,
  practiceUserId: string | null,
): Promise<PortalCurriculumOverview[]> {
  const supabase = getServiceClient();

  // 1. Practice's owned devices
  const { data: deviceRows } = await supabase
    .from("practice_devices")
    .select("device_id, device:devices(id, display_name, slug)")
    .eq("practice_id", practiceId);

  if (!deviceRows || deviceRows.length === 0) return [];

  const deviceIds = deviceRows.map((r) => r.device_id);

  // 2. Curricula for those devices (published only)
  const { data: curricula } = await supabase
    .from("training_curricula")
    .select("*")
    .in("device_id", deviceIds)
    .eq("status", "published");

  // 3. Certifications
  const { data: certs } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", practiceId)
    .in("device_id", deviceIds);

  // 4. Module + duration counts per curriculum
  const curriculumIds = (curricula ?? []).map((c) => c.id);
  const { data: cmRows } = curriculumIds.length
    ? await supabase
        .from("curriculum_modules")
        .select(
          "curriculum_id, is_required, module:training_modules(id, video_duration_seconds)",
        )
        .in("curriculum_id", curriculumIds)
    : { data: [] };

  // 5. Practice user's progress for those modules
  const allModuleIds: string[] = [];
  for (const r of cmRows ?? []) {
    const mod = Array.isArray(r.module) ? r.module[0] : r.module;
    if (mod?.id) allModuleIds.push(mod.id);
  }
  const uniqueModuleIds = Array.from(new Set(allModuleIds));

  let progressByModule = new Map<string, ModuleProgressRow>();
  if (uniqueModuleIds.length > 0) {
    let q = supabase
      .from("module_progress")
      .select("*")
      .eq("practice_id", practiceId)
      .in("module_id", uniqueModuleIds);
    if (practiceUserId) q = q.eq("practice_user_id", practiceUserId);
    const { data: progressRows } = await q;
    progressByModule = new Map(
      ((progressRows ?? []) as ModuleProgressRow[]).map((p) => [p.module_id, p]),
    );
  }

  const curriculumByDevice = new Map<string, TrainingCurriculumRow>();
  for (const c of (curricula ?? []) as TrainingCurriculumRow[]) {
    curriculumByDevice.set(c.device_id, c);
  }
  const certByDevice = new Map<string, PracticeCertificationRow>();
  for (const c of (certs ?? []) as PracticeCertificationRow[]) {
    certByDevice.set(c.device_id, c);
  }

  // Build per-curriculum stats
  const statsByCurriculum = new Map<
    string,
    { count: number; duration: number; required: number; completed: number }
  >();
  for (const r of cmRows ?? []) {
    const mod = Array.isArray(r.module) ? r.module[0] : r.module;
    if (!mod) continue;
    const stats = statsByCurriculum.get(r.curriculum_id) ?? {
      count: 0,
      duration: 0,
      required: 0,
      completed: 0,
    };
    stats.count++;
    stats.duration += mod.video_duration_seconds ?? 0;
    if (r.is_required) {
      stats.required++;
      const prog = progressByModule.get(mod.id);
      if (prog?.is_complete) stats.completed++;
    }
    statsByCurriculum.set(r.curriculum_id, stats);
  }

  return deviceRows.map((row) => {
    const dev = Array.isArray(row.device) ? row.device[0] : row.device;
    const curriculum = curriculumByDevice.get(row.device_id) ?? null;
    const stats = curriculum
      ? statsByCurriculum.get(curriculum.id) ?? {
          count: 0,
          duration: 0,
          required: 0,
          completed: 0,
        }
      : { count: 0, duration: 0, required: 0, completed: 0 };
    return {
      device_id: row.device_id,
      device_display_name: dev?.display_name ?? "Device",
      device_slug: dev?.slug ?? "",
      curriculum,
      certification: certByDevice.get(row.device_id) ?? null,
      module_count: stats.count,
      total_duration_seconds: stats.duration,
      modules_completed: stats.completed,
      modules_required: stats.required,
    };
  });
}

// ------------------------------------------------------------
// Curriculum detail (modules + own progress)
// ------------------------------------------------------------
export interface PortalCurriculumDetail {
  curriculum: TrainingCurriculumRow;
  device: { id: string; display_name: string; slug: string } | null;
  modules: Array<{
    curriculum_module_id: string;
    sort_order: number;
    is_required: boolean;
    module: TrainingModuleRow;
    progress: ModuleProgressRow | null;
  }>;
  certification: PracticeCertificationRow | null;
}

export async function getCurriculumForPractice(args: {
  curriculumId: string;
  practiceId: string;
  practiceUserId: string | null;
}): Promise<PortalCurriculumDetail | null> {
  const supabase = getServiceClient();

  const { data: curriculum } = await supabase
    .from("training_curricula")
    .select("*, device:devices(id, display_name, slug)")
    .eq("id", args.curriculumId)
    .eq("status", "published")
    .single();
  if (!curriculum) return null;

  const curriculumRow = curriculum as TrainingCurriculumRow & {
    device: { id: string; display_name: string; slug: string } | null;
  };

  // Practice must own this device
  const { data: ownership } = await supabase
    .from("practice_devices")
    .select("device_id")
    .eq("practice_id", args.practiceId)
    .eq("device_id", curriculumRow.device_id)
    .maybeSingle();
  if (!ownership) return null;

  const { data: cmRows } = await supabase
    .from("curriculum_modules")
    .select("*, module:training_modules(*)")
    .eq("curriculum_id", args.curriculumId)
    .order("sort_order", { ascending: true });

  const moduleIds: string[] = [];
  for (const r of cmRows ?? []) {
    const mod = Array.isArray(r.module) ? r.module[0] : r.module;
    if (mod?.id) moduleIds.push(mod.id);
  }

  let progressByModule = new Map<string, ModuleProgressRow>();
  if (moduleIds.length > 0) {
    let q = supabase
      .from("module_progress")
      .select("*")
      .eq("practice_id", args.practiceId)
      .in("module_id", moduleIds);
    if (args.practiceUserId) q = q.eq("practice_user_id", args.practiceUserId);
    const { data } = await q;
    progressByModule = new Map(
      ((data ?? []) as ModuleProgressRow[]).map((p) => [p.module_id, p]),
    );
  }

  const { data: cert } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("device_id", curriculumRow.device_id)
    .maybeSingle();

  return {
    curriculum: curriculumRow,
    device: curriculumRow.device,
    modules: (cmRows ?? []).map((r) => {
      const mod = (Array.isArray(r.module) ? r.module[0] : r.module) as
        | TrainingModuleRow
        | null;
      return {
        curriculum_module_id: r.id,
        sort_order: r.sort_order,
        is_required: r.is_required,
        module: mod as TrainingModuleRow,
        progress: progressByModule.get(mod?.id ?? "") ?? null,
      };
    }),
    certification: (cert as PracticeCertificationRow | null) ?? null,
  };
}

// ------------------------------------------------------------
// Single module + materials + own progress
// ------------------------------------------------------------
export interface PortalModuleDetail {
  module: TrainingModuleRow;
  materials: ModuleMaterialRow[];
  progress: ModuleProgressRow | null;
  curriculum: { id: string; title: string; device_id: string } | null;
}

export async function getModuleForPractice(args: {
  moduleId: string;
  practiceId: string;
  practiceUserId: string | null;
}): Promise<PortalModuleDetail | null> {
  const supabase = getServiceClient();

  const { data: moduleRow } = await supabase
    .from("training_modules")
    .select("*")
    .eq("id", args.moduleId)
    .eq("status", "published")
    .single();
  if (!moduleRow) return null;

  // Verify the practice has access via curriculum_modules → curriculum
  // → practice_devices.
  const { data: cmRow } = await supabase
    .from("curriculum_modules")
    .select(
      "curriculum:training_curricula(id, title, device_id, status)",
    )
    .eq("module_id", args.moduleId);

  let parentCurriculum:
    | { id: string; title: string; device_id: string }
    | null = null;
  for (const r of cmRow ?? []) {
    const c = Array.isArray(r.curriculum) ? r.curriculum[0] : r.curriculum;
    if (!c || c.status !== "published") continue;
    const { data: ownership } = await supabase
      .from("practice_devices")
      .select("device_id")
      .eq("practice_id", args.practiceId)
      .eq("device_id", c.device_id)
      .maybeSingle();
    if (ownership) {
      parentCurriculum = {
        id: c.id,
        title: c.title,
        device_id: c.device_id,
      };
      break;
    }
  }
  if (!parentCurriculum) return null;

  const { data: materials } = await supabase
    .from("module_materials")
    .select("*")
    .eq("module_id", args.moduleId)
    .order("sort_order", { ascending: true });

  let progress: ModuleProgressRow | null = null;
  if (args.practiceUserId) {
    const { data } = await supabase
      .from("module_progress")
      .select("*")
      .eq("practice_id", args.practiceId)
      .eq("practice_user_id", args.practiceUserId)
      .eq("module_id", args.moduleId)
      .maybeSingle();
    progress = (data as ModuleProgressRow | null) ?? null;
  }

  return {
    module: moduleRow as TrainingModuleRow,
    materials: (materials ?? []) as ModuleMaterialRow[],
    progress,
    curriculum: parentCurriculum,
  };
}

// ------------------------------------------------------------
// Update module progress — called every 10s during playback.
// Server clamps watch_percentage to monotonically non-decreasing.
// ------------------------------------------------------------
export async function upsertModuleProgress(args: {
  practiceId: string;
  practiceUserId: string;
  moduleId: string;
  watchPercentage: number;
  lastPositionSeconds: number;
}): Promise<{ ok: boolean; error?: string; row?: ModuleProgressRow }> {
  const supabase = getServiceClient();

  // Read existing to compute new watch_percentage (max of old + new)
  const { data: existing } = await supabase
    .from("module_progress")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("practice_user_id", args.practiceUserId)
    .eq("module_id", args.moduleId)
    .maybeSingle();

  const next: Database["public"]["Tables"]["module_progress"]["Insert"] = {
    practice_id: args.practiceId,
    practice_user_id: args.practiceUserId,
    module_id: args.moduleId,
    watch_percentage: Math.max(
      args.watchPercentage,
      (existing as ModuleProgressRow | null)?.watch_percentage ?? 0,
    ),
    last_position_seconds: args.lastPositionSeconds,
    watch_started_at:
      (existing as ModuleProgressRow | null)?.watch_started_at ??
      new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("module_progress")
    .upsert(next, {
      onConflict: "practice_id,practice_user_id,module_id",
    })
    .select("*")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Upsert failed" };
  return { ok: true, row: data as ModuleProgressRow };
}

// Acknowledge + complete — gated server-side: watch_percentage
// must be >= module.required_watch_percentage.
export async function acknowledgeAndComplete(args: {
  practiceId: string;
  practiceUserId: string;
  moduleId: string;
}): Promise<{ ok: boolean; error?: string; row?: ModuleProgressRow }> {
  const supabase = getServiceClient();

  const { data: module } = await supabase
    .from("training_modules")
    .select("required_watch_percentage, status")
    .eq("id", args.moduleId)
    .single();
  if (!module || module.status !== "published") {
    return { ok: false, error: "Module unavailable." };
  }

  const { data: existing } = await supabase
    .from("module_progress")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("practice_user_id", args.practiceUserId)
    .eq("module_id", args.moduleId)
    .maybeSingle();
  const existingRow = existing as ModuleProgressRow | null;

  const watched = existingRow?.watch_percentage ?? 0;
  if (watched < module.required_watch_percentage) {
    return {
      ok: false,
      error: `Watch at least ${module.required_watch_percentage}% before completing.`,
    };
  }

  const nowIso = new Date().toISOString();
  const update: Database["public"]["Tables"]["module_progress"]["Insert"] = {
    practice_id: args.practiceId,
    practice_user_id: args.practiceUserId,
    module_id: args.moduleId,
    watch_percentage: watched,
    last_position_seconds: existingRow?.last_position_seconds ?? 0,
    watch_started_at: existingRow?.watch_started_at ?? nowIso,
    watch_completed_at: existingRow?.watch_completed_at ?? nowIso,
    acknowledged: true,
    acknowledged_at: nowIso,
    is_complete: true,
    completed_at: nowIso,
  };

  const { data, error } = await supabase
    .from("module_progress")
    .upsert(update, {
      onConflict: "practice_id,practice_user_id,module_id",
    })
    .select("*")
    .single();
  if (error || !data)
    return { ok: false, error: error?.message ?? "Update failed" };
  return { ok: true, row: data as ModuleProgressRow };
}

// ------------------------------------------------------------
// Certify curriculum — server-validates all required modules complete
// ------------------------------------------------------------
export async function certifyCurriculum(args: {
  practiceId: string;
  practiceUserId: string;
  curriculumId: string;
}): Promise<{
  ok: boolean;
  error?: string;
  certification?: PracticeCertificationRow;
}> {
  const supabase = getServiceClient();

  const { data: curriculum } = await supabase
    .from("training_curricula")
    .select("id, device_id, status")
    .eq("id", args.curriculumId)
    .single();
  if (!curriculum || curriculum.status !== "published") {
    return { ok: false, error: "Curriculum unavailable." };
  }

  // Practice must own the device
  const { data: ownership } = await supabase
    .from("practice_devices")
    .select("device_id")
    .eq("practice_id", args.practiceId)
    .eq("device_id", curriculum.device_id)
    .maybeSingle();
  if (!ownership) {
    return { ok: false, error: "Practice does not own this device." };
  }

  // Required modules
  const { data: requiredCM } = await supabase
    .from("curriculum_modules")
    .select("module_id")
    .eq("curriculum_id", args.curriculumId)
    .eq("is_required", true);
  const requiredIds = (requiredCM ?? []).map((r) => r.module_id);
  if (requiredIds.length === 0) {
    return {
      ok: false,
      error: "Curriculum has no required modules. Contact admin.",
    };
  }

  // Any practice user counts toward completion (Q8 + portal flow:
  // certification is per-practice, not per-user; the certified_by
  // is whoever clicks the button).
  const { data: completed } = await supabase
    .from("module_progress")
    .select("module_id")
    .eq("practice_id", args.practiceId)
    .eq("is_complete", true)
    .in("module_id", requiredIds);
  const completedSet = new Set(
    (completed ?? []).map((r) => r.module_id as string),
  );
  for (const id of requiredIds) {
    if (!completedSet.has(id)) {
      return {
        ok: false,
        error: "Not all required modules are complete.",
      };
    }
  }

  const nowIso = new Date().toISOString();
  // Upsert (might already exist as 'in_progress')
  const { data, error } = await supabase
    .from("practice_certifications")
    .upsert(
      {
        practice_id: args.practiceId,
        device_id: curriculum.device_id,
        curriculum_id: args.curriculumId,
        status: "certified",
        certified_at: nowIso,
        certified_by_user_id: args.practiceUserId,
        recert_required: false,
        recert_reason: null,
      },
      { onConflict: "practice_id,device_id" },
    )
    .select("*")
    .single();
  if (error || !data)
    return { ok: false, error: error?.message ?? "Certification failed" };

  return {
    ok: true,
    certification: data as PracticeCertificationRow,
  };
}

// ------------------------------------------------------------
// Certification gate — used by both UI filter and POST treatment route
// ------------------------------------------------------------
export async function isPracticeCertifiedForDevice(
  practiceId: string,
  deviceId: string,
): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc(
    "is_practice_certified_for_device",
    {
      p_practice_id: practiceId,
      p_device_id: deviceId,
    },
  );
  if (error) return false;
  return Boolean(data);
}

// Returns the device_ids the given protocol is tagged with via the
// protocol_devices join. Used by the treatment POST cert gate to
// intersect with the practice's certified devices.
export async function protocolDeviceIds(protocolId: string): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("protocol_devices")
    .select("device_id")
    .eq("protocol_id", protocolId);
  return ((data ?? []) as Array<{ device_id: string }>).map((r) => r.device_id);
}

export async function certifiedDeviceIdsForPractice(
  practiceId: string,
): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("practice_certifications")
    .select("device_id, status, expires_at")
    .eq("practice_id", practiceId)
    .eq("status", "certified");
  const now = Date.now();
  return ((data ?? []) as Array<{
    device_id: string;
    status: string;
    expires_at: string | null;
  }>)
    .filter((c) => !c.expires_at || new Date(c.expires_at).getTime() > now)
    .map((c) => c.device_id);
}

// ------------------------------------------------------------
// Signed video / material URL — short-lived, server-issued
// ------------------------------------------------------------
export async function signTrainingObjectUrl(args: {
  bucket: "training-videos" | "training-materials";
  storagePath: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase.storage
    .from(args.bucket)
    .createSignedUrl(args.storagePath, args.expiresInSeconds ?? 60 * 60);
  return data?.signedUrl ?? null;
}

// ------------------------------------------------------------
// Fetch certification + practice info for the certificate page
// ------------------------------------------------------------
export interface CertificateData {
  certification: PracticeCertificationRow;
  practice: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
  };
  device: { id: string; display_name: string; slug: string };
  curriculum: TrainingCurriculumRow;
  certified_by: {
    id: string;
    full_name: string;
    role_label: string | null;
  } | null;
}

export async function getCertificateData(args: {
  practiceId: string;
  deviceId: string;
}): Promise<CertificateData | null> {
  const supabase = getServiceClient();

  const { data: cert } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("device_id", args.deviceId)
    .single();
  if (!cert || cert.status !== "certified") return null;

  const { data: practice } = await supabase
    .from("practices")
    .select("id, name, city, state")
    .eq("id", args.practiceId)
    .single();
  if (!practice) return null;

  const { data: device } = await supabase
    .from("devices")
    .select("id, display_name, slug")
    .eq("id", args.deviceId)
    .single();
  if (!device) return null;

  const { data: curriculum } = await supabase
    .from("training_curricula")
    .select("*")
    .eq("id", cert.curriculum_id)
    .single();
  if (!curriculum) return null;

  let certifiedBy: CertificateData["certified_by"] = null;
  if (cert.certified_by_user_id) {
    const { data } = await supabase
      .from("practice_authorized_users")
      .select("id, full_name, role_label")
      .eq("id", cert.certified_by_user_id)
      .single();
    certifiedBy = (data as CertificateData["certified_by"]) ?? null;
  }

  return {
    certification: cert as PracticeCertificationRow,
    practice: practice as CertificateData["practice"],
    device: device as CertificateData["device"],
    curriculum: curriculum as TrainingCurriculumRow,
    certified_by: certifiedBy,
  };
}
