import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

// P7 — Admin-side treatment detail fetcher.
//
// Distinct from lib/portal/treatments.ts because admin needs to see
// any treatment across practices (RLS allows admin all). This layer
// uses the service-role client and returns the practice context the
// portal version intentionally omits (practice name, primary email).

export interface AdminTreatmentDetail {
  treatment: AdminTreatmentRow;
  photos: Array<{
    id: string;
    storage_path: string;
    filename: string;
    mime_type: string;
    capture_phase: string | null;
    caption: string | null;
  }>;
  adverseEvent: {
    id: string;
    description: string;
    status: "new" | "reviewing" | "addressed";
    created_at: string;
    status_changed_at: string | null;
    admin_notes: string | null;
  } | null;
  practice: {
    id: string;
    name: string;
    primary_email: string;
  } | null;
  auditLog: AdminAuditEntry[];
}

export interface AdminTreatmentRow {
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
  created_at: string;
  protocol: { title: string; slug: string } | null;
}

export interface AdminAuditEntry {
  id: string;
  created_at: string;
  actor_role: string | null;
  action: string;
  metadata: unknown;
}

export async function getTreatmentByIdForAdmin(
  id: string,
): Promise<AdminTreatmentDetail | null> {
  const supabase = getServiceClient();

  const { data: treatmentRaw, error } = await supabase
    .from("treatments")
    .select(
      `
      *,
      protocol:protocols(title, slug)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !treatmentRaw) return null;

  const t = treatmentRaw as unknown as Record<string, unknown> & {
    protocol: { title: string; slug: string } | { title: string; slug: string }[] | null;
    practice_id: string;
  };
  const protoRaw = t.protocol;
  const protocol = Array.isArray(protoRaw)
    ? (protoRaw[0] ?? null)
    : (protoRaw ?? null);

  const treatment = { ...t, protocol } as unknown as AdminTreatmentRow;

  const [{ data: photos }, { data: adverse }, { data: practice }, { data: audit }] =
    await Promise.all([
      supabase
        .from("treatment_photos")
        .select(
          "id, storage_path, filename, mime_type, capture_phase, caption",
        )
        .eq("treatment_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("treatment_adverse_events")
        .select(
          "id, description, status, created_at, status_changed_at, admin_notes",
        )
        .eq("treatment_id", id)
        .maybeSingle(),
      supabase
        .from("practices")
        .select("id, name, primary_email")
        .eq("id", t.practice_id)
        .maybeSingle(),
      supabase
        .from("audit_log")
        .select("id, created_at, actor_role, action, metadata")
        .eq("target_type", "treatment")
        .eq("target_id", id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  return {
    treatment,
    photos:
      (photos as AdminTreatmentDetail["photos"] | null) ??
      ([] as AdminTreatmentDetail["photos"]),
    adverseEvent: adverse as AdminTreatmentDetail["adverseEvent"],
    practice: practice as AdminTreatmentDetail["practice"],
    auditLog:
      (audit as AdminTreatmentDetail["auditLog"] | null) ??
      ([] as AdminTreatmentDetail["auditLog"]),
  };
}

// ------------------------------------------------------------
// Sign storage paths for admin photo viewing (private bucket)
// ------------------------------------------------------------
export async function getSignedUrlsForAdminPhotos(
  paths: string[],
): Promise<Map<string, string>> {
  const supabase = getServiceClient();
  const map = new Map<string, string>();
  if (paths.length === 0) return map;
  const results = await Promise.all(
    paths.map(async (p) => {
      const { data } = await supabase.storage
        .from("treatment-photos")
        .createSignedUrl(p, 60 * 60);
      return { path: p, url: data?.signedUrl ?? null };
    }),
  );
  for (const r of results) {
    if (r.url) map.set(r.path, r.url);
  }
  return map;
}
