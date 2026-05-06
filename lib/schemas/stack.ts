import { z } from "zod";

// P13 — Stack reference schemas.
//
// CRITICAL: env-var schema explicitly omits any `value` field. The
// API route doubles down with a runtime check that rejects any
// payload containing a `value` key, even if the frontend never
// sends one. Defense-in-depth.

export const STACK_CATEGORIES = [
  "hosting",
  "database",
  "auth",
  "email",
  "cms",
  "ai",
  "analytics",
  "monitoring",
  "storage",
  "domain",
  "payment",
  "other",
] as const;
export type StackCategory = (typeof STACK_CATEGORIES)[number];

export const STACK_STATUSES = ["active", "paused", "former"] as const;
export type StackStatus = (typeof STACK_STATUSES)[number];

const trimmedString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const stackServiceCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.enum(STACK_CATEGORIES),
  what_it_does: z.string().trim().min(1).max(500),
  plan_tier: trimmedString(100),
  monthly_cost_estimate_usd: z.number().min(0).max(99_999_999.99).optional().nullable(),
  renewal_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .optional()
    .nullable(),
  login_url: trimmedString(500),
  account_owner_user_id: z.string().uuid().optional().nullable(),
  credentials_storage_location: trimmedString(500),
  support_contact: trimmedString(500),
  documentation_links: trimmedString(8000),
  notes: trimmedString(8000),
  status: z.enum(STACK_STATUSES).default("active"),
});
export type StackServiceCreateInput = z.infer<typeof stackServiceCreateSchema>;

export const stackServiceUpdateSchema = stackServiceCreateSchema.partial();
export type StackServiceUpdateInput = z.infer<typeof stackServiceUpdateSchema>;

// Env var name — uppercase + underscores + digits, must start with letter.
export const ENV_VAR_NAME_RE = /^[A-Z][A-Z0-9_]*$/;

// CRITICAL: no `value` field. Do not add one. Server-side route
// also rejects payloads with a `value` key.
export const stackEnvVarCreateSchema = z
  .object({
    var_name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(ENV_VAR_NAME_RE, "Must be uppercase letters, digits, underscores; start with a letter"),
    description: trimmedString(500),
    set_in_vercel: z.boolean().default(false),
    set_in_local_env: z.boolean().default(false),
    is_secret: z.boolean().optional(), // server-side defaults: NEXT_PUBLIC_* → false, else true
  })
  .strict(); // reject unknown keys including `value`

export type StackEnvVarCreateInput = z.infer<typeof stackEnvVarCreateSchema>;

export const stackListFiltersSchema = z.object({
  category: z
    .union([z.enum(STACK_CATEGORIES), z.array(z.enum(STACK_CATEGORIES))])
    .optional(),
  status: z
    .union([z.enum(STACK_STATUSES), z.array(z.enum(STACK_STATUSES))])
    .optional(),
});
export type StackListFilters = z.infer<typeof stackListFiltersSchema>;
