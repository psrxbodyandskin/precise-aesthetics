import "server-only";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { getServiceClient } from "@/lib/supabase/server";

// P6 — Practice-managed authorized users CRUD.
//
// The roster source for the "Entered by" dropdown on treatment logs.
// Practices self-manage. Practice can read/insert/update/delete via
// Class A RLS. We use the session-authed client for reads and the
// service-role client for writes (to keep the API layer's auth check
// canonical and avoid double-validation).

export async function listAuthorizedUsers(practiceId: string) {
  // RLS already scopes to the caller's practice; the explicit
  // practice_id filter is belt-and-suspenders.
  const supabase = await getAuthServerClient();
  const { data } = await supabase
    .from("practice_authorized_users")
    .select("id, full_name, role_label, is_active, sort_order, created_at")
    .eq("practice_id", practiceId)
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function createAuthorizedUser(
  practiceId: string,
  values: { fullName: string; roleLabel?: string | null },
): Promise<{ status: "ok"; id: string } | { status: "error"; message: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("practice_authorized_users")
    .insert({
      practice_id: practiceId,
      full_name: values.fullName.trim(),
      role_label:
        values.roleLabel && values.roleLabel.trim().length > 0
          ? values.roleLabel.trim()
          : null,
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { status: "error", message: error?.message ?? "Insert failed" };
  }
  return { status: "ok", id: data.id };
}

// Soft delete — sets is_active=false rather than dropping the row.
// Existing treatment_logs reference this user via entered_by_user_id;
// dropping the row would break attribution. Soft-delete preserves
// historic records.
export async function deactivateAuthorizedUser(
  practiceId: string,
  userId: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("practice_authorized_users")
    .update({ is_active: false })
    .eq("id", userId)
    .eq("practice_id", practiceId);
  if (error) return { status: "error", message: error.message };
  return { status: "ok" };
}
