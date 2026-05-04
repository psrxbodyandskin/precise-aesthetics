import { z } from "zod";

// Protocol schemas — used by P4 admin routes for protocol library
// management. Sanity is the source of truth for content; these
// schemas validate Supabase-side mutations only (status changes,
// device tagging, major-bump flag).

export const PROTOCOL_STATUSES = ["draft", "published", "archived"] as const;
export type ProtocolStatus = (typeof PROTOCOL_STATUSES)[number];

export const protocolStatusSchema = z.enum(PROTOCOL_STATUSES);

export function isProtocolStatus(v: unknown): v is ProtocolStatus {
  return typeof v === "string" && (PROTOCOL_STATUSES as readonly string[]).includes(v);
}

// Device tagging — the practitioner-visibility gate. Empty array
// is allowed at this level; the API route enforces "at least one
// device tagged before publish", but admins can still save zero
// devices on a draft.
export const protocolDeviceTagsSchema = z.object({
  deviceIds: z.array(z.string().uuid("Invalid device id")).max(20, "Too many devices"),
});

export type ProtocolDeviceTagsValues = z.infer<typeof protocolDeviceTagsSchema>;

// Major-bump toggle payload — admin clicks "Mark next publish as major"
// in the detail view. The webhook reads + clears the flag during sync.
export const protocolMajorBumpSchema = z.object({
  pendingMajorBump: z.boolean(),
});

export type ProtocolMajorBumpValues = z.infer<typeof protocolMajorBumpSchema>;

// List query params for /admin/protocols
export const protocolListQuerySchema = z.object({
  status: z.enum([...PROTOCOL_STATUSES, "all"]).default("all"),
  indication: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ProtocolListQueryValues = z.infer<typeof protocolListQuerySchema>;
