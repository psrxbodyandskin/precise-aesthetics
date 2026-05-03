import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type {
  SetupProfileValues,
  AuthorizedUserInput,
} from "@/lib/schemas/setup-wizard";

// Server-only data layer for the practitioner setup wizard. All
// callers are server actions that have already gone through
// requirePractice() and confirmed practices.status === 'pending'.
//
// We use the service-role client because:
//  • practices RLS lets the practice READ their own row but not UPDATE
//    (writes are admin-managed). The wizard is a brief, audited
//    exception during first login.
//  • status flip from 'pending' → 'active' has to bypass RLS for the
//    same reason.
// Practice authorization is verified upstream in the server action.

// ------------------------------------------------------------
// Practice lookup keyed on the auth user. Used to resolve the
// caller's practice_id even before the JWT claim is in place
// (defense-in-depth: app_metadata.practice_id should be set during
// provisioning, but we don't rely on it solely for this lookup).
// ------------------------------------------------------------
export async function getPracticeForAuthUser(authUserId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("practices")
    .select("*")
    .eq("auth_user_id", authUserId)
    .single();
}

// ------------------------------------------------------------
// Step 3 — profile update
// ------------------------------------------------------------
export async function updatePracticeProfile(
  practiceId: string,
  values: SetupProfileValues,
) {
  const supabase = getServiceClient();
  return supabase
    .from("practices")
    .update({
      phone: emptyToNull(values.phone),
      address_line1: emptyToNull(values.addressLine1),
      address_line2: emptyToNull(values.addressLine2),
      city: emptyToNull(values.city),
      state: values.state ?? null,
      postal_code: emptyToNull(values.postalCode),
    })
    .eq("id", practiceId)
    .select("id")
    .single();
}

// ------------------------------------------------------------
// Step 4 — authorized users (full replace)
// One submit replaces the whole roster: simpler for the practice
// (the editor is a list they manage in one form) and keeps the
// admin audit log readable. The wizard is short-lived; later
// edits in /portal/settings can do per-row CRUD.
// ------------------------------------------------------------
export async function replaceAuthorizedUsers(
  practiceId: string,
  users: AuthorizedUserInput[],
) {
  const supabase = getServiceClient();

  const { error: deleteError } = await supabase
    .from("practice_authorized_users")
    .delete()
    .eq("practice_id", practiceId);
  if (deleteError) {
    return { status: "error" as const, message: deleteError.message };
  }

  if (users.length === 0) {
    return { status: "ok" as const, count: 0 };
  }

  const rows = users.map((u, idx) => ({
    practice_id: practiceId,
    full_name: u.fullName,
    role_label: emptyToNull(u.roleLabel ?? null),
    sort_order: idx,
    is_active: true,
  }));

  const { error: insertError } = await supabase
    .from("practice_authorized_users")
    .insert(rows);
  if (insertError) {
    return { status: "error" as const, message: insertError.message };
  }
  return { status: "ok" as const, count: rows.length };
}

export async function listAuthorizedUsers(practiceId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("practice_authorized_users")
    .select("*")
    .eq("practice_id", practiceId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
}

// ------------------------------------------------------------
// Step 5 — device list (read-only in wizard)
// Practice cannot self-manage devices from the wizard. If the list
// is wrong they contact admin, who edits via /admin/practices/[id].
// ------------------------------------------------------------
export async function listOwnedDevices(practiceId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("practice_devices")
    .select("*, devices(slug, display_name, short_description)")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: true });
}

// ------------------------------------------------------------
// Step 7 — finalize (flip status to active)
// ------------------------------------------------------------
export async function finalizePracticeSetup(
  practiceId: string,
  authUserId: string,
) {
  const supabase = getServiceClient();
  return supabase
    .from("practices")
    .update({
      status: "active",
      status_changed_at: new Date().toISOString(),
      status_changed_by: authUserId,
    })
    .eq("id", practiceId)
    .eq("status", "pending") // belt-and-suspenders: don't accidentally re-activate suspended/archived
    .select("id, status")
    .single();
}

// ------------------------------------------------------------
// Util
// ------------------------------------------------------------
function emptyToNull(v: string | null | undefined): string | null {
  if (v === null || v === undefined) return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}
