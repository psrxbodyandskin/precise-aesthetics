import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  PracticeProvisioningValues,
  PracticeStatus,
  PracticeUpdateValues,
} from "@/lib/schemas/practice";

type PracticeUpdate = Database["public"]["Tables"]["practices"]["Update"];

// Server-only data layer for practices. All callers are admin route
// handlers that have already gone through requireAdmin().
//
// The service-role client bypasses RLS, so authorization is enforced
// upstream (route handler) before we reach any of these functions.

export type PracticeRow =
  Awaited<ReturnType<typeof getPracticeById>>["data"];

// ------------------------------------------------------------
// Insert a new practice. Caller must have already created the auth
// user and have its id. Returns the new practice id on success.
// ------------------------------------------------------------
export async function insertPractice(
  values: PracticeProvisioningValues,
  context: {
    authUserId: string;
    provisionedBy: string; // admin user id
  },
): Promise<{ status: "ok"; id: string } | { status: "error"; message: string }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("practices")
    .insert({
      name: values.name,
      primary_email: values.primaryEmail,
      phone: emptyToNull(values.phone),
      address_line1: emptyToNull(values.addressLine1),
      address_line2: emptyToNull(values.addressLine2),
      city: emptyToNull(values.city),
      state: values.state ?? null,
      postal_code: emptyToNull(values.postalCode),
      country: values.country ?? "US",
      status: "pending",
      auth_user_id: context.authUserId,
      provisioned_by: context.provisionedBy,
      internal_notes: emptyToNull(values.internalNotes),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Insert failed" };
  }
  return { status: "ok", id: data.id };
}

// Insert the placeholder "Primary contact" row in practice_users so
// the entered-by dropdown has at least one entry before the setup
// wizard runs (P3).
export async function insertPlaceholderPracticeUser(practiceId: string) {
  const supabase = getServiceClient();
  const { error } = await supabase.from("practice_users").insert({
    practice_id: practiceId,
    full_name: "Primary contact", 
    role_at_practice: null,
    is_active: true,
  });
  if (error) {
    return { status: "error" as const, message: error.message };
  }
  return { status: "ok" as const };
}

// Insert practice_devices rows for each device the practice owns at
// provisioning time. Returns count inserted.
export async function insertPracticeDevices(
  practiceId: string,
  devices: PracticeProvisioningValues["devices"],
) {
  if (devices.length === 0) return { status: "ok" as const, count: 0 };

  const supabase = getServiceClient();
  const rows = devices.map((d) => ({
    practice_id: practiceId,
    device_id: d.deviceId,
    serial_number: emptyToNull(d.serialNumber ?? null),
    acquired_at: d.acquiredAt && d.acquiredAt.length > 0 ? d.acquiredAt : null,
  }));

  const { error } = await supabase.from("practice_devices").insert(rows);
  if (error) return { status: "error" as const, message: error.message };
  return { status: "ok" as const, count: rows.length };
}

// ------------------------------------------------------------
// Read helpers
// ------------------------------------------------------------

export async function getPracticeById(id: string) {
  const supabase = getServiceClient();
  return supabase.from("practices").select("*").eq("id", id).single();
}

export async function listPractices(opts: {
  status?: PracticeStatus | "all";
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getServiceClient();
  let q = supabase
    .from("practices")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (opts.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  if (opts.search && opts.search.trim().length > 0) {
    const term = `%${opts.search.trim().toLowerCase()}%`;
    q = q.or(`name.ilike.${term},primary_email.ilike.${term}`);
  }

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  return q;
}

export async function listPracticeDevicesForPractice(practiceId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("practice_devices")
    .select("*, devices(slug, display_name, short_description)")
    .eq("practice_id", practiceId);
}

export async function listPracticeUsersForPractice(practiceId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("practice_users")
    .select("*")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: true });
}

// ------------------------------------------------------------
// Update / status helpers
// ------------------------------------------------------------

export async function updatePractice(
  id: string,
  values: PracticeUpdateValues,
) {
  const supabase = getServiceClient();
  const patch: PracticeUpdate = {};
  if (values.name !== undefined) patch.name = values.name;
  if (values.phone !== undefined) patch.phone = emptyToNull(values.phone);
  if (values.addressLine1 !== undefined)
    patch.address_line1 = emptyToNull(values.addressLine1);
  if (values.addressLine2 !== undefined)
    patch.address_line2 = emptyToNull(values.addressLine2);
  if (values.city !== undefined) patch.city = emptyToNull(values.city);
  if (values.state !== undefined) patch.state = values.state ?? null;
  if (values.postalCode !== undefined)
    patch.postal_code = emptyToNull(values.postalCode);
  if (values.country !== undefined) patch.country = values.country ?? "US";
  if (values.internalNotes !== undefined)
    patch.internal_notes = emptyToNull(values.internalNotes);

  return supabase.from("practices").update(patch).eq("id", id).select("*").single();
}

export async function setPracticeStatus(
  id: string,
  status: PracticeStatus,
  changedBy: string,
) {
  const supabase = getServiceClient();
  return supabase
    .from("practices")
    .update({
      status,
      status_changed_at: new Date().toISOString(),
      status_changed_by: changedBy,
    })
    .eq("id", id)
    .select("*")
    .single();
}

// ------------------------------------------------------------
// Hard delete — drops the practices row and the linked auth user.
// FK cascades take out practice_users, practice_devices, and
// practice_authorized_users. Audit_log entries are kept (target_id
// becomes orphaned but that's fine — compliance trail outlives the
// record). Used by the admin "Delete permanently" action.
// ------------------------------------------------------------
export async function deletePracticeHard(
  practiceId: string,
): Promise<
  | { status: "ok"; authUserId: string | null }
  | { status: "error"; message: string }
> {
  const supabase = getServiceClient();

  // Look up the auth user link first so we can drop them after the row goes.
  const { data: practice, error: lookupError } = await supabase
    .from("practices")
    .select("auth_user_id")
    .eq("id", practiceId)
    .single();
  if (lookupError || !practice) {
    return {
      status: "error",
      message: lookupError?.message ?? "Practice not found",
    };
  }

  const { error: deleteError } = await supabase
    .from("practices")
    .delete()
    .eq("id", practiceId);
  if (deleteError) {
    return { status: "error", message: deleteError.message };
  }

  // Best-effort auth user removal. If the auth user is somehow shared
  // with another record (shouldn't happen — practices.auth_user_id is
  // unique) the delete will fail and we surface that as a soft warning
  // rather than rolling back the practice delete.
  if (practice.auth_user_id) {
    const { error: authError } = await supabase.auth.admin.deleteUser(
      practice.auth_user_id,
    );
    if (authError) {
      console.error("[practices] auth user delete failed", {
        practiceId,
        authUserId: practice.auth_user_id,
        error: authError.message,
      });
    }
  }

  return { status: "ok", authUserId: practice.auth_user_id };
}

// ------------------------------------------------------------
// Audit log lookup for a specific practice (used on detail page).
// ------------------------------------------------------------

export async function listAuditLogForPractice(
  practiceId: string,
  limit = 50,
) {
  const supabase = getServiceClient();
  return supabase
    .from("audit_log")
    .select("*")
    .eq("target_type", "practice")
    .eq("target_id", practiceId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

// ------------------------------------------------------------
// Util
// ------------------------------------------------------------
function emptyToNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}
