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

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
