import type { PortableTextBlock } from "@portabletext/types";

// =============================================================================
// Common
// =============================================================================
export type SanityRef = { _ref: string; _type: "reference" };

export interface SanitySlug {
  _type: "slug";
  current: string;
}

export interface SanityImage {
  _type: "image";
  asset: SanityRef;
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

// =============================================================================
// indication
// =============================================================================
// P4 mapping: Sanity `indication` document type → Supabase
// `public.indication_categories` table. Sync handled by the webhook
// in /api/webhooks/sanity/protocol on publish events.
export interface Indication {
  _id: string;
  _type: "indication";
  _rev?: string;
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: SanitySlug;
  shortDescription?: string;
  description?: PortableTextBlock[];
  icon?: string;
  displayOrder?: number;
  sortOrder?: number;
  isPublic: boolean;
}

// =============================================================================
// protocol  (GATED — never returned by public queries)
// =============================================================================
// P4 schema. Replaces an earlier stub. Authoring lives in Sanity;
// Supabase mirror at public.protocols + protocol_versions.
export type ProtocolStatus = "draft" | "published" | "archived";
export type FitzpatrickType = "I" | "II" | "III" | "IV" | "V" | "VI";

export interface ProtocolParameterRow {
  _key: string;
  _type: "parameterRow";
  wavelength?: string;
  fluenceMin?: number;
  fluenceMax?: number;
  pulseDuration?: number;
  spotSize?: string;
  fitzpatrickAdjustment?: string;
}

export interface ProtocolSessionGuidance {
  expectedSessions?: string;
  spacingWeeks?: string;
  notes?: PortableTextBlock[];
}

export interface ProtocolReference {
  _key: string;
  _type: "clinicalReference";
  citation: string;
  url?: string;
}

export interface SanityFileAsset {
  _key?: string;
  _type: "file";
  asset: SanityRef;
}

export interface Protocol {
  _id: string;
  _type: "protocol";
  _rev?: string;
  _createdAt: string;
  _updatedAt: string;

  // Identity
  title: string;
  slug: SanitySlug;
  shortDescription?: string;

  // Classification
  indication: SanityRef | Indication;
  indicationTags?: string[];
  fitzpatrickTypes?: FitzpatrickType[];

  // Clinical content
  overview?: PortableTextBlock[];
  parameterEnvelope?: ProtocolParameterRow[];
  sessionGuidance?: ProtocolSessionGuidance;

  // Biologic control
  prepKitRequired?: boolean;
  recoveryKitRequired?: boolean;
  maintenanceKitRecommended?: boolean;
  biologicControlNotes?: PortableTextBlock[];

  // Outcomes + safety
  contraindications?: PortableTextBlock[];
  expectedOutcomes?: PortableTextBlock[];
  complications?: PortableTextBlock[];

  // Supporting content
  supportingDocuments?: SanityFileAsset[];
  references?: ProtocolReference[];
  lastReviewed?: string;

  // Status
  status: ProtocolStatus;
}

// =============================================================================
// caseStudy  (GATED)
// =============================================================================
export type CaseStudyStatus = "draft" | "published" | "archived";

export interface PatientProfile {
  ageRange?: string;
  fitzpatrick?: number;
  presentingConcern?: string;
}

export interface CaseStudy {
  _id: string;
  _type: "caseStudy";
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: SanitySlug;
  indication: SanityRef | Indication;
  protocol?: SanityRef | Protocol;
  patientProfile?: PatientProfile;
  sessionCount?: number;
  beforeImage?: SanityImage;
  afterImage?: SanityImage;
  clinicalNarrative?: PortableTextBlock[];
  consentObtained: boolean;
  publishedAt?: string;
  status: CaseStudyStatus;
}

// =============================================================================
// event
// =============================================================================
export type EventType = "launch" | "webinar" | "conference" | "training";
export type EventStatus = "upcoming" | "live" | "past";

export interface EventLocation {
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  virtualLink?: string;
}

export interface AgendaItem {
  _key: string;
  _type: "agendaItem";
  time?: string;
  title: string;
  description?: string;
}

export interface SanityEvent {
  _id: string;
  _type: "event";
  _createdAt: string;
  _updatedAt: string;
  title: string;
  slug: SanitySlug;
  eventType: EventType;
  startsAt: string;
  endsAt?: string;
  location?: EventLocation;
  isHybrid?: boolean;
  heroImage?: SanityImage;
  description?: PortableTextBlock[];
  agenda?: AgendaItem[];
  capacity?: number;
  rsvpEnabled?: boolean;
  status: EventStatus;
}

// =============================================================================
// pressItem
// =============================================================================
export interface PressItem {
  _id: string;
  _type: "pressItem";
  _createdAt: string;
  _updatedAt: string;
  title: string;
  publication: string;
  publicationLogo?: SanityImage;
  url: string;
  publishedAt: string;
  excerpt?: string;
  displayOnPressPage: boolean;
}

// =============================================================================
// siteSettings  (singleton)
// =============================================================================
export type SocialPlatform = "instagram" | "linkedin" | "x" | "youtube" | "tiktok";

export interface SocialLink {
  _key: string;
  _type: "socialLink";
  platform: SocialPlatform;
  url: string;
}

export interface SiteSettings {
  _id: string;
  _type: "siteSettings";
  companyName: string;
  tagline: string;
  defaultMetaDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  pressEmail?: string;
  socialLinks?: SocialLink[];
  footerNote?: PortableTextBlock[];
  launchEventReference?: SanityRef | SanityEvent;
}
