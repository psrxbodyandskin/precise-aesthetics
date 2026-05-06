import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// P11 — server-only Anthropic client. The API key never leaves
// the server. Every call goes through API routes gated by
// requireAdmin().
//
// Lazy export pattern: fall back to a dummy client when
// ANTHROPIC_API_KEY is missing so importing this module doesn't
// crash the build. Routes that actually invoke the API will
// fail with a clear runtime error captured by the agent_runs
// failure path (status='failed', error_message logged).

const apiKey = process.env.ANTHROPIC_API_KEY;

export const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export const ANTHROPIC_AVAILABLE = Boolean(apiKey);

// Pricing per 1M tokens — May 2026 rates.
//
// Pull current pricing from https://www.anthropic.com/pricing
// before the first prod deploy and update this constant if
// either model has shifted. Cost tracking is honest only if
// these numbers match Anthropic's billing.
export const MODEL_PRICING = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
} as const;

export type AnthropicModel = keyof typeof MODEL_PRICING;

export function calculateCost(
  model: AnthropicModel,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}
