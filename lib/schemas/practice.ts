import { z } from "zod";

// US states (50 + DC + territories) — used by the State dropdown on the
// provisioning form. Two-letter postal abbreviations.
export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "PR", "VI", "GU", "AS", "MP",
] as const;

export type USState = (typeof US_STATES)[number];

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().nullable().or(z.literal(""));

// Per-device input on the provisioning form. `deviceId` references
// public.devices.id; serial number / acquired date are optional.
export const practiceDeviceInputSchema = z.object({
  deviceId: z.string().uuid("Pick a device"),
  serialNumber: optionalString(100),
  acquiredAt: z.string().optional().nullable(), // ISO date string from <input type="date">
});

export type PracticeDeviceInput = z.infer<typeof practiceDeviceInputSchema>;

// Full provisioning payload — what the admin form posts to
// POST /api/admin/practices.
export const practiceProvisioningSchema = z.object({
  // Identity (required: name + primaryEmail)
  name: z.string().trim().min(1, "Practice name is required").max(200),
  primaryEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(254),
  phone: optionalString(40),

  // Address — all optional in the schema; admins can provision without
  // a full address and ask for it during the setup wizard.
  addressLine1: optionalString(200),
  addressLine2: optionalString(200),
  city: optionalString(100),
  state: z
    .enum(US_STATES, { errorMap: () => ({ message: "Pick a state" }) })
    .optional()
    .nullable(),
  postalCode: optionalString(20),
  country: z.string().trim().length(2).default("US"),

  // Devices — at least zero, but practice should usually have one to be useful
  devices: z.array(practiceDeviceInputSchema).default([]),

  // Internal admin context (not shown to practice)
  internalNotes: optionalString(2000),
});

export type PracticeProvisioningValues = z.infer<typeof practiceProvisioningSchema>;

// Patch payload for the detail-view edit modals. Each section can post a
// subset of fields. All optional at this level; the API merges into the
// existing record.
export const practiceUpdateSchema = practiceProvisioningSchema
  .omit({ devices: true, primaryEmail: true })
  .partial();

export type PracticeUpdateValues = z.infer<typeof practiceUpdateSchema>;

// Status transitions
export const PRACTICE_STATUSES = [
  "pending",
  "active",
  "suspended",
  "archived",
] as const;
export type PracticeStatus = (typeof PRACTICE_STATUSES)[number];

export function isPracticeStatus(v: unknown): v is PracticeStatus {
  return typeof v === "string" && (PRACTICE_STATUSES as readonly string[]).includes(v);
}
