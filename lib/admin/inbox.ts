import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

// P8 — Admin inbox data layer.
//
// Three inbound tables (leads, demo_requests, contact_messages) live
// behind a single admin UI at /admin/inbox. This module exposes a
// list orchestrator + per-type detail fetchers + status/notes
// updaters + the badge-count function used by AdminLayout.
//
// All reads of the unified list go through the SECURITY DEFINER RPC
// `list_inbox_items` from 0010_inbox_status.sql. Per-type detail
// reads use the service-role client directly (each table's admin RLS
// policy permits select via is_admin(); service-role bypasses RLS
// anyway, but app callers must still go through requireAdmin()).
//
// Audit log entries use these target_type values per user spec:
//   lead, demo_request, contact_message
// Action verbs:
//   <target>.status_changed
//   <target>.notes_updated

export type InboxItemType = "lead" | "demo" | "contact";
export type InboxStatus = "new" | "contacted" | "qualified" | "closed";

export const INBOX_STATUSES: InboxStatus[] = [
  "new",
  "contacted",
  "qualified",
  "closed",
];

const ITEM_TYPES: InboxItemType[] = ["lead", "demo", "contact"];

export function isInboxItemType(value: string): value is InboxItemType {
  return (ITEM_TYPES as string[]).includes(value);
}

export function isInboxStatus(value: string): value is InboxStatus {
  return (INBOX_STATUSES as string[]).includes(value);
}

// audit_log.target_type per user-confirmed answer #6
const AUDIT_TARGET_TYPE: Record<InboxItemType, string> = {
  lead: "lead",
  demo: "demo_request",
  contact: "contact_message",
};

export function auditTargetTypeFor(type: InboxItemType): string {
  return AUDIT_TARGET_TYPE[type];
}

const TABLE_FOR: Record<InboxItemType, "leads" | "demo_requests" | "contact_messages"> = {
  lead: "leads",
  demo: "demo_requests",
  contact: "contact_messages",
};

// ------------------------------------------------------------
// Unified list view
// ------------------------------------------------------------

export interface InboxListItem {
  type: InboxItemType;
  id: string;
  receivedAt: string;
  status: InboxStatus;
  statusChangedAt: string | null;
  displayName: string;
  displayEmail: string;
  displayContext: string;
}

export interface InboxListFilters {
  type?: InboxItemType | "all";
  status?: InboxStatus | "all";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InboxListResult {
  items: InboxListItem[];
  total: number;
  page: number;
  pageSize: number;
  counts: {
    all: number;
    lead: number;
    demo: number;
    contact: number;
  };
}

export async function listInboxItems(
  filters: InboxListFilters = {},
): Promise<InboxListResult> {
  const supabase = getServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 50));
  const filterType = filters.type ?? "all";
  const filterStatus = filters.status ?? "all";
  const search = filters.search?.trim() ? filters.search.trim() : null;

  // List + counts in parallel.
  const [listRes, countsRes] = await Promise.all([
    supabase.rpc("list_inbox_items", {
      filter_type: filterType,
      filter_status: filterStatus,
      search_query: search,
      result_offset: (page - 1) * pageSize,
      result_limit: pageSize,
    }),
    supabase.rpc("count_inbox_items_by_type", {
      filter_status: filterStatus,
    }),
  ]);

  if (listRes.error) {
    throw new Error(`list_inbox_items failed: ${listRes.error.message}`);
  }
  if (countsRes.error) {
    throw new Error(
      `count_inbox_items_by_type failed: ${countsRes.error.message}`,
    );
  }

  const rows = (listRes.data ?? []) as Array<{
    type: string;
    id: string;
    received_at: string;
    status: string;
    status_changed_at: string | null;
    display_name: string;
    display_email: string;
    display_context: string | null;
  }>;

  const items: InboxListItem[] = rows
    .filter((r) => isInboxItemType(r.type) && isInboxStatus(r.status))
    .map((r) => ({
      type: r.type as InboxItemType,
      id: r.id,
      receivedAt: r.received_at,
      status: r.status as InboxStatus,
      statusChangedAt: r.status_changed_at,
      displayName: r.display_name,
      displayEmail: r.display_email,
      displayContext: r.display_context ?? "",
    }));

  // Totals: per-type counts come from RPC; "total" derives from them
  // honouring the active type filter. (The list query doesn't return
  // a total — we'd have to do an extra count(*) over the union — so
  // we reconstruct from the type-count RPC.)
  const countByType = new Map<string, number>();
  for (const row of (countsRes.data ?? []) as Array<{ type: string; count: number }>) {
    countByType.set(row.type, Number(row.count));
  }
  const leadCount = countByType.get("lead") ?? 0;
  const demoCount = countByType.get("demo") ?? 0;
  const contactCount = countByType.get("contact") ?? 0;
  const allCount = leadCount + demoCount + contactCount;

  let total: number;
  switch (filterType) {
    case "lead":
      total = leadCount;
      break;
    case "demo":
      total = demoCount;
      break;
    case "contact":
      total = contactCount;
      break;
    case "all":
    default:
      total = allCount;
      break;
  }

  // Search narrows results but the count RPC ignores search — so when
  // search is active, fall back to the row count for the current page
  // as a lower bound. The list view only paginates while search is
  // off; with search active, the UI hides total counts (P8 spec
  // doesn't require a search-aware total).
  if (search) {
    total = items.length + (page - 1) * pageSize;
    if (items.length === pageSize) {
      // Indicate there may be more by inflating; UI uses "X of Y+" style.
      total = total + 1;
    }
  }

  return {
    items,
    total,
    page,
    pageSize,
    counts: {
      all: allCount,
      lead: leadCount,
      demo: demoCount,
      contact: contactCount,
    },
  };
}

// ------------------------------------------------------------
// Per-type detail fetchers
// ------------------------------------------------------------

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type DemoRequestRow =
  Database["public"]["Tables"]["demo_requests"]["Row"];
export type ContactMessageRow =
  Database["public"]["Tables"]["contact_messages"]["Row"];

export async function getLeadById(id: string): Promise<LeadRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as LeadRow;
}

export async function getDemoRequestById(
  id: string,
): Promise<DemoRequestRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("demo_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as DemoRequestRow;
}

export async function getContactMessageById(
  id: string,
): Promise<ContactMessageRow | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as ContactMessageRow;
}

export interface InboxItemAuditRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  metadata: Database["public"]["Tables"]["audit_log"]["Row"]["metadata"];
}

export async function getAuditTrailFor(
  type: InboxItemType,
  id: string,
  limit = 50,
): Promise<InboxItemAuditRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("audit_log")
    .select("id, created_at, actor_id, action, metadata")
    .eq("target_type", auditTargetTypeFor(type))
    .eq("target_id", id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as InboxItemAuditRow[];
}

// ------------------------------------------------------------
// Mutations — status + admin notes
// ------------------------------------------------------------

export interface UpdateStatusResult {
  ok: boolean;
  error?: string;
  previousStatus?: InboxStatus;
}

export async function updateInboxItemStatus(args: {
  type: InboxItemType;
  id: string;
  newStatus: InboxStatus;
  actorId: string;
}): Promise<UpdateStatusResult> {
  const supabase = getServiceClient();
  const table = TABLE_FOR[args.type];

  const { data: existing, error: readErr } = await supabase
    .from(table)
    .select("id, status")
    .eq("id", args.id)
    .single();

  if (readErr || !existing) {
    return { ok: false, error: readErr?.message ?? "Not found" };
  }

  const previousStatus = existing.status as InboxStatus;
  if (previousStatus === args.newStatus) {
    return { ok: true, previousStatus };
  }

  const nowIso = new Date().toISOString();
  const { error: updateErr } = await supabase
    .from(table)
    .update({
      status: args.newStatus,
      status_changed_at: nowIso,
      status_changed_by: args.actorId,
    })
    .eq("id", args.id);

  if (updateErr) {
    return { ok: false, error: updateErr.message, previousStatus };
  }

  return { ok: true, previousStatus };
}

export interface UpdateNotesResult {
  ok: boolean;
  error?: string;
}

export async function updateInboxItemNotes(args: {
  type: InboxItemType;
  id: string;
  notes: string;
}): Promise<UpdateNotesResult> {
  const supabase = getServiceClient();
  const table = TABLE_FOR[args.type];

  const { error } = await supabase
    .from(table)
    .update({ admin_notes: args.notes })
    .eq("id", args.id);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// ------------------------------------------------------------
// Badge count for AdminSidebar
// ------------------------------------------------------------
// Sums status='new' across all three tables in a single RPC call.
// Caller (AdminLayout) wraps this in unstable_cache with 60s TTL.

export async function getInboxNewCount(): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("count_inbox_new_items");
  if (error || data === null || data === undefined) {
    return 0;
  }
  return Number(data) || 0;
}
