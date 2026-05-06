import { z } from "zod";

// P13 — Vendor schemas.

export const VENDOR_CATEGORIES = [
  "manufacturer",
  "software_vendor",
  "service_provider",
  "logistics",
  "professional_services",
  "other",
] as const;
export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_STATUSES = ["active", "paused", "former"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

const trimmedString = (max: number) =>
  z.string().trim().max(max).optional().nullable();

export const vendorCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.enum(VENDOR_CATEGORIES),
  description: trimmedString(2000),
  contact_name: trimmedString(200),
  contact_email: z.string().trim().email().max(200).optional().nullable().or(z.literal("")),
  contact_phone: trimmedString(50),
  whatsapp: trimmedString(100),
  telegram: trimmedString(100),
  signal: trimmedString(100),
  website: trimmedString(500),
  account_id: trimmedString(200),
  notes: trimmedString(8000),
  status: z.enum(VENDOR_STATUSES).default("active"),
});
export type VendorCreateInput = z.infer<typeof vendorCreateSchema>;

export const vendorUpdateSchema = vendorCreateSchema.partial();
export type VendorUpdateInput = z.infer<typeof vendorUpdateSchema>;

export const vendorListFiltersSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z
    .union([z.enum(VENDOR_CATEGORIES), z.array(z.enum(VENDOR_CATEGORIES))])
    .optional(),
  status: z
    .union([z.enum(VENDOR_STATUSES), z.array(z.enum(VENDOR_STATUSES))])
    .optional(),
});
export type VendorListFilters = z.infer<typeof vendorListFiltersSchema>;
