import { z } from "zod";

export const LEAD_ROLES = ["physician", "aprn", "pa", "rn", "owner", "other"] as const;
export const LEAD_INTERESTS = ["demo", "launch_event", "press"] as const;

export type LeadRole = (typeof LEAD_ROLES)[number];
export type LeadInterest = (typeof LEAD_INTERESTS)[number];

export const leadFormSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(80, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(80, "Last name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email is too long"),
  practiceName: z
    .string()
    .trim()
    .min(1, "Practice name is required")
    .max(160, "Practice name is too long"),
  role: z.enum(LEAD_ROLES, {
    errorMap: () => ({ message: "Select a role" }),
  }),
  interest: z
    .array(z.enum(LEAD_INTERESTS))
    .max(LEAD_INTERESTS.length)
    .default([]),
  source: z.literal("teaser").default("teaser"),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
    })
    .optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
