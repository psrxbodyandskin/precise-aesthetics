import { groq } from "next-sanity";
import { sanityClient } from "./client";
import type {
  CaseStudy,
  Indication,
  PressItem,
  SanityEvent,
  SiteSettings,
} from "./types";

// Note: protocol queries moved to lib/sanity/protocols.ts in P4 alongside
// the new Sanity schema. The portal-side practitioner viewer (P5) will
// read from the Supabase mirror via lib/admin/protocols.ts equivalents.

// =============================================================================
// Tag helpers — used with next: { tags } for fine-grained ISR revalidation
// =============================================================================
export const tags = {
  siteSettings: "siteSettings",
  events: "events",
  event: (slug: string) => `event:${slug}`,
  indications: "indications",
  press: "press",
  protocols: "protocols",
  protocol: (slug: string) => `protocol:${slug}`,
  caseStudies: "caseStudies",
  caseStudy: (slug: string) => `caseStudy:${slug}`,
} as const;

// =============================================================================
// Public queries (marketing site)
// =============================================================================

const SITE_SETTINGS_QUERY = groq`*[_type == "siteSettings" && _id == "siteSettings"][0]{
  _id, _type,
  companyName, tagline, defaultMetaDescription,
  contactEmail, contactPhone, pressEmail,
  socialLinks[]{ _key, _type, platform, url },
  footerNote,
  "launchEventReference": launchEventReference->{
    _id, _type, title, slug, eventType, startsAt, endsAt, status
  }
}`;

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityClient.fetch<SiteSettings | null>(
    SITE_SETTINGS_QUERY,
    {},
    { next: { tags: [tags.siteSettings] } },
  );
}

const PUBLIC_INDICATIONS_QUERY = groq`*[_type == "indication" && isPublic == true] | order(displayOrder asc, title asc){
  _id, _type, _createdAt, _updatedAt,
  title, slug, shortDescription, icon, displayOrder, isPublic
}`;

export async function getAllPublicIndications(): Promise<Indication[]> {
  return sanityClient.fetch<Indication[]>(
    PUBLIC_INDICATIONS_QUERY,
    {},
    { next: { tags: [tags.indications] } },
  );
}

const EVENT_BY_SLUG_QUERY = groq`*[_type == "event" && slug.current == $slug][0]{
  _id, _type, _createdAt, _updatedAt,
  title, slug, eventType, startsAt, endsAt,
  location, isHybrid, heroImage,
  description, agenda, capacity, rsvpEnabled, status
}`;

export async function getEventBySlug(slug: string): Promise<SanityEvent | null> {
  return sanityClient.fetch<SanityEvent | null>(
    EVENT_BY_SLUG_QUERY,
    { slug },
    { next: { tags: [tags.events, tags.event(slug)] } },
  );
}

const UPCOMING_EVENTS_QUERY = groq`*[_type == "event" && status == "upcoming"] | order(startsAt asc){
  _id, _type, _createdAt, _updatedAt,
  title, slug, eventType, startsAt, endsAt,
  location, isHybrid, heroImage, capacity, rsvpEnabled, status
}`;

export async function getUpcomingEvents(): Promise<SanityEvent[]> {
  return sanityClient.fetch<SanityEvent[]>(
    UPCOMING_EVENTS_QUERY,
    {},
    { next: { tags: [tags.events] } },
  );
}

const PRESS_ITEMS_QUERY = groq`*[_type == "pressItem" && displayOnPressPage == true] | order(publishedAt desc){
  _id, _type, _createdAt, _updatedAt,
  title, publication, publicationLogo, url, publishedAt, excerpt, displayOnPressPage
}`;

export async function getPressItems(): Promise<PressItem[]> {
  return sanityClient.fetch<PressItem[]>(
    PRESS_ITEMS_QUERY,
    {},
    { next: { tags: [tags.press] } },
  );
}

const CASE_STUDY_FIELDS = groq`
  _id, _type, _createdAt, _updatedAt,
  title, slug,
  "indication": indication->{ _id, title, slug },
  "protocol": protocol->{ _id, title, slug },
  patientProfile, sessionCount,
  beforeImage, afterImage,
  clinicalNarrative, consentObtained, publishedAt, status
`;

const CASE_STUDIES_BY_INDICATION_QUERY = groq`*[_type == "caseStudy" && status == "published" && consentObtained == true && indication->slug.current == $indicationSlug] | order(publishedAt desc){
  ${CASE_STUDY_FIELDS}
}`;

export async function getCaseStudiesByIndication(
  indicationSlug: string,
): Promise<CaseStudy[]> {
  return sanityClient.fetch<CaseStudy[]>(
    CASE_STUDIES_BY_INDICATION_QUERY,
    { indicationSlug },
    { next: { tags: [tags.caseStudies] } },
  );
}

const CASE_STUDY_BY_SLUG_QUERY = groq`*[_type == "caseStudy" && slug.current == $slug && consentObtained == true][0]{
  ${CASE_STUDY_FIELDS}
}`;

export async function getCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  return sanityClient.fetch<CaseStudy | null>(
    CASE_STUDY_BY_SLUG_QUERY,
    { slug },
    { next: { tags: [tags.caseStudies, tags.caseStudy(slug)] } },
  );
}
