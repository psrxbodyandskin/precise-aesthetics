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
// listCurriculaForPractice — P9.1 reshape
// ------------------------------------------------------------
// Returns raw data for /portal/training overview cards. With per-
// user gating, "have I watched this?" + "am I certified?" are
// per-active-user. The client wrapper picks the active user from
// localStorage and computes per-user stats from these maps.
// ------------------------------------------------------------
export interface PortalCurriculumOverview {
  device_id: string;
  device_display_name: string;
  device_slug: string;
  curriculum: TrainingCurriculumRow | null;
  /** Modules in the curriculum, in sort order. */
  modules: Array<{
    id: string;
    is_required: boolean;
    video_duration_seconds: number | null;
  }>;
  /** module_id → user_id → progress row. */
  progressByModuleAndUser: Record<string, Record<string, ModuleProgressRow>>;
  /** user_id → certification row for this device. */
  certificationsByUser: Record<string, PracticeCertificationRow>;
}

export async function listCurriculaForPractice(
  practiceId: string,
): Promise<PortalCurriculumOverview[]> {
  const supabase = getServiceClient();

  const { data: deviceRows } = await supabase
    .from("practice_devices")
    .select("device_id, device:devices(id, display_name, slug)")
    .eq("practice_id", practiceId);
  if (!deviceRows || deviceRows.length === 0) return [];

  const deviceIds = deviceRows.map((r) => r.device_id);

  const { data: curricula } = await supabase
    .from("training_curricula")
    .select("*")
    .in("device_id", deviceIds)
    .eq("status", "published");
  const curriculaList = (curricula ?? []) as TrainingCurriculumRow[];

  const { data: certs } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", practiceId)
    .in("device_id", deviceIds);

  const curriculumIds = curriculaList.map((c) => c.id);
  const { data: cmRows } = curriculumIds.length
    ? await supabase
        .from("curriculum_modules")
        .select(
          "curriculum_id, is_required, sort_order, module:training_modules(id, video_duration_seconds)",
        )
        .in("curriculum_id", curriculumIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  const allModuleIds: string[] = [];
  for (const r of cmRows ?? []) {
    const mod = Array.isArray(r.module) ? r.module[0] : r.module;
    if (mod?.id) allModuleIds.push(mod.id);
  }

  // module_id → user_id → progress
  const progressByModuleAndUser = new Map<
    string,
    Record<string, ModuleProgressRow>
  >();
  if (allModuleIds.length > 0) {
    const { data } = await supabase
      .from("module_progress")
      .select("*")
      .eq("practice_id", practiceId)
      .in("module_id", allModuleIds);
    for (const p of (data ?? []) as ModuleProgressRow[]) {
      if (!p.practice_user_id) continue;
      const existing = progressByModuleAndUser.get(p.module_id) ?? {};
      existing[p.practice_user_id] = p;
      progressByModuleAndUser.set(p.module_id, existing);
    }
  }

  const curriculumByDevice = new Map<string, TrainingCurriculumRow>();
  for (const c of curriculaList) curriculumByDevice.set(c.device_id, c);

  // device_id → user_id → cert
  const certsByDeviceAndUser = new Map<
    string,
    Record<string, PracticeCertificationRow>
  >();
  for (const c of (certs ?? []) as PracticeCertificationRow[]) {
    const existing = certsByDeviceAndUser.get(c.device_id) ?? {};
    if (c.practice_user_id) existing[c.practice_user_id] = c;
    certsByDeviceAndUser.set(c.device_id, existing);
  }

  // Modules per curriculum (ordered)
  const modulesByCurriculum = new Map<
    string,
    Array<{ id: string; is_required: boolean; video_duration_seconds: number | null }>
  >();
  for (const r of cmRows ?? []) {
    const mod = Array.isArray(r.module) ? r.module[0] : r.module;
    if (!mod?.id) continue;
    const list = modulesByCurriculum.get(r.curriculum_id) ?? [];
    list.push({
      id: mod.id,
      is_required: r.is_required,
      video_duration_seconds: mod.video_duration_seconds ?? null,
    });
    modulesByCurriculum.set(r.curriculum_id, list);
  }

  return deviceRows.map((row) => {
    const dev = Array.isArray(row.device) ? row.device[0] : row.device;
    const curriculum = curriculumByDevice.get(row.device_id) ?? null;
    const modules = curriculum
      ? modulesByCurriculum.get(curriculum.id) ?? []
      : [];

    // Trim progress to only the modules in this curriculum.
    const progressByModuleAndUserForThis: Record<
      string,
      Record<string, ModuleProgressRow>
    > = {};
    for (const m of modules) {
      const entry = progressByModuleAndUser.get(m.id);
      if (entry) progressByModuleAndUserForThis[m.id] = entry;
    }

    return {
      device_id: row.device_id,
      device_display_name: dev?.display_name ?? "Device",
      device_slug: dev?.slug ?? "",
      curriculum,
      modules,
      progressByModuleAndUser: progressByModuleAndUserForThis,
      certificationsByUser: certsByDeviceAndUser.get(row.device_id) ?? {},
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
    /** Progress rows for this module across every practice user.
     *  The active picker user picks the right one client-side. */
    progressByUser: Record<string, ModuleProgressRow>;
  }>;
  /** Per-user certifications for this curriculum's device. */
  certificationsByUser: Record<string, PracticeCertificationRow>;
}

export async function getCurriculumForPractice(args: {
  curriculumId: string;
  practiceId: string;
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

  // Map: module_id → user_id → progress row
  const progressByModuleAndUser = new Map<
    string,
    Record<string, ModuleProgressRow>
  >();
  if (moduleIds.length > 0) {
    const { data } = await supabase
      .from("module_progress")
      .select("*")
      .eq("practice_id", args.practiceId)
      .in("module_id", moduleIds);
    for (const p of (data ?? []) as ModuleProgressRow[]) {
      if (!p.practice_user_id) continue;
      const existing = progressByModuleAndUser.get(p.module_id) ?? {};
      existing[p.practice_user_id] = p;
      progressByModuleAndUser.set(p.module_id, existing);
    }
  }

  // P9.1 — fetch ALL certs for this practice+device. Multiple
  // users on the practice can each hold their own cert; client
  // resolves the active picker user's cert.
  const { data: certs } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("device_id", curriculumRow.device_id);
  const certificationsByUser: Record<string, PracticeCertificationRow> = {};
  for (const c of (certs ?? []) as PracticeCertificationRow[]) {
    if (c.practice_user_id) certificationsByUser[c.practice_user_id] = c;
  }

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
        progressByUser: progressByModuleAndUser.get(mod?.id ?? "") ?? {},
      };
    }),
    certificationsByUser,
  };
}

// ------------------------------------------------------------
// Single module + materials + own progress
// ------------------------------------------------------------
export interface PortalModuleDetail {
  module: TrainingModuleRow;
  materials: ModuleMaterialRow[];
  /** All progress rows for this module, keyed by practice_user_id.
   *  The client picks the right one based on the active picker user
   *  (we can't filter on the server because the picker hydrates
   *  from localStorage after SSR). */
  progressByUser: Record<string, ModuleProgressRow>;
  curriculum: { id: string; title: string; device_id: string } | null;
  /** Next module by sort_order in the same curriculum, if any. */
  nextModuleId: string | null;
}

export async function getModuleForPractice(args: {
  moduleId: string;
  practiceId: string;
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

  // Fetch progress rows for every practice_user on this module.
  // Client-side picker decides which row to show based on activeUserId.
  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("module_id", args.moduleId);
  const progressByUser: Record<string, ModuleProgressRow> = {};
  for (const row of (progressRows ?? []) as ModuleProgressRow[]) {
    if (row.practice_user_id) {
      progressByUser[row.practice_user_id] = row;
    }
  }

  // Next module within the parent curriculum (by sort_order).
  let nextModuleId: string | null = null;
  if (parentCurriculum) {
    const { data: ordered } = await supabase
      .from("curriculum_modules")
      .select("module_id, sort_order")
      .eq("curriculum_id", parentCurriculum.id)
      .order("sort_order", { ascending: true });
    if (ordered && ordered.length > 0) {
      const idx = ordered.findIndex((r) => r.module_id === args.moduleId);
      if (idx >= 0 && idx + 1 < ordered.length) {
        nextModuleId = ordered[idx + 1]!.module_id;
      }
    }
  }

  return {
    module: moduleRow as TrainingModuleRow,
    materials: (materials ?? []) as ModuleMaterialRow[],
    progressByUser,
    curriculum: parentCurriculum,
    nextModuleId,
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

  // P9.1 — per-user gating. Only THIS user's completed modules
  // count. Other users on the practice can't carry someone over
  // the certify threshold.
  const { data: completed } = await supabase
    .from("module_progress")
    .select("module_id")
    .eq("practice_id", args.practiceId)
    .eq("practice_user_id", args.practiceUserId)
    .eq("is_complete", true)
    .in("module_id", requiredIds);
  const completedSet = new Set(
    (completed ?? []).map((r) => r.module_id as string),
  );
  for (const id of requiredIds) {
    if (!completedSet.has(id)) {
      return {
        ok: false,
        error: "Not all required modules are complete for this user.",
      };
    }
  }

  const nowIso = new Date().toISOString();
  // Upsert (might already exist as 'in_progress' for this user)
  const { data, error } = await supabase
    .from("practice_certifications")
    .upsert(
      {
        practice_id: args.practiceId,
        practice_user_id: args.practiceUserId,
        device_id: curriculum.device_id,
        curriculum_id: args.curriculumId,
        status: "certified",
        certified_at: nowIso,
        certified_by_user_id: args.practiceUserId,
        recert_required: false,
        recert_reason: null,
      },
      { onConflict: "practice_id,practice_user_id,device_id" },
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
// Certification gate — per-user (P9.1)
// ------------------------------------------------------------
export async function isUserCertifiedForDevice(
  practiceUserId: string,
  deviceId: string,
): Promise<boolean> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc(
    "is_user_certified_for_device",
    {
      p_practice_user_id: practiceUserId,
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

// P9.1 — list of devices a specific practice user is certified for.
// Replaces certifiedDeviceIdsForPractice. Used by the treatment
// form to filter the entered_by dropdown + the protocol selector.
export async function certifiedDeviceIdsForUser(
  practiceUserId: string,
): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("practice_certifications")
    .select("device_id, status, expires_at")
    .eq("practice_user_id", practiceUserId)
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

// Practice-wide union: any device any user on the practice is
// certified for. Used by the /portal/treatments/new gate (the
// page renders the form if at least one user can log; per-user
// gating happens on the entered_by dropdown).
export async function anyCertifiedDeviceIdsForPractice(
  practiceId: string,
): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("practice_certifications")
    .select("device_id, status, expires_at")
    .eq("practice_id", practiceId)
    .eq("status", "certified");
  const now = Date.now();
  return Array.from(
    new Set(
      ((data ?? []) as Array<{
        device_id: string;
        status: string;
        expires_at: string | null;
      }>)
        .filter((c) => !c.expires_at || new Date(c.expires_at).getTime() > now)
        .map((c) => c.device_id),
    ),
  );
}

// Map: practice_user_id → Set<device_id> of devices they're
// certified for. Used by the treatment form to filter entered_by
// to users who can log THIS protocol's devices.
export async function certifiedDeviceIdsByUserForPractice(
  practiceId: string,
): Promise<Map<string, Set<string>>> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("practice_certifications")
    .select("practice_user_id, device_id, status, expires_at")
    .eq("practice_id", practiceId)
    .eq("status", "certified");
  const now = Date.now();
  const map = new Map<string, Set<string>>();
  for (const c of (data ?? []) as Array<{
    practice_user_id: string;
    device_id: string;
    status: string;
    expires_at: string | null;
  }>) {
    if (c.expires_at && new Date(c.expires_at).getTime() <= now) continue;
    const set = map.get(c.practice_user_id) ?? new Set<string>();
    set.add(c.device_id);
    map.set(c.practice_user_id, set);
  }
  return map;
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
  practiceUserId: string;
}): Promise<CertificateData | null> {
  const supabase = getServiceClient();

  const { data: cert } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", args.practiceId)
    .eq("device_id", args.deviceId)
    .eq("practice_user_id", args.practiceUserId)
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
