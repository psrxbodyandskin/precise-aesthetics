import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { HELP_KNOWLEDGE_BASE } from "@/lib/help/knowledge-base";

// P13 — Help Chatbot.
//
// Haiku-powered, knowledge-base-only. NO live database access —
// pure inference over the static knowledge base in
// lib/help/knowledge-base.ts. The conversation is held client-side;
// each request carries the full message history. Logged to
// agent_runs for cost tracking; conversation thread does not
// persist server-side.

export interface HelpChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface HelpAssistantParams {
  triggeredByUserId: string;
  /** Full conversation so far. The runner stitches them into a
   *  single user prompt so Anthropic sees the back-and-forth. */
  messages: HelpChatMessage[];
}

export async function runHelpAssistant(
  params: HelpAssistantParams,
): Promise<AgentRunResult> {
  if (params.messages.length === 0) {
    return {
      runId: "",
      status: "failed",
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: "No messages provided.",
    };
  }

  // Build the conversation as a single user message. We keep the
  // most recent user turn explicit at the bottom so the model
  // answers it directly.
  const history = params.messages
    .slice(0, -1)
    .map((m) =>
      m.role === "user"
        ? `<question>${m.content}</question>`
        : `<answer>${m.content}</answer>`,
    )
    .join("\n\n");

  const latest = params.messages[params.messages.length - 1];
  if (!latest || latest.role !== "user") {
    return {
      runId: "",
      status: "failed",
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: "Last message must be a user message.",
    };
  }

  const userMessage = history
    ? `Conversation so far:\n\n${history}\n\nCurrent question:\n\n${latest.content}`
    : latest.content;

  return runAgent({
    agentType: "help_assistant",
    model: "claude-haiku-4-5",
    systemPrompt: HELP_KNOWLEDGE_BASE,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: {
      message_count: params.messages.length,
    },
    maxTokens: 1024, // help answers should be concise
    temperature: 0.5, // lower for consistency
  });
}
