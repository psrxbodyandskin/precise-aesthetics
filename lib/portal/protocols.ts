import "server-only";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { sanityClient } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import type { Protocol } from "@/lib/sanity/types";
import type { ProtocolFilters } from "./filters";

// Hand-typed shape for list/detail queries — keeps consumer pages
// off the chained-builder inference that loses the relational join.
export interface PortalProtocolRow {
  id: string;
  sanity_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  indication_tags: string[] | null;
  fitzpatrick_types: string[] | null;
  current_version: string | null;
  last_published_at: string | null;
  indication_category: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

// P5 — Server-only data layer for the practitioner protocol library.
//
// All queries go through the SESSION-AUTHED client (getAuthServerClient).
// Class B RLS from migration 0007 enforces:
//   status='published' AND device intersect with current_practice_id()
// We never duplicate that filter in the app layer — RLS is the single
// source of truth for visibility.
//
// User-facing filters (search, indication category, Fitzpatrick) layer
// on top: they refine within the RLS-visible set, never expand.

// ------------------------------------------------------------
// listProtocolsForPractice — drives /portal/protocols list view
// ------------------------------------------------------------
export async function listProtocolsForPractice(
  filters: ProtocolFilters,
): Promise<PortalProtocolRow[]> {
  const supabase = await getAuthServerClient();

  let query = supabase
    .from("protocols")
    .select(
      `
      id,
      sanity_id,
      title,
      slug,
      short_description,
      indication_tags,
      fitzpatrick_types,
      current_version,
      last_published_at,
      indication_category:indication_categories(id, title, slug)
    `,
    )
    .order("title", { ascending: true });

  if (filters.search && filters.search.length > 0) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.indicationCategoryIds && filters.indicationCategoryIds.length > 0) {
    query = query.in(
      "indication_category_id",
      filters.indicationCategoryIds,
    );
  }
  if (filters.fitzpatrickTypes && filters.fitzpatrickTypes.length > 0) {
    query = query.overlaps("fitzpatrick_types", filters.fitzpatrickTypes);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[portal/protocols] list error", error);
    return [];
  }
  return (data ?? []).map(normalizeRow);
}

// PostgREST returns relational joins as either an object or array;
// normalize into our shape with a single object reference.
function normalizeRow(raw: unknown): PortalProtocolRow {
  const r = raw as Record<string, unknown>;
  const ic = r.indication_category;
  const indication = Array.isArray(ic)
    ? ((ic[0] ?? null) as PortalProtocolRow["indication_category"])
    : ((ic ?? null) as PortalProtocolRow["indication_category"]);
  return {
    id: r.id as string,
    sanity_id: r.sanity_id as string,
    title: r.title as string,
    slug: r.slug as string,
    short_description: (r.short_description as string | null) ?? null,
    indication_tags: (r.indication_tags as string[] | null) ?? null,
    fitzpatrick_types: (r.fitzpatrick_types as string[] | null) ?? null,
    current_version: (r.current_version as string | null) ?? null,
    last_published_at: (r.last_published_at as string | null) ?? null,
    indication_category: indication,
  };
}

// Distinguishes the three empty states. Returns counts that the page
// uses to pick the right copy:
//   - ownedDeviceCount: how many devices the practice has on file
//   - visibleProtocolCount: how many protocols the practice can see
//     (RLS-gated, no filters applied)
export async function getEmptyStateCounts(): Promise<{
  ownedDeviceCount: number;
  visibleProtocolCount: number;
}> {
  const supabase = await getAuthServerClient();

  const [{ count: deviceCount }, { count: protocolCount }] = await Promise.all([
    supabase
      .from("practice_devices")
      .select("id", { count: "exact", head: true }),
    supabase.from("protocols").select("id", { count: "exact", head: true }),
  ]);

  return {
    ownedDeviceCount: deviceCount ?? 0,
    visibleProtocolCount: protocolCount ?? 0,
  };
}

// Fetches the indications that have at least one practice-visible
// protocol. Powers the indication multi-select filter — we don't show
// taxonomy entries the practice can't actually filter against.
export async function listVisibleIndications() {
  const supabase = await getAuthServerClient();

  // Pull the indication_category_id from every visible protocol, dedupe,
  // then fetch the full categories. Two-step keeps RLS tight (we don't
  // want to list categories the practice can't filter on).
  const { data: visibleProtocols } = await supabase
    .from("protocols")
    .select("indication_category_id");

  const ids = Array.from(
    new Set(
      ((visibleProtocols ?? []) as Array<{ indication_category_id: string | null }>)
        .map((r) => r.indication_category_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("indication_categories")
    .select("id, title, slug")
    .in("id", ids)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// ------------------------------------------------------------
// getProtocolBySlugForPractice — drives /portal/protocols/[slug]
// ------------------------------------------------------------
// Joins the Supabase metadata row (RLS-gated) with the full Sanity
// document content. Returns null on any miss — the route renders 404.
//
// Sanity content cached at the fetch layer with tag-based revalidation
// (5-minute ISR per spec callout 4). Webhook-triggered revalidateTag
// is deferred to P11/P12 polish.
export async function getProtocolBySlugForPractice(
  slug: string,
): Promise<{
  protocol: PortalProtocolRow;
  sanityDoc: Protocol | null;
} | null> {
  const supabase = await getAuthServerClient();
  const { data, error } = await supabase
    .from("protocols")
    .select(
      `
      id,
      sanity_id,
      title,
      slug,
      short_description,
      indication_tags,
      fitzpatrick_types,
      current_version,
      last_published_at,
      indication_category:indication_categories(id, title, slug)
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return null;
  }

  const protocol = normalizeRow(data);
  const sanityDoc = await fetchProtocolSanityContent(protocol.sanity_id, slug);

  return { protocol, sanityDoc };
}

// ------------------------------------------------------------
// Sanity content fetch with ISR
// ------------------------------------------------------------
const PROTOCOL_FIELDS = groq`
  _id, _type, _rev, _createdAt, _updatedAt,
  title, slug, shortDescription,
  "indication": indication->{ _id, _type, title, slug },
  indicationTags, fitzpatrickTypes,
  overview, parameterEnvelope, sessionGuidance,
  prepKitRequired, recoveryKitRequired, maintenanceKitRecommended,
  biologicControlNotes,
  contraindications, expectedOutcomes, complications,
  references,
  lastReviewed, status
`;

async function fetchProtocolSanityContent(
  sanityId: string,
  slug: string,
): Promise<Protocol | null> {
  const query = groq`*[_id == $id && _type == "protocol"][0]{ ${PROTOCOL_FIELDS} }`;
  return sanityClient.fetch<Protocol | null>(
    query,
    { id: sanityId },
    { next: { tags: [`protocol:${slug}`], revalidate: 300 } },
  );
}
