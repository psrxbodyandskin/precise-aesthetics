import { z } from "zod";
import { US_STATES } from "./practice";

// Setup wizard schemas — one per step that writes to the database.
// Mirror the persistence-on-each-step contract: every submit hits the
// database, so closing the browser mid-wizard is recoverable on next
// login. Step 7 (Done) just flips practices.status from 'pending' →
// 'active'.

const optionalString = (max: number) =>
  z.string().trim().max(max).optional().nullable().or(z.literal(""));

// --- Step 2: set password ---
// Supabase enforces a configurable minimum on its own (default 6); we
// require 10 so practitioner accounts are never weaker than admin.
export const setupPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Use at least ten characters.")
      .max(200, "That password is too long."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "The two passwords don't match.",
    path: ["confirmPassword"],
  });

export type SetupPasswordValues = z.infer<typeof setupPasswordSchema>;

// --- Step 3: confirm practice profile ---
// Phone + address are all optional at the schema level; the wizard UI
// asks for them but doesn't block progression on a missing line. The
// admin-side provisioning data is already in place.
export const setupProfileSchema = z.object({
  phone: optionalString(40),
  addressLine1: optionalString(200),
  addressLine2: optionalString(200),
  city: optionalString(100),
  state: z
    .enum(US_STATES, { errorMap: () => ({ message: "Pick a state" }) })
    .optional()
    .nullable(),
  postalCode: optionalString(20),
});

export type SetupProfileValues = z.infer<typeof setupProfileSchema>;

// --- Step 4: authorized users ---
// Free-text role label (no enum) per practice-master spec — practices
// have weird role names and we don't force taxonomy. UI offers chips
// as suggestions only.
export const authorizedUserInputSchema = z.object({
  fullName: z.string().trim().min(1, "Add a name.").max(200),
  roleLabel: optionalString(80),
});

export type AuthorizedUserInput = z.infer<typeof authorizedUserInputSchema>;

export const setupAuthorizedUsersSchema = z.object({
  users: z.array(authorizedUserInputSchema).max(50, "Too many users."),
});

export type SetupAuthorizedUsersValues = z.infer<
  typeof setupAuthorizedUsersSchema
>;

// Suggested role chips — the UI offers these as one-click insertions
// but the field accepts anything practitioners type.
export const SUGGESTED_ROLE_CHIPS = [
  "Practitioner",
  "MA",
  "Front desk",
  "RN",
  "NP",
  "Esthetician",
] as const;

// --- Step ordering ---
// 01..07 — keeps the progress indicator readable in the UI without
// magic numbers scattered.
export const SETUP_STEPS = [
  { num: "01", slug: "welcome", title: "Welcome" },
  { num: "02", slug: "password", title: "Set password" },
  { num: "03", slug: "profile", title: "Confirm profile" },
  { num: "04", slug: "users", title: "Authorized users" },
  { num: "05", slug: "devices", title: "Confirm devices" },
  { num: "06", slug: "tour", title: "Brief tour" },
  { num: "07", slug: "done", title: "Done" },
] as const;

export type SetupStepSlug = (typeof SETUP_STEPS)[number]["slug"];

export function getSetupStep(slug: string) {
  return SETUP_STEPS.find((s) => s.slug === slug);
}
