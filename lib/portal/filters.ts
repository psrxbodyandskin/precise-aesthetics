// P5 — Protocol library filter URL ↔ state helpers.
//
// Filters live in the URL query string so:
//   - Filtered state is shareable
//   - Browser back/forward works
//   - Refresh preserves filters
//
// Format:
//   /portal/protocols?search=melasma&indications=<uuid>,<uuid>&fitzpatrick=V,VI

export interface ProtocolFilters {
  search?: string;
  indicationCategoryIds?: string[];
  fitzpatrickTypes?: string[];
}

export const FITZPATRICK_TYPES = ["I", "II", "III", "IV", "V", "VI"] as const;
export type FitzpatrickType = (typeof FITZPATRICK_TYPES)[number];

export function isFitzpatrickType(v: string): v is FitzpatrickType {
  return (FITZPATRICK_TYPES as readonly string[]).includes(v);
}

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): ProtocolFilters {
  const filters: ProtocolFilters = {};

  const search = first(searchParams.search);
  if (search && search.trim().length > 0) {
    filters.search = search.trim();
  }

  const indications = first(searchParams.indications);
  if (indications) {
    const ids = indications
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
    if (ids.length > 0) filters.indicationCategoryIds = ids;
  }

  const fitzpatrick = first(searchParams.fitzpatrick);
  if (fitzpatrick) {
    const types = fitzpatrick
      .split(",")
      .map((s) => s.trim())
      .filter(isFitzpatrickType);
    if (types.length > 0) filters.fitzpatrickTypes = types;
  }

  return filters;
}

export function serializeFilters(filters: ProtocolFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.indicationCategoryIds?.length) {
    params.set("indications", filters.indicationCategoryIds.join(","));
  }
  if (filters.fitzpatrickTypes?.length) {
    params.set("fitzpatrick", filters.fitzpatrickTypes.join(","));
  }
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function hasActiveFilters(filters: ProtocolFilters): boolean {
  return Boolean(
    filters.search ||
      filters.indicationCategoryIds?.length ||
      filters.fitzpatrickTypes?.length,
  );
}

// ============================================================
// P7 — Treatment list filter URL helpers
// ============================================================
// Same pattern as ProtocolFilters but with the wider field set the
// treatment list view supports. Lives in the same file so the URL
// param schema for the portal stays in one place.

export interface TreatmentFilters {
  search?: string;
  dateFrom?: string; // ISO date YYYY-MM-DD
  dateTo?: string;
  protocolIds?: string[];
  indications?: string[];
  fitzpatrickTypes?: FitzpatrickType[];
  hasPhotos?: boolean;
  hasAdverseEvent?: boolean;
  page?: number;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseTreatmentFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): TreatmentFilters {
  const filters: TreatmentFilters = {};

  const search = first(searchParams.search);
  if (search && search.trim().length > 0) filters.search = search.trim();

  const dateFrom = first(searchParams.dateFrom);
  if (dateFrom && ISO_DATE_RE.test(dateFrom)) filters.dateFrom = dateFrom;

  const dateTo = first(searchParams.dateTo);
  if (dateTo && ISO_DATE_RE.test(dateTo)) filters.dateTo = dateTo;

  const protocols = first(searchParams.protocols);
  if (protocols) {
    const ids = protocols
      .split(",")
      .map((s) => s.trim())
      .filter((s) => UUID_RE.test(s));
    if (ids.length > 0) filters.protocolIds = ids;
  }

  const indications = first(searchParams.indications);
  if (indications) {
    const list = indications
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 25);
    if (list.length > 0) filters.indications = list;
  }

  const fitzpatrick = first(searchParams.fitzpatrick);
  if (fitzpatrick) {
    const types = fitzpatrick
      .split(",")
      .map((s) => s.trim())
      .filter(isFitzpatrickType);
    if (types.length > 0) filters.fitzpatrickTypes = types;
  }

  if (first(searchParams.hasPhotos) === "true") filters.hasPhotos = true;
  if (first(searchParams.hasAdverse) === "true") filters.hasAdverseEvent = true;

  const page = first(searchParams.page);
  if (page) {
    const n = Number(page);
    if (Number.isFinite(n) && n > 0) filters.page = Math.floor(n);
  }

  return filters;
}

export function serializeTreatmentFilters(filters: TreatmentFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.protocolIds?.length)
    params.set("protocols", filters.protocolIds.join(","));
  if (filters.indications?.length)
    params.set("indications", filters.indications.join(","));
  if (filters.fitzpatrickTypes?.length)
    params.set("fitzpatrick", filters.fitzpatrickTypes.join(","));
  if (filters.hasPhotos) params.set("hasPhotos", "true");
  if (filters.hasAdverseEvent) params.set("hasAdverse", "true");
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));
  const qs = params.toString();
  return qs.length > 0 ? `?${qs}` : "";
}

export function hasActiveTreatmentFilters(filters: TreatmentFilters): boolean {
  return Boolean(
    filters.search ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.protocolIds?.length ||
      filters.indications?.length ||
      filters.fitzpatrickTypes?.length ||
      filters.hasPhotos ||
      filters.hasAdverseEvent,
  );
}

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
