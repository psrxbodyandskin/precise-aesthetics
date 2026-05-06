import { z } from "zod";

// P11 — agent invocation schemas. Validates inputs at the API
// boundary before they reach the runner.

export const FITZPATRICK_SCHEMA = z.array(
  z.enum(["I", "II", "III", "IV", "V", "VI"]),
);

export const patternAnalystSchema = z.object({
  timeRangeStart: z.string().min(1),
  timeRangeEnd: z.string().min(1),
  filterByProtocol: z.string().uuid().nullable().optional(),
  filterByFitzpatrick: FITZPATRICK_SCHEMA.nullable().optional(),
  focusOnAdverseEvents: z.boolean().optional(),
});

export const protocolDrafterSchema = z.object({
  protocolId: z.string().uuid(),
  direction: z.string().trim().min(5).max(4000),
  supportingDataSummary: z.string().trim().max(8000).nullable().optional(),
});

export const practiceHealthSchema = z.object({
  timeRangeDays: z.number().int().min(1).max(365),
});

export const communicationDrafterSchema = z.object({
  recipientContext: z.string().trim().min(1).max(4000),
  purpose: z.string().trim().min(1).max(500),
  additionalNotes: z.string().trim().max(2000).nullable().optional(),
});

export const queryAssistantSchema = z.object({
  question: z.string().trim().min(3).max(2000),
});

export const leadEnricherSchema = z.object({
  leadType: z.enum(["lead", "demo", "contact"]),
  leadId: z.string().uuid(),
});

export const approveAgentRunSchema = z.object({
  appliedAction: z.string().trim().max(500).optional().nullable(),
});
