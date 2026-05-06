import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { AuditLogFilters } from "@/lib/schemas/audit-log";

// ============================================================
// P14 — Audit log viewer data layer
// ============================================================
//
// SCHEMA-VS-SPEC DRIFT (PERMANENT) — bake this into your model:
//
// The original P14 spec assumed columns named `actor_user_id`,
// `actor_type`, and `practice_id` on the `audit_log` table.
// The actual schema (created in 0004_rls_framework.sql) has:
//
//   actor_id   uuid           -- ← spec called this actor_user_id
//   actor_role text           -- ← spec called this actor_type
//   (no practice_id column)   -- ← spec assumed this existed
//   ip_address inet           -- ← spec didn't mention this
//
// Code is the truth. Spec was wrong. We do NOT alter the table to
// match the spec. This file (and the RPCs in 0017_audit_log_rpcs.sql)
// uses the real names. KNOWN-GOTCHAS.md has the full record.
//
// PRACTICE FILTER LIMITATION (per P14 ambiguity #2):
// There is no `practice_id` column on `audit_log`. When the operator
// filters by practice, the RPC matches entries where
// `target_type = 'practice' AND target_id = filter_practice_id`. This
// catches entries where the practice IS the target (e.g.,
// practice.invite, practice.activate) but MISSES entries where the
// practice is referenced inside metadata (e.g., a treatment whose
// metadata includes practice_id). The UI surfaces this as a footnote
// on the practice filter so operators don't read fewer-than-expected
// results as a bug.
//
// READ-ONLY: this layer never writes to audit_log. Inserts go through
// the `log_audit()` RPC (lib/admin/audit.ts → logAudit()).
// ============================================================

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actorId: string | null;
  actorRole: string | null; // 'admin' | 'practice' | null (NULL = system)
  actorEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Json;
  ipAddress: string | null;
  targetPracticeName: string | null;
}

export interface AuditLogListResult {
  entries: AuditLogEntry[];
  total: number;
}

interface RpcRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_role: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Json;
  ip_address: string | null;
  target_practice_name: string | null;
}

function mapRow(r: RpcRow): AuditLogEntry {
  return {
    id: r.id,
    createdAt: r.created_at,
    actorId: r.actor_id,
    actorRole: r.actor_role,
    actorEmail: r.actor_email,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    metadata: r.metadata,
    ipAddress: r.ip_address,
    targetPracticeName: r.target_practice_name,
  };
}

interface RpcArgs {
  filter_actor_id?: string | null;
  filter_actor_role?: string | null;
  filter_actor_role_is_null?: boolean;
  filter_action?: string | null;
  filter_target_type?: string | null;
  filter_target_id?: string | null;
  filter_practice_id?: string | null;
  filter_date_from?: string | null;
  filter_date_to?: string | null;
  search_query?: string | null;
}

function buildRpcArgs(filters: AuditLogFilters): RpcArgs {
  // 'system' sentinel (UI label) translates to actor_role IS NULL.
  const isSystem = filters.actor_role === "system";

  return {
    filter_actor_id: filters.actor_id ?? null,
    filter_actor_role: isSystem ? null : (filters.actor_role ?? null),
    filter_actor_role_is_null: isSystem,
    filter_action: filters.action ?? null,
    filter_target_type: filters.target_type ?? null,
    filter_target_id: filters.target_id ?? null,
    filter_practice_id: filters.practice_id ?? null,
    filter_date_from: filters.date_from
      ? toIsoStartOfDay(filters.date_from)
      : null,
    filter_date_to: filters.date_to ? toIsoEndOfDay(filters.date_to) : null,
    search_query: filters.q && filters.q.trim().length > 0
      ? filters.q.trim()
      : null,
  };
}

// Date inputs come as 'YYYY-MM-DD' from <input type="date">. Pin to the
// operator's UTC start/end of day. Good enough for compliance browsing;
// timezone polish (operator's local tz) is P14.5 if Roni asks.
function toIsoStartOfDay(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T00:00:00.000Z`).toISOString();
}
function toIsoEndOfDay(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T23:59:59.999Z`).toISOString();
}

// ----------------------------------------------------------------
// Public functions
// ----------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 50;

export async function listAuditLogEntries(
  filters: AuditLogFilters,
): Promise<AuditLogListResult> {
  const supabase = getServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, filters.page_size ?? DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const args = buildRpcArgs(filters);

  const [listRes, countRes] = await Promise.all([
    supabase.rpc("list_audit_log_entries", {
      ...args,
      result_offset: offset,
      result_limit: pageSize,
    }),
    supabase.rpc("count_audit_log_entries", args),
  ]);

  if (listRes.error) {
    return { entries: [], total: 0 };
  }
  const rows = (listRes.data ?? []) as unknown as RpcRow[];
  const total =
    typeof countRes.data === "number"
      ? countRes.data
      : Number(countRes.data ?? 0);

  return { entries: rows.map(mapRow), total };
}

export async function getAuditLogEntryById(
  id: string,
): Promise<AuditLogEntry | null> {
  // Single-row lookup: use the list RPC with target id is awkward because
  // there's no `id` filter. Direct table SELECT through service client +
  // join is fine — no exposure since requireAdmin() gates the route.
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;

  // Resolve actor email + practice name for display
  let actorEmail: string | null = null;
  if (data.actor_id) {
    const { data: actor } = await supabase.auth.admin.getUserById(
      data.actor_id,
    );
    actorEmail = actor?.user?.email ?? null;
  }

  let targetPracticeName: string | null = null;
  if (data.target_type === "practice" && data.target_id) {
    const { data: practice } = await supabase
      .from("practices")
      .select("name")
      .eq("id", data.target_id)
      .maybeSingle();
    targetPracticeName = practice?.name ?? null;
  }

  return {
    id: data.id,
    createdAt: data.created_at,
    actorId: data.actor_id,
    actorRole: data.actor_role,
    actorEmail,
    action: data.action,
    targetType: data.target_type,
    targetId: data.target_id,
    metadata: data.metadata,
    ipAddress: data.ip_address,
    targetPracticeName,
  };
}

export async function getRelatedEntriesForTarget(
  targetType: string,
  targetId: string,
  limit = 10,
): Promise<AuditLogEntry[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc("list_audit_log_entries", {
    filter_target_type: targetType,
    filter_target_id: targetId,
    result_offset: 0,
    result_limit: limit,
  });
  if (error || !data) return [];
  return (data as unknown as RpcRow[]).map(mapRow);
}

export async function getDistinctActionVerbs(): Promise<
  Array<{ action: string; occurrences: number }>
> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc(
    "audit_log_distinct_action_verbs",
  );
  if (error || !data) return [];
  return data as unknown as Array<{ action: string; occurrences: number }>;
}

export async function getDistinctTargetTypes(): Promise<
  Array<{ target_type: string; occurrences: number }>
> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.rpc(
    "audit_log_distinct_target_types",
  );
  if (error || !data) return [];
  return data as unknown as Array<{
    target_type: string;
    occurrences: number;
  }>;
}

// ----------------------------------------------------------------
// CSV export
// ----------------------------------------------------------------

export const CSV_EXPORT_HARD_CAP = 10_000;

export async function streamAuditLogCsv(
  filters: AuditLogFilters,
): Promise<{ tooLarge: false; csv: string } | { tooLarge: true; total: number }> {
  const supabase = getServiceClient();
  const args = buildRpcArgs(filters);

  // First check the count to honor the cap.
  const { data: countData } = await supabase.rpc(
    "count_audit_log_entries",
    args,
  );
  const total =
    typeof countData === "number" ? countData : Number(countData ?? 0);
  if (total > CSV_EXPORT_HARD_CAP) {
    return { tooLarge: true, total };
  }

  // Stream up to the cap. RPC supports offset/limit; we pull in a
  // single 10k slice rather than paginating because Postgres handles
  // 10k rows fine in one query and it keeps the response simple.
  const { data, error } = await supabase.rpc("list_audit_log_entries", {
    ...args,
    result_offset: 0,
    result_limit: CSV_EXPORT_HARD_CAP,
  });
  if (error || !data) {
    return { tooLarge: false, csv: csvHeader() + "\n" };
  }

  const rows = (data as unknown as RpcRow[]).map(mapRow);
  const csvRows = rows.map(rowToCsv);
  return { tooLarge: false, csv: [csvHeader(), ...csvRows].join("\n") + "\n" };
}

function csvHeader(): string {
  return [
    "Timestamp",
    "Actor email",
    "Actor role",
    "Action",
    "Target type",
    "Target id",
    "Target practice name",
    "IP address",
    "Metadata",
  ].join(",");
}

function csvEscape(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  // RFC 4180: quote-wrap if contains comma, quote, or newline; double
  // any embedded quotes.
  const s = String(v);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsv(r: AuditLogEntry): string {
  const metadataStr =
    r.metadata && typeof r.metadata === "object"
      ? JSON.stringify(r.metadata)
      : "";
  return [
    csvEscape(r.createdAt),
    csvEscape(r.actorEmail),
    csvEscape(r.actorRole ?? "system"),
    csvEscape(r.action),
    csvEscape(r.targetType),
    csvEscape(r.targetId),
    csvEscape(r.targetPracticeName),
    csvEscape(r.ipAddress),
    csvEscape(metadataStr),
  ].join(",");
}

// ----------------------------------------------------------------
// Practice list helper (for filter dropdown)
// ----------------------------------------------------------------

export async function listAllPracticesForFilter(): Promise<
  Array<{ id: string; name: string }>
> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("practices")
    .select("id, name")
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data;
}
