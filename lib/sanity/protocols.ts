import "server-only";
import { groq } from "next-sanity";
import { sanityClient } from "./client";
import type { Indication, Protocol } from "./types";

// P4 — Sanity client wrapper for the protocol library.
//
// Mapping note: the Sanity document type `indication` maps to the
// Supabase table `public.indication_categories`. The names diverge
// to avoid future churn around per-document indication fields. All
// sync logic in lib/admin/protocols-sync.ts uses this mapping.
//
// These helpers are server-only and used by:
//   - The Sanity webhook handler (idempotent fetch-by-id for sync)
//   - The admin force-resync endpoint
//   - The admin detail view (server component reads full content)

// ----- GROQ field projections -----

const INDICATION_FIELDS = groq`
  _id, _type, _rev, _createdAt, _updatedAt,
  title, slug, shortDescription, description,
  icon, displayOrder, sortOrder, isPublic
`;

const PROTOCOL_FIELDS = groq`
  _id, _type, _rev, _createdAt, _updatedAt,
  title, slug, shortDescription,
  "indication": indication->{ _id, _type, title, slug },
  indicationTags, fitzpatrickTypes,
  overview, parameterEnvelope, sessionGuidance,
  prepKitRequired, recoveryKitRequired, maintenanceKitRecommended,
  biologicControlNotes,
  contraindications, expectedOutcomes, complications,
  supportingDocuments, references,
  lastReviewed, status
`;

// ----- Indication fetchers -----

export async function fetchIndicationFromSanity(
  sanityId: string,
): Promise<Indication | null> {
  const query = groq`*[_id == $id && _type == "indication"][0]{ ${INDICATION_FIELDS} }`;
  return sanityClient.fetch<Indication | null>(query, { id: sanityId });
}

export async function fetchAllIndicationsFromSanity(): Promise<Indication[]> {
  const query = groq`*[_type == "indication"] | order(displayOrder asc, title asc){ ${INDICATION_FIELDS} }`;
  return sanityClient.fetch<Indication[]>(query, {});
}

// ----- Protocol fetchers -----

export async function fetchProtocolFromSanity(
  sanityId: string,
): Promise<Protocol | null> {
  const query = groq`*[_id == $id && _type == "protocol"][0]{ ${PROTOCOL_FIELDS} }`;
  return sanityClient.fetch<Protocol | null>(query, { id: sanityId });
}

export async function fetchAllProtocolsFromSanity(): Promise<Protocol[]> {
  const query = groq`*[_type == "protocol"] | order(title asc){ ${PROTOCOL_FIELDS} }`;
  return sanityClient.fetch<Protocol[]>(query, {});
}
