import { z } from "zod";
import { LEAD_ROLES } from "./lead-form";

export const PRACTICE_TYPES = [
  "dermatology",
  "plastic_surgery",
  "medspa",
  "aesthetic_clinic",
  "other",
] as const;

export const YEARS_IN_OPERATION = [
  "less_than_1",
  "1_3",
  "3_5",
  "5_10",
  "10_20",
  "20_plus",
] as const;

export const PROVIDER_COUNTS = [
  "1",
  "2_3",
  "4_5",
  "6_10",
  "10_plus",
] as const;

export const TREATMENT_VOLUMES = [
  "0-10",
  "11-50",
  "51-150",
  "151-300",
  "300+",
] as const;

export const TREATMENT_CONDITIONS = [
  "pigment",
  "melasma",
  "acne",
  "acne_scarring",
  "tattoo_removal",
  "hair_removal",
  "other",
] as const;

export const CONFIDENCE_LEVELS = ["1", "2", "3", "4", "5"] as const;

export const YES_NO = ["yes", "no"] as const;

export const DEMO_TIMELINES = [
  "now",
  "30_days",
  "60_90_days",
  "exploring",
] as const;

export type PracticeType = (typeof PRACTICE_TYPES)[number];
export type YearsInOperation = (typeof YEARS_IN_OPERATION)[number];
export type ProviderCount = (typeof PROVIDER_COUNTS)[number];
export type TreatmentVolume = (typeof TREATMENT_VOLUMES)[number];
export type TreatmentCondition = (typeof TREATMENT_CONDITIONS)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type YesNo = (typeof YES_NO)[number];
export type DemoTimeline = (typeof DEMO_TIMELINES)[number];

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));

const optionalPercent = z
  .string()
  .trim()
  .regex(/^$|^\d{1,3}$/, "Enter a whole number 0–100")
  .optional()
  .or(z.literal(""));

export const demoRequestSchema = z.object({
  // Identity
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(254),
  phone: optionalString(40),

  // Practice info
  practiceName: z.string().trim().min(1, "Practice name is required").max(160),
  role: z.enum(LEAD_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
  practiceType: z
    .enum(PRACTICE_TYPES, {
      errorMap: () => ({ message: "Select a practice type" }),
    })
    .optional(),
  city: optionalString(80),
  state: optionalString(40),
  yearsInOperation: z.enum(YEARS_IN_OPERATION).optional(),
  providerCount: z.enum(PROVIDER_COUNTS).optional(),

  // Current practice & laser experience
  currentDevices: optionalString(500),
  treatmentConditions: z
    .array(z.enum(TREATMENT_CONDITIONS))
    .max(TREATMENT_CONDITIONS.length)
    .default([]),
  biggestChallenges: optionalString(2000),
  fitzpatrickConfidence: z.enum(CONFIDENCE_LEVELS).optional(),
  pihExperience: optionalString(2000),

  // Patient population
  patientPctI_III: optionalPercent,
  patientPctIV_VI: optionalPercent,
  monthlyTreatmentVolume: z.enum(TREATMENT_VOLUMES).optional(),

  // Practice goals
  topServices: optionalString(500),
  nextYearGoals: optionalString(2000),

  // Interest in Precise Pico
  whyPrecisePico: optionalString(2000),
  willStandardize: z.enum(YES_NO).optional(),
  willDataCollection: z.enum(YES_NO).optional(),
  willTraining: z.enum(YES_NO).optional(),
  earlyAdopterPitch: optionalString(2000),

  // Timeline + free notes (legacy)
  timeline: z.enum(DEMO_TIMELINES).optional(),
  notes: optionalString(2000),

  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
    })
    .optional(),
});

export type DemoRequestValues = z.infer<typeof demoRequestSchema>;
