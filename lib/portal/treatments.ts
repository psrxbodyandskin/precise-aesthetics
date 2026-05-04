import "server-only";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { getServiceClient } from "@/lib/supabase/server";
import type { TreatmentLogValues } from "@/lib/schemas/treatment";
import type { TreatmentFilters } from "./filters";

// P6 — Server-only data layer for treatments + photos + adverse events.
//
// Read paths (list, get) use the SESSION-AUTHED client so Class A RLS
// enforces practice-scoped visibility. Write paths use the SERVICE-ROLE
// client because we need to insert into multiple tables atomically and
// upload files to a private storage bucket — RLS would still enforce
// the same boundaries since we re-verify practice_id at the API layer
// before issuing service-role inserts.

export interface PortalTreatmentRow {
  id: string;
  treatment_date: string;
  protocol_id: string;
  protocol_version_id: string;
  protocol_version_label: string;
  indication: string;
  patient_fitzpatrick: string;
  entered_by_name: string;
  session_number: number;
  has_followup: boolean;
  created_at: string;
  protocol: {
    title: string;
    slug: string;
  } | null;
}

// ------------------------------------------------------------
// listTreatmentsForPractice — drives /portal/treatments list
// ------------------------------------------------------------
export async function listTreatmentsForPractice(opts: {
  limit?: number;
  offset?: number;
} = {}): Promise<PortalTreatmentRow[]> {
  const supabase = await getAuthServerClient();
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const { data, error } = await supabase
    .from("treatments")
    .select(
      `
      id,
      treatment_date,
      protocol_id,
      protocol_version_id,
      protocol_version_label,
      indication,
      patient_fitzpatrick,
      entered_by_name,
      session_number,
      has_followup,
      created_at,
      protocol:protocols(title, slug)
    `,
    )
    .order("treatment_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[portal/treatments] list error", error);
    return [];
  }
  return (data ?? []).map(normalizeTreatmentRow);
}

// ------------------------------------------------------------
// listFilteredTreatmentsForPractice — drives the P7 filterable list.
// RLS enforces practice-scoping; app-layer filters refine within.
//
// Includes per-row indicators for has-photos and has-adverse-event.
// We post-filter on those flags (after the SQL fetch) because the
// counts come back as nested objects from PostgREST and aren't
// trivial to filter at the query layer without RPCs. The list is
// paginated server-side first; the post-filter applies to the page
// slice — practitioner sees up to PAGE_SIZE rows that match. This
// is acceptable because the indicators usually don't drastically
// trim the result set; if they do, the UX is "see more on next
// page" rather than "missing rows."
// ------------------------------------------------------------

export interface FilteredTreatmentRow extends PortalTreatmentRow {
  photo_count: number;
  adverse_event_id: string | null;
}

const TREATMENTS_PAGE_SIZE = 50;

export async function listFilteredTreatmentsForPractice(
  filters: TreatmentFilters,
): Promise<{
  treatments: FilteredTreatmentRow[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const supabase = await getAuthServerClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = TREATMENTS_PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  let q = supabase
    .from("treatments")
    .select(
      `
      id,
      treatment_date,
      protocol_id,
      protocol_version_id,
      protocol_version_label,
      indication,
      patient_fitzpatrick,
      entered_by_name,
      session_number,
      has_followup,
      created_at,
      protocol:protocols(title, slug),
      photos:treatment_photos(id),
      adverse:treatment_adverse_events(id)
    `,
      { count: "exact" },
    )
    .order("treatment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().replace(/[%]/g, "");
    q = q.or(
      `notes.ilike.%${term}%,treatment_site.ilike.%${term}%,entered_by_name.ilike.%${term}%`,
    );
  }
  if (filters.dateFrom) q = q.gte("treatment_date", filters.dateFrom);
  if (filters.dateTo) q = q.lte("treatment_date", filters.dateTo);
  if (filters.protocolIds && filters.protocolIds.length > 0) {
    q = q.in("protocol_id", filters.protocolIds);
  }
  if (filters.indications && filters.indications.length > 0) {
    q = q.in("indication", filters.indications);
  }
  if (filters.fitzpatrickTypes && filters.fitzpatrickTypes.length > 0) {
    q = q.in("patient_fitzpatrick", filters.fitzpatrickTypes);
  }

  q = q.range(start, end);

  const { data, error, count } = await q;
  if (error) {
    console.error("[portal/treatments] filtered list error", error);
    return { treatments: [], total: 0, page, pageSize };
  }

  let rows = (data ?? []).map(normalizeFilteredTreatmentRow);

  if (filters.hasPhotos) {
    rows = rows.filter((r) => r.photo_count > 0);
  }
  if (filters.hasAdverseEvent) {
    rows = rows.filter((r) => r.adverse_event_id !== null);
  }

  return { treatments: rows, total: count ?? 0, page, pageSize };
}

function normalizeFilteredTreatmentRow(raw: unknown): FilteredTreatmentRow {
  const r = raw as Record<string, unknown>;
  const proto = r.protocol;
  const protocol = Array.isArray(proto)
    ? ((proto[0] ?? null) as PortalTreatmentRow["protocol"])
    : ((proto ?? null) as PortalTreatmentRow["protocol"]);
  const photos = r.photos as Array<{ id: string }> | null | undefined;
  const adverse = r.adverse;
  const adverseRow = Array.isArray(adverse)
    ? ((adverse[0] ?? null) as { id: string } | null)
    : ((adverse ?? null) as { id: string } | null);
  return {
    id: r.id as string,
    treatment_date: r.treatment_date as string,
    protocol_id: r.protocol_id as string,
    protocol_version_id: r.protocol_version_id as string,
    protocol_version_label: r.protocol_version_label as string,
    indication: r.indication as string,
    patient_fitzpatrick: r.patient_fitzpatrick as string,
    entered_by_name: r.entered_by_name as string,
    session_number: r.session_number as number,
    has_followup: r.has_followup as boolean,
    created_at: r.created_at as string,
    protocol,
    photo_count: photos ? photos.length : 0,
    adverse_event_id: adverseRow ? adverseRow.id : null,
  };
}

// ------------------------------------------------------------
// Distinct values for filter dropdown population — show only the
// protocols / indications this practice has ACTUALLY logged
// against, not the full library. Avoids cluttering the filter UI
// with options that produce zero results.
// ------------------------------------------------------------

export async function getDistinctProtocolsForPractice(): Promise<
  Array<{ id: string; title: string; current_version: string | null }>
> {
  const supabase = await getAuthServerClient();
  const { data } = await supabase
    .from("treatments")
    .select(
      `
      protocol_id,
      protocol:protocols(id, title, current_version)
    `,
    )
    .order("treatment_date", { ascending: false })
    .limit(1000);

  if (!data) return [];
  const seen = new Map<
    string,
    { id: string; title: string; current_version: string | null }
  >();
  for (const r of data as unknown as Array<{
    protocol_id: string;
    protocol:
      | { id: string; title: string; current_version: string | null }
      | { id: string; title: string; current_version: string | null }[]
      | null;
  }>) {
    const proto = Array.isArray(r.protocol) ? r.protocol[0] : r.protocol;
    if (proto && !seen.has(proto.id)) {
      seen.set(proto.id, proto);
    }
  }
  return Array.from(seen.values()).sort((a, b) =>
    a.title.localeCompare(b.title),
  );
}

export async function getDistinctIndicationsForPractice(): Promise<string[]> {
  const supabase = await getAuthServerClient();
  const { data } = await supabase
    .from("treatments")
    .select("indication")
    .limit(1000);
  if (!data) return [];
  const set = new Set<string>();
  for (const r of data as Array<{ indication: string }>) {
    if (r.indication) set.add(r.indication);
  }
  return Array.from(set).sort();
}

function normalizeTreatmentRow(raw: unknown): PortalTreatmentRow {
  const r = raw as Record<string, unknown>;
  const proto = r.protocol;
  const protocol = Array.isArray(proto)
    ? ((proto[0] ?? null) as PortalTreatmentRow["protocol"])
    : ((proto ?? null) as PortalTreatmentRow["protocol"]);
  return {
    id: r.id as string,
    treatment_date: r.treatment_date as string,
    protocol_id: r.protocol_id as string,
    protocol_version_id: r.protocol_version_id as string,
    protocol_version_label: r.protocol_version_label as string,
    indication: r.indication as string,
    patient_fitzpatrick: r.patient_fitzpatrick as string,
    entered_by_name: r.entered_by_name as string,
    session_number: r.session_number as number,
    has_followup: r.has_followup as boolean,
    created_at: r.created_at as string,
    protocol,
  };
}

// ------------------------------------------------------------
// getTreatmentByIdForPractice — drives /portal/treatments/[id]
// ------------------------------------------------------------
export type TreatmentDetailRow = {
  id: string;
  practice_id: string;
  treatment_date: string;
  protocol_id: string;
  protocol_version_id: string;
  protocol_version_label: string;
  protocol_deviation: boolean;
  protocol_deviation_reason: string | null;
  patient_anon_id: string | null;
  patient_age_range: string;
  patient_fitzpatrick: string;
  patient_sex: string | null;
  indication: string;
  treatment_site: string | null;
  session_number: number;
  wavelength_nm: number | null;
  fluence_j_per_cm2: number | null;
  pulse_duration_ps: number | null;
  spot_size_mm: number | null;
  total_pulses: number | null;
  treatment_duration_minutes: number | null;
  prep_kit_used: boolean;
  recovery_kit_dispensed: boolean;
  maintenance_kit_recommended: boolean;
  notes: string | null;
  entered_by_name: string;
  protocol:
    | { title: string; slug: string }
    | { title: string; slug: string }[]
    | null;
};

export type TreatmentPhotoRow = {
  id: string;
  treatment_id: string;
  storage_path: string;
  filename: string;
  mime_type: string;
  capture_phase: string | null;
  caption: string | null;
};

export async function getTreatmentByIdForPractice(
  id: string,
): Promise<{
  treatment: TreatmentDetailRow;
  photos: TreatmentPhotoRow[];
  adverseEvent: {
    id: string;
    description: string;
    status: string;
    created_at: string;
    status_changed_at: string | null;
  } | null;
} | null> {
  const supabase = await getAuthServerClient();

  const [{ data: treatment }, { data: photos }, { data: adverse }] =
    await Promise.all([
      supabase
        .from("treatments")
        .select(
          `*, protocol:protocols(title, slug, indication_category:indication_categories(title))`,
        )
        .eq("id", id)
        .single(),
      supabase
        .from("treatment_photos")
        .select("*")
        .eq("treatment_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("treatment_adverse_events")
        .select("id, description, status, created_at, status_changed_at")
        .eq("treatment_id", id)
        .maybeSingle(),
    ]);

  if (!treatment) return null;
  return {
    treatment: treatment as unknown as TreatmentDetailRow,
    photos: (photos ?? []) as unknown as TreatmentPhotoRow[],
    adverseEvent: adverse as
      | {
          id: string;
          description: string;
          status: string;
          created_at: string;
          status_changed_at: string | null;
        }
      | null,
  };
}

// ------------------------------------------------------------
// listVisibleProtocolsForPractice — feeds the protocol selector
// Returns only protocols the practice can see (RLS-gated, status='published',
// device-tagged).
// ------------------------------------------------------------
export interface PortalProtocolOption {
  id: string;
  title: string;
  slug: string;
  current_version: string | null;
  indication_tags: string[] | null;
  indication_category: { id: string; title: string } | { id: string; title: string }[] | null;
}

export async function listVisibleProtocolsForPractice(): Promise<PortalProtocolOption[]> {
  const supabase = await getAuthServerClient();
  const { data, error } = await supabase
    .from("protocols")
    .select(
      `
      id,
      title,
      slug,
      current_version,
      indication_tags,
      indication_category:indication_categories(id, title)
    `,
    )
    .order("title", { ascending: true });
  if (error) return [];
  return (data ?? []) as unknown as PortalProtocolOption[];
}

// ------------------------------------------------------------
// resolveCurrentVersionId — given a protocol_id, look up the
// CURRENT (most-recent) version row id. Used by the API on submit
// to lock the version reference at log time.
// ------------------------------------------------------------
export async function resolveCurrentVersionId(
  protocolId: string,
): Promise<{ versionId: string; versionLabel: string } | null> {
  const supabase = await getAuthServerClient();
  // Pull current_version from the protocol row, then resolve the
  // matching version snapshot id. If the protocol has been seen by
  // the practice (RLS lets them read it), this two-step lookup also
  // implicitly verifies visibility.
  const { data: protocolRaw } = await supabase
    .from("protocols")
    .select("current_version")
    .eq("id", protocolId)
    .single();
  const protocol = protocolRaw as { current_version: string | null } | null;
  if (!protocol?.current_version) return null;

  const { data: versionRaw } = await supabase
    .from("protocol_versions")
    .select("id, version")
    .eq("protocol_id", protocolId)
    .eq("version", protocol.current_version)
    .single();
  const version = versionRaw as { id: string; version: string } | null;
  if (!version) return null;

  return { versionId: version.id, versionLabel: version.version };
}

// ------------------------------------------------------------
// createTreatment — atomic-ish insert of treatment + photos + adverse event.
//
// Uses service-role to bypass RLS so we can write across three tables
// in one logical operation. We've already verified practice_id at the
// API layer via requirePractice() and the session-authed
// resolveCurrentVersionId() check.
//
// Photo files are uploaded SEPARATELY by the caller (the API route
// handles multipart upload to storage and passes back path strings);
// this layer just inserts the metadata rows.
// ------------------------------------------------------------
interface PhotoInsert {
  storage_path: string;
  filename: string;
  mime_type: string;
  byte_size: number;
  capture_phase?: "before" | "during" | "after" | "followup" | null;
  caption?: string | null;
  consent_affirmed: boolean;
}

export async function createTreatment(args: {
  practiceId: string;
  values: TreatmentLogValues;
  enteredByName: string;
  protocolVersionId: string;
  protocolVersionLabel: string;
  photos: PhotoInsert[];
}): Promise<
  | { status: "ok"; treatmentId: string; adverseEventId: string | null }
  | { status: "error"; message: string }
> {
  const supabase = getServiceClient();

  // 1. Insert treatment
  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments")
    .insert({
      practice_id: args.practiceId,
      entered_by_user_id: args.values.enteredByUserId,
      entered_by_name: args.enteredByName,
      treatment_date: args.values.treatmentDate,
      protocol_id: args.values.protocolId,
      protocol_version_id: args.protocolVersionId,
      protocol_version_label: args.protocolVersionLabel,
      protocol_deviation: args.values.protocolDeviation,
      protocol_deviation_reason: emptyToNull(
        args.values.protocolDeviationReason,
      ),
      patient_anon_id: emptyToNull(args.values.patientAnonId),
      patient_age_range: args.values.patientAgeRange,
      patient_fitzpatrick: args.values.patientFitzpatrick,
      patient_sex: args.values.patientSex ?? null,
      indication: args.values.indication,
      treatment_site: emptyToNull(args.values.treatmentSite),
      session_number: args.values.sessionNumber,
      wavelength_nm: args.values.wavelengthNm ?? null,
      fluence_j_per_cm2: args.values.fluenceJPerCm2 ?? null,
      pulse_duration_ps: args.values.pulseDurationPs ?? null,
      spot_size_mm: args.values.spotSizeMm ?? null,
      total_pulses: args.values.totalPulses ?? null,
      treatment_duration_minutes: args.values.treatmentDurationMinutes ?? null,
      prep_kit_used: args.values.prepKitUsed,
      recovery_kit_dispensed: args.values.recoveryKitDispensed,
      maintenance_kit_recommended: args.values.maintenanceKitRecommended,
      notes: emptyToNull(args.values.notes),
    })
    .select("id")
    .single();
  if (treatmentError || !treatment) {
    return {
      status: "error",
      message: treatmentError?.message ?? "Insert failed",
    };
  }

  // 2. Insert photos (if any)
  if (args.photos.length > 0) {
    const photoRows = args.photos.map((p) => ({
      treatment_id: treatment.id,
      practice_id: args.practiceId,
      storage_path: p.storage_path,
      filename: p.filename,
      mime_type: p.mime_type,
      byte_size: p.byte_size,
      capture_phase: p.capture_phase ?? null,
      caption: p.caption ?? null,
      consent_affirmed: p.consent_affirmed,
    }));
    const { error: photoError } = await supabase
      .from("treatment_photos")
      .insert(photoRows);
    if (photoError) {
      // Rollback the treatment if photo insert fails — keeps the audit
      // honest. Photos are part of the same submission.
      await supabase.from("treatments").delete().eq("id", treatment.id);
      return {
        status: "error",
        message: `Photo insert failed: ${photoError.message}`,
      };
    }
  }

  // 3. Insert adverse event (if flagged)
  let adverseEventId: string | null = null;
  if (args.values.adverseReaction) {
    const { data: adverse, error: adverseError } = await supabase
      .from("treatment_adverse_events")
      .insert({
        treatment_id: treatment.id,
        practice_id: args.practiceId,
        description: args.values.adverseReactionDescription ?? "",
      })
      .select("id")
      .single();
    if (adverseError) {
      await supabase.from("treatments").delete().eq("id", treatment.id);
      return {
        status: "error",
        message: `Adverse event insert failed: ${adverseError.message}`,
      };
    }
    adverseEventId = adverse?.id ?? null;
  }

  return {
    status: "ok",
    treatmentId: treatment.id,
    adverseEventId,
  };
}

// ------------------------------------------------------------
// listAuthorizedUsersForPractice — feeds the entered-by dropdown
// ------------------------------------------------------------
export interface AuthorizedUserOption {
  id: string;
  full_name: string;
  role_label: string | null;
  is_active: boolean;
}

export async function listAuthorizedUsersForPractice(): Promise<AuthorizedUserOption[]> {
  const supabase = await getAuthServerClient();
  const { data } = await supabase
    .from("practice_authorized_users")
    .select("id, full_name, role_label, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("full_name", { ascending: true });
  return (data ?? []) as unknown as AuthorizedUserOption[];
}

function emptyToNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}
