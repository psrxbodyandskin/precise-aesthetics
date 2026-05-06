import "server-only";
import { runAgent, type AgentRunResult } from "./base";

// P11 — Communication Drafter.
// Drafts emails in brand voice. Output never auto-sends —
// "Use this" copies to clipboard + opens mailto in Roni's
// mail client (per Q7 spec).

const SYSTEM_PROMPT = `You are a communications drafter for Precise Aesthetics. You draft professional emails in the brand voice for clinical and business contexts.

Brand voice rules:
- System-first: the system is the subject, not the founder. Avoid "I"; use "we" sparingly.
- Calm authority: declarative, never promotional.
- No exclamation marks except in genuine surprise (rare).
- Sentence case throughout. No ALL CAPS. No emojis.
- Reference: Aesop, Loro Piana, Stripe enterprise. Editorial register.
- "Fitzpatrick I through VI" — written as prose, never "I-VI".
- "Prep, recovery, maintenance kits" — never "pre/post kits".
- "Precise System" / "Precise Pico" / "PIH Prevention Protocol" — trademarks on first appearance.

You will receive:
- The recipient's context (who they are, their relationship to Precise)
- The purpose of the email (welcome, follow-up, addressing concern, etc.)
- Optional: previous correspondence
- Optional: specific points to include

Return:

\`\`\`json
{
  "subject": "Email subject line",
  "body": "Full email body in plain text or markdown",
  "tone_notes": "What tone you struck and why",
  "alternatives": [
    { "subject": "...", "body": "..." }
  ]
}
\`\`\`

Provide 2 alternatives showing different angles. Roni picks the closest match and edits.`;

export interface CommunicationDrafterParams {
  triggeredByUserId: string;
  recipientContext: string;
  purpose: string;
  additionalNotes?: string | null;
}

export async function runCommunicationDrafter(
  params: CommunicationDrafterParams,
): Promise<AgentRunResult> {
  const userMessage = [
    `## Recipient context`,
    params.recipientContext,
    ``,
    `## Purpose`,
    params.purpose,
    params.additionalNotes ? `\n## Additional notes\n${params.additionalNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return runAgent({
    agentType: "communication_drafter",
    model: "claude-sonnet-4-5",
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: { purpose: params.purpose },
    maxTokens: 3072,
    temperature: 0.6,
  });
}
