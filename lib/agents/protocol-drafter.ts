import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { getServiceClient } from "@/lib/supabase/server";

// P11 — Protocol Drafter.
// Takes an existing protocol + Roni's clinical direction and
// drafts an update suitable for Sanity Studio. Output is text-
// only — Roni applies in Sanity manually, then records the
// applied_action via /api/admin/ai/runs/[id]/approve.

const SYSTEM_PROMPT = `You are a clinical protocol drafter for Precise Aesthetics. Roni Bolton (Clinical Director) asks you to draft updates to existing protocols based on her clinical direction and supporting data.

Voice: precise, clinical, system-first. Match the existing protocol's voice exactly.

You will receive:
- The current protocol's full content
- The clinical direction for the update (Roni's instruction)
- Supporting outcome data, if available

Return a JSON object with this structure:

\`\`\`json
{
  "version_bump_recommendation": "minor | major",
  "version_bump_rationale": "Why this is minor or major",
  "changes": [
    {
      "section": "parameter_envelope | overview | biologic_control | contraindications | session_guidance",
      "before": "Current text or value",
      "after": "Proposed text or value",
      "rationale": "Why this change"
    }
  ],
  "summary_for_practitioners": "1-2 sentence summary of what changes for practitioners using this protocol",
  "open_questions": ["Things to verify or decide before publishing"]
}
\`\`\`

Be specific. Reference actual numeric values from parameter envelopes. Do not paraphrase clinical content. If the direction is ambiguous, ask in open_questions.`;

export interface ProtocolDrafterParams {
  triggeredByUserId: string;
  /** Sanity document _id, OR our protocols.id (we resolve via the
   *  same protocols table and pass the full content as text). */
  protocolId: string;
  direction: string;
  supportingDataSummary?: string | null;
}

export async function runProtocolDrafter(
  params: ProtocolDrafterParams,
): Promise<AgentRunResult> {
  // Protocols table stores metadata only — full clinical content
  // lives in Sanity. We pass the metadata + slug so the model
  // can reference the protocol; Roni includes the relevant
  // sections from Sanity in `direction` or `supportingDataSummary`
  // when she has specific clauses she wants reworked.
  const supabase = getServiceClient();
  const { data: protocolRow } = await supabase
    .from("protocols")
    .select(
      "id, sanity_id, title, slug, short_description, current_version, indication_tags, fitzpatrick_types",
    )
    .eq("id", params.protocolId)
    .single();

  if (!protocolRow) {
    // Still log a failed run for the audit trail.
    return runAgent({
      agentType: "protocol_drafter",
      model: "claude-sonnet-4-5",
      systemPrompt: SYSTEM_PROMPT,
      userMessage: `Protocol not found (id=${params.protocolId}). Direction: ${params.direction}`,
      triggeredByUserId: params.triggeredByUserId,
      triggerType: "manual",
      triggerContext: { protocol_id: params.protocolId, direction: params.direction },
    });
  }

  const userMessage = [
    `## Current protocol metadata`,
    `**Title:** ${protocolRow.title}`,
    `**Slug:** ${protocolRow.slug}`,
    `**Current version:** ${protocolRow.current_version ?? "(none)"}`,
    `**Sanity id:** ${protocolRow.sanity_id}`,
    `**Short description:** ${protocolRow.short_description ?? "(none)"}`,
    `**Indications:** ${(protocolRow.indication_tags ?? []).join(", ") || "(none)"}`,
    `**Fitzpatrick types:** ${(protocolRow.fitzpatrick_types ?? []).join(", ") || "(none)"}`,
    ``,
    `_Full protocol content lives in Sanity Studio. Roni includes any specific clauses she wants reworked in the direction below or in supporting data._`,
    ``,
    `## Clinical direction (from Roni)`,
    params.direction,
    ``,
    params.supportingDataSummary
      ? `## Supporting data\n\n${params.supportingDataSummary}`
      : `## Supporting data\n\n_None provided._`,
  ].join("\n");

  return runAgent({
    agentType: "protocol_drafter",
    model: "claude-sonnet-4-5",
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: {
      protocol_id: params.protocolId,
      protocol_title: protocolRow.title,
      direction: params.direction,
    },
    maxTokens: 4096,
    temperature: 0.3,
  });
}
