import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import type {
  NotificationCategory,
  Preferences,
  QuietHoursValues,
} from "@/lib/schemas/notifications";

// P10 — read-side queries shared across portal + admin routes.
// All queries use the service-role client; route handlers gate
// access by role at the boundary.

export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];

export interface ListFilters {
  unreadOnly?: boolean;
  categories?: NotificationCategory[];
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  items: NotificationRow[];
  total: number;
  page: number;
  pageSize: number;
}

// ------------------------------------------------------------
// listForPractice
// ------------------------------------------------------------
export async function listForPractice(
  practiceId: string,
  filters: ListFilters = {},
): Promise<ListResult> {
  const supabase = getServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("recipient_type", "practice")
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.unreadOnly) q = q.is("read_at", null);
  if (filters.categories && filters.categories.length > 0) {
    q = q.in("category", filters.categories);
  }

  const { data, count } = await q;
  return {
    items: (data ?? []) as NotificationRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ------------------------------------------------------------
// listForAdmin
// ------------------------------------------------------------
export async function listForAdmin(
  adminUserId: string,
  filters: ListFilters = {},
): Promise<ListResult> {
  const supabase = getServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("recipient_type", "admin")
    .eq("admin_user_id", adminUserId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.unreadOnly) q = q.is("read_at", null);
  if (filters.categories && filters.categories.length > 0) {
    q = q.in("category", filters.categories);
  }

  const { data, count } = await q;
  return {
    items: (data ?? []) as NotificationRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// ------------------------------------------------------------
// Unread count — single source for the bell badge.
// ------------------------------------------------------------
export async function unreadCountForPractice(
  practiceId: string,
): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", "practice")
    .eq("practice_id", practiceId)
    .is("read_at", null);
  return count ?? 0;
}

export async function unreadCountForAdmin(adminUserId: string): Promise<number> {
  const supabase = getServiceClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_type", "admin")
    .eq("admin_user_id", adminUserId)
    .is("read_at", null);
  return count ?? 0;
}

// ------------------------------------------------------------
// Mark single as read (scoped to recipient).
// ------------------------------------------------------------
export async function markReadForPractice(args: {
  notificationId: string;
  practiceId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", args.notificationId)
    .eq("recipient_type", "practice")
    .eq("practice_id", args.practiceId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markReadForAdmin(args: {
  notificationId: string;
  adminUserId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", args.notificationId)
    .eq("recipient_type", "admin")
    .eq("admin_user_id", args.adminUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ------------------------------------------------------------
// Bulk mark-all-read.
// ------------------------------------------------------------
export async function markAllReadForPractice(
  practiceId: string,
): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_type", "practice")
    .eq("practice_id", practiceId)
    .is("read_at", null);
}

export async function markAllReadForAdmin(adminUserId: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_type", "admin")
    .eq("admin_user_id", adminUserId)
    .is("read_at", null);
}

// ------------------------------------------------------------
// Preferences — get + upsert.
// ------------------------------------------------------------
export interface PreferencesRow {
  id: string;
  preferences: Preferences;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
}

export async function getPreferencesForPractice(
  practiceId: string,
): Promise<PreferencesRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("id, preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone")
    .eq("user_type", "practice")
    .eq("practice_id", practiceId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    preferences: (data.preferences as Preferences) ?? {},
    quiet_hours_start: data.quiet_hours_start,
    quiet_hours_end: data.quiet_hours_end,
    quiet_hours_timezone: data.quiet_hours_timezone,
  };
}

export async function getPreferencesForAdmin(
  adminUserId: string,
): Promise<PreferencesRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("id, preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone")
    .eq("user_type", "admin")
    .eq("admin_user_id", adminUserId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    preferences: (data.preferences as Preferences) ?? {},
    quiet_hours_start: data.quiet_hours_start,
    quiet_hours_end: data.quiet_hours_end,
    quiet_hours_timezone: data.quiet_hours_timezone,
  };
}

interface UpsertPreferencesArgs {
  preferences?: Preferences;
  quietHours?: QuietHoursValues;
}

export async function upsertPreferencesForPractice(
  practiceId: string,
  patch: UpsertPreferencesArgs,
): Promise<{ ok: boolean; error?: string }> {
  return upsertPreferences({
    user_type: "practice",
    practice_id: practiceId,
    admin_user_id: null,
    patch,
  });
}

export async function upsertPreferencesForAdmin(
  adminUserId: string,
  patch: UpsertPreferencesArgs,
): Promise<{ ok: boolean; error?: string }> {
  return upsertPreferences({
    user_type: "admin",
    practice_id: null,
    admin_user_id: adminUserId,
    patch,
  });
}

async function upsertPreferences(args: {
  user_type: "practice" | "admin";
  practice_id: string | null;
  admin_user_id: string | null;
  patch: UpsertPreferencesArgs;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();

  // Fetch existing row (if any) so we can merge preferences keys
  // partial-style (caller may patch only one category).
  let existing: PreferencesRow | null = null;
  if (args.user_type === "practice" && args.practice_id) {
    existing = await getPreferencesForPractice(args.practice_id);
  } else if (args.user_type === "admin" && args.admin_user_id) {
    existing = await getPreferencesForAdmin(args.admin_user_id);
  }

  const mergedPreferences: Preferences = {
    ...(existing?.preferences ?? {}),
    ...(args.patch.preferences ?? {}),
  };

  const update: Database["public"]["Tables"]["notification_preferences"]["Insert"] =
    {
      user_type: args.user_type,
      practice_id: args.practice_id,
      admin_user_id: args.admin_user_id,
      preferences: mergedPreferences as never,
    };
  if (args.patch.quietHours) {
    if (!args.patch.quietHours.enabled) {
      update.quiet_hours_start = null;
      update.quiet_hours_end = null;
    } else {
      update.quiet_hours_start = args.patch.quietHours.start || null;
      update.quiet_hours_end = args.patch.quietHours.end || null;
    }
    if (args.patch.quietHours.timezone) {
      update.quiet_hours_timezone = args.patch.quietHours.timezone;
    }
  }

  // Upsert keyed on the partial unique index.
  const onConflict =
    args.user_type === "practice"
      ? "user_type,practice_id"
      : "user_type,admin_user_id";

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(update, { onConflict });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
