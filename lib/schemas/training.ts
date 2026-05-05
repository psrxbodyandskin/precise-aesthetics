import { z } from "zod";

// P9 — Training library + certification schemas.
//
// Validates inputs at the form (RHF resolver) AND server boundary
// (API route). Shared status enums + audit verbs live here so both
// sides import from one place.

// ------------------------------------------------------------
// Status enums
// ------------------------------------------------------------
export const TRAINING_CONTENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;
export type TrainingContentStatus = (typeof TRAINING_CONTENT_STATUSES)[number];

export const TRAINING_CONTENT_STATUS_LABELS: Record<
  TrainingContentStatus,
  string
> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export const CERTIFICATION_STATUSES = [
  "in_progress",
  "certified",
  "expired",
  "revoked",
] as const;
export type CertificationStatus = (typeof CERTIFICATION_STATUSES)[number];

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> =
  {
    in_progress: "In progress",
    certified: "Certified",
    expired: "Expired",
    revoked: "Revoked",
  };

// ------------------------------------------------------------
// Slug helper — lowercase + hyphenate, mirrors Sanity's pattern
// ------------------------------------------------------------
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ------------------------------------------------------------
// Module — create / update
// ------------------------------------------------------------
export const moduleCreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase + hyphenated"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  requiredWatchPercentage: z.number().int().min(50).max(100).default(90),
});

export type ModuleCreateValues = z.infer<typeof moduleCreateSchema>;

export const moduleUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase + hyphenated")
    .optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  requiredWatchPercentage: z.number().int().min(50).max(100).optional(),
  status: z.enum(TRAINING_CONTENT_STATUSES).optional(),
});

export type ModuleUpdateValues = z.infer<typeof moduleUpdateSchema>;

// ------------------------------------------------------------
// Module video — admin saves storage path + duration after the
// browser uploads directly to Supabase Storage (Vercel body limit
// forbids proxying 5 GB files).
// ------------------------------------------------------------
export const moduleVideoSchema = z.object({
  storagePath: z.string().trim().min(1).max(512),
  durationSeconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
  thumbnailStoragePath: z.string().trim().min(1).max(512).optional(),
});
export type ModuleVideoValues = z.infer<typeof moduleVideoSchema>;

// Manual-fallback duration entry (per Q3 — when client-side
// metadata read fails on certain video formats).
export const moduleManualDurationSchema = z.object({
  durationSeconds: z.number().int().min(1).max(60 * 60 * 24),
});

// ------------------------------------------------------------
// Module materials
// ------------------------------------------------------------
export const moduleMaterialSchema = z.object({
  title: z.string().trim().min(1).max(200),
  storagePath: z.string().trim().min(1).max(512),
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  byteSize: z.number().int().min(1),
  sortOrder: z.number().int().min(0).max(1000).optional().default(0),
});
export type ModuleMaterialValues = z.infer<typeof moduleMaterialSchema>;

// ------------------------------------------------------------
// Curriculum — create / update / order
// ------------------------------------------------------------
export const curriculumCreateSchema = z.object({
  deviceId: z.string().uuid(),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type CurriculumCreateValues = z.infer<typeof curriculumCreateSchema>;

export const curriculumUpdateSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(TRAINING_CONTENT_STATUSES).optional(),
});
export type CurriculumUpdateValues = z.infer<typeof curriculumUpdateSchema>;

export const curriculumAddModuleSchema = z.object({
  moduleId: z.string().uuid(),
  isRequired: z.boolean().optional().default(true),
});
export type CurriculumAddModuleValues = z.infer<
  typeof curriculumAddModuleSchema
>;

export const curriculumReorderSchema = z.object({
  moduleIds: z.array(z.string().uuid()).min(1).max(200),
});
export type CurriculumReorderValues = z.infer<typeof curriculumReorderSchema>;

// ------------------------------------------------------------
// Portal — module progress (server-trusted)
// ------------------------------------------------------------
// Posted every 10s during playback. Server clamps watch_percentage
// to a monotonically-non-decreasing value so a backseek can't
// reduce progress.
export const moduleProgressSchema = z.object({
  watchPercentage: z.number().int().min(0).max(100),
  lastPositionSeconds: z.number().int().min(0).max(60 * 60 * 24),
});
export type ModuleProgressValues = z.infer<typeof moduleProgressSchema>;

// Acknowledge + complete — fired when checkbox is checked. Server
// re-validates that watch_percentage >= module.required_watch_percentage.
export const moduleAcknowledgeSchema = z.object({
  practiceUserId: z.string().uuid().optional().nullable(),
});
export type ModuleAcknowledgeValues = z.infer<typeof moduleAcknowledgeSchema>;

// ------------------------------------------------------------
// Portal — certify (final step after all required modules complete)
// ------------------------------------------------------------
export const certifyCurriculumSchema = z.object({
  certifiedByUserId: z.string().uuid(),
});
export type CertifyCurriculumValues = z.infer<typeof certifyCurriculumSchema>;

// ------------------------------------------------------------
// Admin — re-cert flag flip
// ------------------------------------------------------------
export const recertFlagSchema = z.object({
  recertRequired: z.boolean(),
  recertReason: z.string().trim().max(500).optional().or(z.literal("")),
});
export type RecertFlagValues = z.infer<typeof recertFlagSchema>;

// ------------------------------------------------------------
// Audit log verbs — single source of truth (P9 set per Q7)
// ------------------------------------------------------------
export const TRAINING_AUDIT_VERBS = {
  // Curriculum lifecycle
  curriculumCreated: "curriculum.created",
  curriculumPublished: "curriculum.published",
  curriculumUnpublished: "curriculum.unpublished",
  curriculumArchived: "curriculum.archived",
  curriculumModuleAdded: "curriculum.module_added",
  curriculumModuleRemoved: "curriculum.module_removed",
  curriculumModuleReordered: "curriculum.module_reordered",
  // Module lifecycle
  moduleCreated: "module.created",
  moduleUpdated: "module.updated",
  moduleVideoUploaded: "module.video_uploaded",
  moduleMaterialAdded: "module.material_added",
  moduleMaterialRemoved: "module.material_removed",
  modulePublished: "module.published",
  moduleUnpublished: "module.unpublished",
  // Certification lifecycle
  certificationGranted: "certification.granted",
  certificationRecertRequired: "certification.recert_required",
  certificationRecertResolved: "certification.recert_resolved",
} as const;

export type TrainingAuditVerb =
  (typeof TRAINING_AUDIT_VERBS)[keyof typeof TRAINING_AUDIT_VERBS];

export const TRAINING_AUDIT_TARGET_TYPES = {
  curriculum: "training_curriculum",
  module: "training_module",
  certification: "practice_certification",
} as const;
