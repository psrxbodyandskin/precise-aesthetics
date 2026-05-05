import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// P9 — Admin training/certification data layer.
//
// All callers go through requireAdmin() upstream. The service-role
// client bypasses RLS; admin's identity is the gate at the route
// layer (not RLS itself). Audit logging happens at the route layer
// too — this module is pure CRUD.

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
// Modules
// ------------------------------------------------------------

export async function listAllModules(opts?: {
  status?: TrainingModuleRow["status"] | "all";
  limit?: number;
}): Promise<TrainingModuleRow[]> {
  const supabase = getServiceClient();
  let q = supabase
    .from("training_modules")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(opts?.limit ?? 200);
  if (opts?.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  const { data } = await q;
  return (data ?? []) as TrainingModuleRow[];
}

export async function getModuleById(
  id: string,
): Promise<TrainingModuleRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("training_modules")
    .select("*")
    .eq("id", id)
    .single();
  return (data as TrainingModuleRow) ?? null;
}

export async function createModule(args: {
  title: string;
  slug: string;
  description: string | null;
  requiredWatchPercentage: number;
  createdBy: string;
}): Promise<{ id: string; error?: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("training_modules")
    .insert({
      title: args.title,
      slug: args.slug,
      description: args.description,
      required_watch_percentage: args.requiredWatchPercentage,
      created_by: args.createdBy,
      last_updated_by: args.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { id: "", error: error?.message ?? "Insert failed" };
  }
  return { id: data.id };
}

export async function updateModule(
  id: string,
  patch: Partial<{
    title: string;
    slug: string;
    description: string | null;
    requiredWatchPercentage: number;
    status: TrainingModuleRow["status"];
    videoStoragePath: string | null;
    videoDurationSeconds: number | null;
    videoThumbnailPath: string | null;
    lastUpdatedBy: string;
  }>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const update: Database["public"]["Tables"]["training_modules"]["Update"] = {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.slug !== undefined) update.slug = patch.slug;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.requiredWatchPercentage !== undefined)
    update.required_watch_percentage = patch.requiredWatchPercentage;
  if (patch.status !== undefined) {
    update.status = patch.status;
    if (patch.status === "published") update.published_at = new Date().toISOString();
  }
  if (patch.videoStoragePath !== undefined)
    update.video_storage_path = patch.videoStoragePath;
  if (patch.videoDurationSeconds !== undefined)
    update.video_duration_seconds = patch.videoDurationSeconds;
  if (patch.videoThumbnailPath !== undefined)
    update.video_thumbnail_path = patch.videoThumbnailPath;
  if (patch.lastUpdatedBy !== undefined)
    update.last_updated_by = patch.lastUpdatedBy;

  const { error } = await supabase
    .from("training_modules")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteModule(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase.from("training_modules").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ------------------------------------------------------------
// Module materials
// ------------------------------------------------------------

export async function listModuleMaterials(
  moduleId: string,
): Promise<ModuleMaterialRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("module_materials")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });
  return (data ?? []) as ModuleMaterialRow[];
}

export async function addModuleMaterial(args: {
  moduleId: string;
  title: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  byteSize: number;
  sortOrder: number;
}): Promise<{ id: string; error?: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("module_materials")
    .insert({
      module_id: args.moduleId,
      title: args.title,
      storage_path: args.storagePath,
      filename: args.filename,
      mime_type: args.mimeType,
      byte_size: args.byteSize,
      sort_order: args.sortOrder,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { id: "", error: error?.message ?? "Insert failed" };
  }
  return { id: data.id };
}

export async function deleteModuleMaterial(
  id: string,
): Promise<{ ok: boolean; error?: string; storagePath?: string }> {
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("module_materials")
    .select("storage_path")
    .eq("id", id)
    .single();
  const { error } = await supabase.from("module_materials").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, storagePath: existing?.storage_path };
}

// ------------------------------------------------------------
// Curricula
// ------------------------------------------------------------

export async function listAllCurricula(): Promise<
  Array<TrainingCurriculumRow & { device: { id: string; display_name: string; slug: string } | null }>
> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("training_curricula")
    .select("*, device:devices(id, display_name, slug)")
    .order("updated_at", { ascending: false });
  return (
    (data ?? []) as Array<
      TrainingCurriculumRow & {
        device: { id: string; display_name: string; slug: string } | null;
      }
    >
  );
}

export async function getCurriculumById(id: string): Promise<
  | (TrainingCurriculumRow & {
      device: { id: string; display_name: string; slug: string } | null;
      modules: Array<
        CurriculumModuleRow & { module: TrainingModuleRow }
      >;
    })
  | null
> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("training_curricula")
    .select(
      `
      *,
      device:devices(id, display_name, slug),
      modules:curriculum_modules(*, module:training_modules(*))
    `,
    )
    .eq("id", id)
    .single();
  if (!data) return null;
  // Sort modules by sort_order
  const row = data as TrainingCurriculumRow & {
    device: { id: string; display_name: string; slug: string } | null;
    modules: Array<CurriculumModuleRow & { module: TrainingModuleRow }>;
  };
  row.modules = (row.modules ?? []).sort((a, b) => a.sort_order - b.sort_order);
  return row;
}

export async function createCurriculum(args: {
  deviceId: string;
  title: string;
  description: string | null;
  createdBy: string;
}): Promise<{ id: string; error?: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("training_curricula")
    .insert({
      device_id: args.deviceId,
      title: args.title,
      description: args.description,
      created_by: args.createdBy,
      last_updated_by: args.createdBy,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { id: "", error: error?.message ?? "Insert failed" };
  }
  return { id: data.id };
}

export async function updateCurriculum(
  id: string,
  patch: Partial<{
    title: string;
    description: string | null;
    status: TrainingCurriculumRow["status"];
    lastUpdatedBy: string;
  }>,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const update: Database["public"]["Tables"]["training_curricula"]["Update"] =
    {};
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.status !== undefined) {
    update.status = patch.status;
    if (patch.status === "published")
      update.published_at = new Date().toISOString();
  }
  if (patch.lastUpdatedBy !== undefined)
    update.last_updated_by = patch.lastUpdatedBy;
  const { error } = await supabase
    .from("training_curricula")
    .update(update)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addModuleToCurriculum(args: {
  curriculumId: string;
  moduleId: string;
  isRequired: boolean;
}): Promise<{ id: string; error?: string }> {
  const supabase = getServiceClient();
  // Compute next sort_order — 1 + current max
  const { data: existing } = await supabase
    .from("curriculum_modules")
    .select("sort_order")
    .eq("curriculum_id", args.curriculumId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("curriculum_modules")
    .insert({
      curriculum_id: args.curriculumId,
      module_id: args.moduleId,
      sort_order: nextOrder,
      is_required: args.isRequired,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { id: "", error: error?.message ?? "Insert failed" };
  }
  return { id: data.id };
}

export async function removeModuleFromCurriculum(args: {
  curriculumId: string;
  moduleId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("curriculum_modules")
    .delete()
    .eq("curriculum_id", args.curriculumId)
    .eq("module_id", args.moduleId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Reorder via two-pass update — clear existing sort_orders to
// negative space first (avoid the unique(curriculum_id, sort_order)
// constraint colliding mid-update), then assign final positions.
export async function reorderCurriculumModules(args: {
  curriculumId: string;
  moduleIds: string[];
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();

  // Pass 1: shift to negative space
  for (let i = 0; i < args.moduleIds.length; i++) {
    const { error } = await supabase
      .from("curriculum_modules")
      .update({ sort_order: -(i + 1) })
      .eq("curriculum_id", args.curriculumId)
      .eq("module_id", args.moduleIds[i]!);
    if (error) return { ok: false, error: error.message };
  }

  // Pass 2: assign final positions
  for (let i = 0; i < args.moduleIds.length; i++) {
    const { error } = await supabase
      .from("curriculum_modules")
      .update({ sort_order: i + 1 })
      .eq("curriculum_id", args.curriculumId)
      .eq("module_id", args.moduleIds[i]!);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ------------------------------------------------------------
// Certifications — admin views
// ------------------------------------------------------------

export interface CurriculumCertStats {
  certified: number;
  in_progress: number;
  not_started: number;
  total_practices_with_device: number;
}

export async function getCurriculumCertStats(
  curriculumId: string,
): Promise<CurriculumCertStats> {
  const supabase = getServiceClient();
  const { data: curriculum } = await supabase
    .from("training_curricula")
    .select("device_id")
    .eq("id", curriculumId)
    .single();
  if (!curriculum) {
    return {
      certified: 0,
      in_progress: 0,
      not_started: 0,
      total_practices_with_device: 0,
    };
  }
  const deviceId = curriculum.device_id;

  // Count practices that own this device.
  const { count: ownCount } = await supabase
    .from("practice_devices")
    .select("practice_id", { count: "exact", head: true })
    .eq("device_id", deviceId);

  // P9.1 — certs are now per-user. Roll up to "practices with at
  // least one certified user / at least one in-progress user" for
  // the curriculum overview stats.
  const { data: certs } = await supabase
    .from("practice_certifications")
    .select("practice_id, status")
    .eq("device_id", deviceId);

  const certifiedPractices = new Set<string>();
  const inProgressPractices = new Set<string>();
  for (const c of (certs ?? []) as Array<{ practice_id: string; status: string }>) {
    if (c.status === "certified") certifiedPractices.add(c.practice_id);
    else if (c.status === "in_progress")
      inProgressPractices.add(c.practice_id);
  }
  // A practice that has both 'certified' + 'in_progress' rows
  // (different users) counts as certified.
  for (const id of certifiedPractices) inProgressPractices.delete(id);

  const certified = certifiedPractices.size;
  const inProgress = inProgressPractices.size;
  const total = ownCount ?? 0;
  const notStarted = Math.max(0, total - certified - inProgress);

  return {
    certified,
    in_progress: inProgress,
    not_started: notStarted,
    total_practices_with_device: total,
  };
}

// Practice detail extension: per-device-per-user matrix of
// certifications. P9.1 — certs are now per-user, so each device
// can have multiple certs (one per certified user). The panel
// below renders one row per (device, user) pair where a cert
// exists, plus a "no certifications yet" state per device.
export interface DeviceCertSummary {
  device_id: string;
  device_display_name: string;
  device_slug: string;
  certifications: Array<{
    cert: PracticeCertificationRow;
    user: {
      id: string;
      full_name: string;
      role_label: string | null;
      is_active: boolean;
    } | null;
  }>;
}

export async function getCertificationsForPractice(
  practiceId: string,
): Promise<DeviceCertSummary[]> {
  const supabase = getServiceClient();
  const { data: deviceRows } = await supabase
    .from("practice_devices")
    .select("device_id, device:devices(id, display_name, slug)")
    .eq("practice_id", practiceId);

  const { data: certs } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", practiceId);

  // Resolve practice user names referenced by the cert rows
  const userIds = Array.from(
    new Set(
      ((certs ?? []) as PracticeCertificationRow[])
        .map((c) => c.practice_user_id)
        .filter(Boolean),
    ),
  );
  const usersById = new Map<
    string,
    {
      id: string;
      full_name: string;
      role_label: string | null;
      is_active: boolean;
    }
  >();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from("practice_authorized_users")
      .select("id, full_name, role_label, is_active")
      .in("id", userIds);
    for (const u of (users ?? []) as Array<{
      id: string;
      full_name: string;
      role_label: string | null;
      is_active: boolean;
    }>) {
      usersById.set(u.id, u);
    }
  }

  // Group certs by device
  const certsByDevice = new Map<string, PracticeCertificationRow[]>();
  for (const c of (certs ?? []) as PracticeCertificationRow[]) {
    const list = certsByDevice.get(c.device_id) ?? [];
    list.push(c);
    certsByDevice.set(c.device_id, list);
  }

  return (deviceRows ?? []).map((row) => {
    const dev = Array.isArray(row.device) ? row.device[0] : row.device;
    const list = certsByDevice.get(row.device_id) ?? [];
    return {
      device_id: row.device_id,
      device_display_name: dev?.display_name ?? "Device",
      device_slug: dev?.slug ?? "",
      certifications: list.map((cert) => ({
        cert,
        user: usersById.get(cert.practice_user_id) ?? null,
      })),
    };
  });
}

// P9.1 — setRecertFlag now scopes per-user. Caller must pass the
// practice_authorized_users.id of the cert holder. (The route
// signature is /admin/practices/[id]/certifications/[deviceId]/
// users/[userId]/recert.)
export async function setRecertFlag(args: {
  practiceId: string;
  practiceUserId: string;
  deviceId: string;
  recertRequired: boolean;
  recertReason: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("practice_certifications")
    .update({
      recert_required: args.recertRequired,
      recert_reason: args.recertRequired ? args.recertReason : null,
    })
    .eq("practice_id", args.practiceId)
    .eq("practice_user_id", args.practiceUserId)
    .eq("device_id", args.deviceId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ------------------------------------------------------------
// Training progress per practice user (admin practice detail)
// ------------------------------------------------------------
// Per-curriculum, per-user breakdown: who's certified, who's in
// progress, who hasn't started. Drives the "Training progress"
// panel on /admin/practices/[id].

export interface AdminTrainingUserStatus {
  user: {
    id: string;
    full_name: string;
    role_label: string | null;
    is_active: boolean;
  };
  required_complete: number;
  required_total: number;
  /** Status derived from completion + certification ledger. */
  status: "certified" | "complete" | "in_progress" | "not_started";
}

export interface AdminTrainingCurriculumProgress {
  curriculum: TrainingCurriculumRow;
  device: { id: string; display_name: string; slug: string };
  certification: PracticeCertificationRow | null;
  users: AdminTrainingUserStatus[];
}

export async function getTrainingProgressForPractice(
  practiceId: string,
): Promise<AdminTrainingCurriculumProgress[]> {
  const supabase = getServiceClient();

  // 1. Practice's owned devices
  const { data: deviceRows } = await supabase
    .from("practice_devices")
    .select("device_id, device:devices(id, display_name, slug)")
    .eq("practice_id", practiceId);
  const deviceIds = (deviceRows ?? []).map((r) => r.device_id);
  if (deviceIds.length === 0) return [];

  // 2. Curricula for those devices (any status — admins see drafts too)
  const { data: curricula } = await supabase
    .from("training_curricula")
    .select("*")
    .in("device_id", deviceIds);
  const curriculaList = (curricula ?? []) as TrainingCurriculumRow[];
  if (curriculaList.length === 0) return [];

  // 3. Required modules per curriculum
  const curriculumIds = curriculaList.map((c) => c.id);
  const { data: cmRows } = await supabase
    .from("curriculum_modules")
    .select("curriculum_id, module_id, is_required")
    .in("curriculum_id", curriculumIds);
  const requiredByCurriculum = new Map<string, Set<string>>();
  for (const r of cmRows ?? []) {
    if (!r.is_required) continue;
    const set = requiredByCurriculum.get(r.curriculum_id) ?? new Set<string>();
    set.add(r.module_id);
    requiredByCurriculum.set(r.curriculum_id, set);
  }

  // 4. Authorized users on the practice
  const { data: users } = await supabase
    .from("practice_authorized_users")
    .select("id, full_name, role_label, is_active")
    .eq("practice_id", practiceId)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  const userList = (users ?? []) as Array<{
    id: string;
    full_name: string;
    role_label: string | null;
    is_active: boolean;
  }>;

  // 5. Module progress for the whole practice (filter by required
  //    module_ids in code below)
  const { data: progressRows } = await supabase
    .from("module_progress")
    .select("practice_user_id, module_id, is_complete, watch_percentage")
    .eq("practice_id", practiceId);
  const completedByUser = new Map<string, Set<string>>();
  const startedByUser = new Map<string, Set<string>>();
  for (const r of (progressRows ?? []) as Array<{
    practice_user_id: string | null;
    module_id: string;
    is_complete: boolean;
    watch_percentage: number;
  }>) {
    if (!r.practice_user_id) continue;
    if (r.is_complete) {
      const set = completedByUser.get(r.practice_user_id) ?? new Set<string>();
      set.add(r.module_id);
      completedByUser.set(r.practice_user_id, set);
    } else if (r.watch_percentage > 0) {
      const set = startedByUser.get(r.practice_user_id) ?? new Set<string>();
      set.add(r.module_id);
      startedByUser.set(r.practice_user_id, set);
    }
  }

  // 6. Certifications for this practice's devices, keyed by
  //    (device_id, practice_user_id) — per-user under P9.1.
  const { data: certRows } = await supabase
    .from("practice_certifications")
    .select("*")
    .eq("practice_id", practiceId)
    .in("device_id", deviceIds);
  const certByDeviceAndUser = new Map<string, PracticeCertificationRow>();
  for (const c of (certRows ?? []) as PracticeCertificationRow[]) {
    certByDeviceAndUser.set(`${c.device_id}::${c.practice_user_id}`, c);
  }

  // 7. Build the result
  const deviceById = new Map<
    string,
    { id: string; display_name: string; slug: string }
  >();
  for (const row of deviceRows ?? []) {
    const dev = Array.isArray(row.device) ? row.device[0] : row.device;
    if (dev) deviceById.set(row.device_id, dev);
  }

  return curriculaList.map((curriculum) => {
    const required = requiredByCurriculum.get(curriculum.id) ?? new Set<string>();
    const requiredTotal = required.size;

    const userStatuses: AdminTrainingUserStatus[] = userList.map((user) => {
      const completedSet = completedByUser.get(user.id) ?? new Set<string>();
      const startedSet = startedByUser.get(user.id) ?? new Set<string>();
      let completedCount = 0;
      let inProgressCount = 0;
      for (const mid of required) {
        if (completedSet.has(mid)) completedCount++;
        else if (startedSet.has(mid)) inProgressCount++;
      }

      // Per-user cert lookup
      const userCert =
        certByDeviceAndUser.get(`${curriculum.device_id}::${user.id}`) ?? null;
      const userCertified =
        userCert?.status === "certified" &&
        (!userCert.expires_at ||
          new Date(userCert.expires_at).getTime() > Date.now());

      let status: AdminTrainingUserStatus["status"];
      if (userCertified) {
        status = "certified";
      } else if (
        requiredTotal > 0 &&
        completedCount === requiredTotal
      ) {
        status = "complete";
      } else if (completedCount > 0 || inProgressCount > 0) {
        status = "in_progress";
      } else {
        status = "not_started";
      }
      return {
        user,
        required_complete: completedCount,
        required_total: requiredTotal,
        status,
      };
    });

    // "Lead cert" — first certified user's cert if any (used for
    // the device-level summary chip in the panel header).
    const leadCert =
      userList
        .map((u) => certByDeviceAndUser.get(`${curriculum.device_id}::${u.id}`))
        .find((c) => c?.status === "certified") ?? null;

    return {
      curriculum,
      device: deviceById.get(curriculum.device_id) ?? {
        id: curriculum.device_id,
        display_name: "Device",
        slug: "",
      },
      certification: leadCert ?? null,
      users: userStatuses,
    };
  });
}
