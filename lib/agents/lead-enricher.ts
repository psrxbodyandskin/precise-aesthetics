import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { getServiceClient } from "@/lib/supabase/server";

// P11 — Lead Enricher (auto-trigger).
// Fires fire-and-forget on lead/demo/contact creation. Idempotent
// at the data layer: if `enriched_at` is non-null on the source
// record, skip. The runAgent call itself doesn't dedupe;
// idempotency lives in the caller.

const SYSTEM_PROMPT = `You are a lead enrichment agent for Precise Aesthetics. Given a B2B lead from a clinical practice, infer relevant context that helps the sales team prepare for outreach.

Voice: factual, hedged where uncertain.

You will receive:
- Lead's email, name, practice name (if provided), state, role
- Optionally: any UTM context

Return a JSON object:

\`\`\`json
{
  "practice_inferred": {
    "type": "Dermatology | Plastic surgery | Medspa | Multi-specialty | Unknown",
    "size_hint": "Solo | Small (2-5) | Mid (6-15) | Large (16+) | Unknown",
    "specialty_focus": ["Aesthetics", "Surgical", etc.],
    "geographic_market": "City/region inferred from email domain, name, etc."
  },
  "practitioner_inferred": {
    "credentials_likely": ["MD", "DO", "APRN", "PA"],
    "years_in_practice_hint": "Less than 5 | 5-15 | 15+ | Unknown"
  },
  "outreach_notes": "1-2 sentence prep note for the sales team",
  "confidence": "low | medium | high",
  "data_sources_used": ["domain analysis", "public license database (if state-mentioned)"]
}
\`\`\`

Do not invent information. If you don't have enough context, return low confidence and short notes.`;

export type LeadType = "lead" | "demo" | "contact";

export interface LeadEnricherParams {
  leadType: LeadType;
  leadId: string;
  /** Manual re-trigger from /admin/inbox/[type]/[id]; null/auto-triggered
   *  bookkeeps as system trigger (no triggered_by_user_id). */
  triggeredByUserId?: string | null;
  triggerType?: "manual" | "auto";
}

export async function runLeadEnricher(
  params: LeadEnricherParams,
): Promise<AgentRunResult | { runId: ""; status: "skipped"; reason: string }> {
  const supabase = getServiceClient();
  const triggerType = params.triggerType ?? "auto";

  // Resolve source record + idempotency check.
  const tableName = sourceTableName(params.leadType);
  const { data: source } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", params.leadId)
    .single();

  if (!source) {
    // Treat as a no-op — caller (auto-trigger) shouldn't crash on this.
    return { runId: "", status: "skipped", reason: "Source record not found" };
  }

  // Idempotency: skip if already enriched. Manual re-trigger
  // bypasses this check (caller passes triggerType='manual' AND
  // wants a fresh replay) — but we still need a way to express
  // "force re-run". Convention: triggerType='manual' bypasses
  // idempotency since it's a deliberate replay.
  if (
    triggerType === "auto" &&
    (source as { enriched_at?: string | null }).enriched_at
  ) {
    return {
      runId: "",
      status: "skipped",
      reason: "Already enriched (auto-trigger idempotency)",
    };
  }

  const userMessage = buildUserMessage(params.leadType, source);

  const result = await runAgent({
    agentType: "lead_enricher",
    model: "claude-haiku-4-5", // cheaper model for high-volume auto-trigger
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    triggeredByUserId: params.triggeredByUserId ?? null,
    triggerType,
    triggerContext: { lead_type: params.leadType, lead_id: params.leadId },
    maxTokens: 1500,
    temperature: 0.3,
  });

  // On success, write enrichment_data + enriched_at back to the
  // source record so /admin/inbox/[type]/[id] can render it
  // without re-fetching the agent_run.
  if (result.status === "success" && result.parsedOutput) {
    await supabase
      .from(tableName)
      .update({
        enrichment_data: result.parsedOutput as never,
        enriched_at: new Date().toISOString(),
      })
      .eq("id", params.leadId);
  }

  return result;
}

function sourceTableName(
  type: LeadType,
): "leads" | "demo_requests" | "contact_messages" {
  switch (type) {
    case "lead":
      return "leads";
    case "demo":
      return "demo_requests";
    case "contact":
      return "contact_messages";
  }
}

function buildUserMessage(type: LeadType, source: Record<string, unknown>): string {
  const base = [
    `## Lead type`,
    type,
    ``,
    `## Submission details`,
    JSON.stringify(
      {
        email: source.email,
        first_name: source.first_name ?? source.full_name ?? null,
        last_name: source.last_name ?? null,
        practice_name: source.practice_name ?? source.organization ?? null,
        role: source.role ?? null,
        state: source.state ?? null,
        utm_source: source.utm_source ?? null,
        utm_medium: source.utm_medium ?? null,
        utm_campaign: source.utm_campaign ?? null,
      },
      null,
      2,
    ),
  ];
  return base.join("\n");
}
