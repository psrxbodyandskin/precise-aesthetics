// P8 — Inbox URL filter helpers.
//
// Filters live in the URL query string so state is shareable and
// browser back/forward + refresh preserve the active view.
//
// Format:
//   /admin/inbox?type=demo&status=new&search=sarah&page=2

import {
  INBOX_ITEM_TYPES,
  INBOX_STATUSES,
  type InboxItemTypeValue,
  type InboxStatusValue,
} from "@/lib/schemas/inbox";

export interface InboxFilters {
  type: InboxItemTypeValue | "all";
  status: InboxStatusValue | "all";
  search?: string;
  page: number;
}

function first(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  if (Array.isArray(v)) return v[0];
  return v;
}

function isType(v: string): v is InboxItemTypeValue {
  return (INBOX_ITEM_TYPES as readonly string[]).includes(v);
}

function isStatus(v: string): v is InboxStatusValue {
  return (INBOX_STATUSES as readonly string[]).includes(v);
}

export function parseInboxFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): InboxFilters {
  const rawType = first(searchParams.type);
  const rawStatus = first(searchParams.status);
  const search = first(searchParams.search);
  const rawPage = first(searchParams.page);

  const type: InboxFilters["type"] =
    rawType && rawType !== "all" && isType(rawType) ? rawType : "all";

  const status: InboxFilters["status"] =
    rawStatus && rawStatus !== "all" && isStatus(rawStatus) ? rawStatus : "all";

  const pageNum = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  return {
    type,
    status,
    search: search && search.trim().length > 0 ? search.trim() : undefined,
    page,
  };
}

export function serializeInboxFilters(
  filters: Partial<InboxFilters>,
  base: InboxFilters,
): string {
  const merged: InboxFilters = { ...base, ...filters };
  const params = new URLSearchParams();
  if (merged.type !== "all") params.set("type", merged.type);
  if (merged.status !== "all") params.set("status", merged.status);
  if (merged.search) params.set("search", merged.search);
  if (merged.page > 1) params.set("page", String(merged.page));
  return params.toString();
}

export function hasActiveInboxFilters(filters: InboxFilters): boolean {
  return (
    filters.type !== "all" ||
    filters.status !== "all" ||
    Boolean(filters.search)
  );
}
