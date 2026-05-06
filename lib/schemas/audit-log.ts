import { z } from "zod";

// P14 — audit log filter + list query schemas.

// actor_role values come from the audit_log column. NULL = system action
// (service-role with no acting user — webhook, scheduled job, etc.).
// The UI represents NULL as "System" in the actor-role filter.
export const ACTOR_ROLE_FILTER_VALUES = [
  "admin",
  "practice",
  "system", // sentinel — translates to actor_role IS NULL on the server
] as const;
export type ActorRoleFilter = (typeof ACTOR_ROLE_FILTER_VALUES)[number];

export const auditLogFiltersSchema = z.object({
  q: z.string().trim().max(500).optional(),
  actor_id: z.string().uuid().optional(),
  actor_role: z.enum(ACTOR_ROLE_FILTER_VALUES).optional(),
  action: z.string().trim().max(100).optional(),
  target_type: z.string().trim().max(50).optional(),
  target_id: z.string().uuid().optional(),
  practice_id: z.string().uuid().optional(),
  date_from: z.string().optional(), // ISO date string from <input type="date">
  date_to: z.string().optional(),
  page: z.coerce.number().int().min(1).max(10000).optional(),
  page_size: z.coerce.number().int().min(1).max(200).optional(),
});
export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>;

// CSV export shares filters but ignores pagination.
export const auditLogExportFiltersSchema = auditLogFiltersSchema.omit({
  page: true,
  page_size: true,
});
export type AuditLogExportFilters = z.infer<typeof auditLogExportFiltersSchema>;
