import { z } from "zod";

// P8 — Inbox status workflow schemas (admin-only).

export const INBOX_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "closed",
] as const;
export type InboxStatusValue = (typeof INBOX_STATUSES)[number];

export const INBOX_STATUS_LABELS: Record<InboxStatusValue, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
};

export const INBOX_ITEM_TYPES = ["lead", "demo", "contact"] as const;
export type InboxItemTypeValue = (typeof INBOX_ITEM_TYPES)[number];

export const INBOX_TYPE_LABELS: Record<InboxItemTypeValue, string> = {
  lead: "Lead",
  demo: "Demo Request",
  contact: "Contact Message",
};

export const inboxItemUpdateSchema = z
  .object({
    status: z.enum(INBOX_STATUSES).optional(),
    adminNotes: z.string().max(4000).optional().or(z.literal("")),
  })
  .refine(
    (v) => v.status !== undefined || v.adminNotes !== undefined,
    { message: "Provide status or adminNotes." },
  );

export type InboxItemUpdateValues = z.infer<typeof inboxItemUpdateSchema>;
