import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type { AdverseEventStatus } from "@/lib/schemas/treatment";

type AdverseEventUpdate =
  Database["public"]["Tables"]["treatment_adverse_events"]["Update"];

// P6 — Admin-only data layer for adverse events triage.
// All callers go through requireAdmin() upstream.

export async function listAdverseEvents(opts: {
  status?: AdverseEventStatus | "all";
  limit?: number;
  offset?: number;
}) {
  const supabase = getServiceClient();
  const limit = opts.limit ?? 100;
  const offset = opts.offset ?? 0;

  let q = supabase
    .from("treatment_adverse_events")
    .select(
      `
      id,
      created_at,
      status,
      description,
      practice_id,
      treatment_id,
      practice:practices(id, name),
      treatment:treatments(
        id, treatment_date, indication, patient_fitzpatrick,
        protocol_version_label, entered_by_name,
        protocol:protocols(title, slug)
      )
    `,
      { count: "exact" },
    )
    .order("status", { ascending: true }) // 'new' → 'reviewing' → 'addressed' (alpha order)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (opts.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  return q;
}

export async function countNewAdverseEvents(): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("treatment_adverse_events")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}

export async function getAdverseEventById(id: string) {
  const supabase = getServiceClient();
  const { data: adverse, error } = await supabase
    .from("treatment_adverse_events")
    .select(
      `
      *,
      practice:practices(id, name, primary_email),
      treatment:treatments(*, protocol:protocols(title, slug))
    `,
    )
    .eq("id", id)
    .single();
  if (error || !adverse) return null;

  const { data: photos } = await supabase
    .from("treatment_photos")
    .select("*")
    .eq("treatment_id", adverse.treatment_id)
    .order("created_at", { ascending: true });

  return { adverse, photos: photos ?? [] };
}

export async function updateAdverseEvent(
  id: string,
  changes: {
    status?: AdverseEventStatus;
    adminNotes?: string | null;
  },
  changedBy: string,
) {
  const supabase = getServiceClient();
  const patch: AdverseEventUpdate = {};
  if (changes.status !== undefined) {
    patch.status = changes.status;
    patch.status_changed_at = new Date().toISOString();
    patch.status_changed_by = changedBy;
  }
  if (changes.adminNotes !== undefined) {
    patch.admin_notes =
      changes.adminNotes && changes.adminNotes.trim().length > 0
        ? changes.adminNotes
        : null;
  }
  return supabase
    .from("treatment_adverse_events")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
}
