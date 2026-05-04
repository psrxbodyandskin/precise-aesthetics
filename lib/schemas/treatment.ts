import { z } from "zod";

// P6 — Treatment logging schemas.
//
// Validates inputs at the form (RHF resolver) AND server boundary
// (API route). Refinements enforce conditional rules:
//   - protocolDeviationReason required if protocolDeviation = true
//   - adverseReactionDescription required if adverseReaction = true
//   - consentAffirmed required if photos attached

export const PATIENT_AGE_RANGES = [
  "under_18",
  "18_25",
  "26_35",
  "36_45",
  "46_55",
  "56_65",
  "over_65",
] as const;
export type PatientAgeRange = (typeof PATIENT_AGE_RANGES)[number];

export const PATIENT_AGE_RANGE_LABELS: Record<PatientAgeRange, string> = {
  under_18: "Under 18",
  "18_25": "18 – 25",
  "26_35": "26 – 35",
  "36_45": "36 – 45",
  "46_55": "46 – 55",
  "56_65": "56 – 65",
  over_65: "Over 65",
};

export const FITZPATRICK_TYPES = ["I", "II", "III", "IV", "V", "VI"] as const;
export type FitzpatrickType = (typeof FITZPATRICK_TYPES)[number];

export const PATIENT_SEX_OPTIONS = [
  "female",
  "male",
  "other",
  "undisclosed",
] as const;
export type PatientSex = (typeof PATIENT_SEX_OPTIONS)[number];

export const PATIENT_SEX_LABELS: Record<PatientSex, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  undisclosed: "Undisclosed",
};

export const PHOTO_CAPTURE_PHASES = [
  "before",
  "during",
  "after",
  "followup",
] as const;
export type PhotoCapturePhase = (typeof PHOTO_CAPTURE_PHASES)[number];

export const PHOTO_CAPTURE_PHASE_LABELS: Record<PhotoCapturePhase, string> = {
  before: "Before",
  during: "During",
  after: "After",
  followup: "Follow-up",
};

export const ADVERSE_EVENT_STATUSES = [
  "new",
  "reviewing",
  "addressed",
] as const;
export type AdverseEventStatus = (typeof ADVERSE_EVENT_STATUSES)[number];

// ----- Photo metadata (sent in JSON; the binary uploads separately) -----
export const photoMetadataSchema = z.object({
  filename: z.string().min(1).max(255),
  capturePhase: z.enum(PHOTO_CAPTURE_PHASES).optional(),
  caption: z.string().max(500).optional(),
});

export type PhotoMetadata = z.infer<typeof photoMetadataSchema>;

// ----- Main treatment log payload -----
export const treatmentLogSchema = z
  .object({
    enteredByUserId: z.string().uuid("Pick who logged this"),

    treatmentDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
      .refine(
        (s) => new Date(s + "T00:00:00") <= new Date(),
        "Treatment date can't be in the future",
      ),

    protocolId: z.string().uuid("Pick a protocol"),
    protocolVersionId: z.string().uuid(),
    protocolVersionLabel: z.string().min(1),
    protocolDeviation: z.boolean(),
    protocolDeviationReason: z.string().max(2000).optional(),

    patientAnonId: z.string().trim().max(40).optional().or(z.literal("")),
    patientAgeRange: z.enum(PATIENT_AGE_RANGES, {
      errorMap: () => ({ message: "Pick an age range" }),
    }),
    patientFitzpatrick: z.enum(FITZPATRICK_TYPES, {
      errorMap: () => ({ message: "Pick a Fitzpatrick type" }),
    }),
    patientSex: z.enum(PATIENT_SEX_OPTIONS).optional(),

    indication: z.string().min(1, "Pick an indication").max(120),
    treatmentSite: z.string().max(200).optional().or(z.literal("")),
    sessionNumber: z.coerce.number().int().min(1).max(999),

    wavelengthNm: z.coerce.number().int().min(1).max(20000).optional(),
    fluenceJPerCm2: z.coerce.number().min(0).max(999.99).optional(),
    pulseDurationPs: z.coerce.number().int().min(0).max(1000000).optional(),
    spotSizeMm: z.coerce.number().min(0).max(99.9).optional(),
    totalPulses: z.coerce.number().int().min(0).max(100000).optional(),
    treatmentDurationMinutes: z.coerce.number().int().min(0).max(720).optional(),

    prepKitUsed: z.boolean(),
    recoveryKitDispensed: z.boolean(),
    maintenanceKitRecommended: z.boolean(),

    notes: z.string().max(4000).optional().or(z.literal("")),

    adverseReaction: z.boolean(),
    adverseReactionDescription: z.string().max(4000).optional(),

    photoMetadata: z.array(photoMetadataSchema).optional(),
    consentAffirmed: z.boolean(),
  })
  .refine(
    (d) => !d.protocolDeviation || (d.protocolDeviationReason ?? "").trim().length > 0,
    {
      message: "Reason required when deviation is checked.",
      path: ["protocolDeviationReason"],
    },
  )
  .refine(
    (d) => !d.adverseReaction || (d.adverseReactionDescription ?? "").trim().length > 0,
    {
      message: "Describe the adverse reaction.",
      path: ["adverseReactionDescription"],
    },
  )
  .refine(
    (d) => !d.photoMetadata || d.photoMetadata.length === 0 || d.consentAffirmed,
    {
      message: "Patient consent required for clinical photos.",
      path: ["consentAffirmed"],
    },
  );

export type TreatmentLogValues = z.infer<typeof treatmentLogSchema>;

// ----- Practice-managed authorized user (P3 table writes) -----
export const SUGGESTED_ROLE_CHIPS = [
  "Practitioner",
  "MA",
  "Front desk",
  "RN",
  "NP",
  "Esthetician",
] as const;

export const authorizedUserCreateSchema = z.object({
  fullName: z.string().trim().min(1, "Add a name").max(200),
  roleLabel: z.string().trim().max(80).optional().or(z.literal("")),
});

export type AuthorizedUserCreateValues = z.infer<typeof authorizedUserCreateSchema>;

// ----- Admin: adverse event status update -----
export const adverseEventStatusUpdateSchema = z.object({
  status: z.enum(ADVERSE_EVENT_STATUSES).optional(),
  adminNotes: z.string().max(4000).optional().or(z.literal("")),
});

export type AdverseEventStatusUpdateValues = z.infer<
  typeof adverseEventStatusUpdateSchema
>;
