import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import {
  anthropic,
  ANTHROPIC_AVAILABLE,
  calculateCost,
  type AnthropicModel,
} from "@/lib/anthropic/client";
import type { Database } from "@/lib/supabase/types";

// P11 — base agent runner.
//
// Every agent invocation goes through here. Cross-cutting:
//   1. Insert agent_runs row with status='pending'
//   2. Call Anthropic with timing
//   3. Update row with success (output, tokens, cost, latency) or
//      failure (error message + latency)
//   4. Return shaped result for the caller's UI
//
// Idempotency at this layer is N/A — callers wrap auto-trigger
// agents (Lead Enricher) with their own idempotency check.

export type AgentType =
  | "pattern_analyst"
  | "protocol_drafter"
  | "practice_health_reviewer"
  | "communication_drafter"
  | "query_assistant"
  | "lead_enricher";

export interface AgentRunInput {
  agentType: AgentType;
  model: AnthropicModel;
  systemPrompt: string;
  userMessage: string;
  /** auth.users.id of the admin who clicked. null for auto-triggers. */
  triggeredByUserId?: string | null;
  triggerType: "manual" | "auto";
  triggerContext?: Record<string, unknown> | null;
  replayOfId?: string | null;
  /** Default 4096. */
  maxTokens?: number;
  /** Default 0.7. */
  temperature?: number;
}

export interface AgentRunResult {
  runId: string;
  status: "success" | "failed";
  output?: string;
  parsedOutput?: unknown;
  cost: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  error?: string;
}

type AgentRunRow = Database["public"]["Tables"]["agent_runs"]["Row"];
type AgentRunInsert = Database["public"]["Tables"]["agent_runs"]["Insert"];

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const supabase = getServiceClient();
  const startedAt = Date.now();

  // 1. Insert pending row first so even a Anthropic-side failure
  //    leaves a record. The agent_runs id becomes the handle the
  //    UI uses for replay + approval flows.
  const insertRow: AgentRunInsert = {
    agent_type: input.agentType,
    model: input.model,
    system_prompt: input.systemPrompt,
    user_message: input.userMessage,
    triggered_by_user_id: input.triggeredByUserId ?? null,
    trigger_type: input.triggerType,
    trigger_context: (input.triggerContext ?? null) as never,
    replay_of_id: input.replayOfId ?? null,
    status: "pending",
  };
  const { data: runRow, error: insertError } = await supabase
    .from("agent_runs")
    .insert(insertRow)
    .select("*")
    .single();
  if (insertError || !runRow) {
    // Couldn't persist — surface as a failure result so the
    // caller can show an error toast. No row to update.
    return {
      runId: "",
      status: "failed",
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      error: insertError?.message ?? "Could not record run.",
    };
  }
  const runId = (runRow as AgentRunRow).id;

  // Short-circuit if SDK isn't available — Anthropic key missing.
  if (!ANTHROPIC_AVAILABLE || !anthropic) {
    const latency = Date.now() - startedAt;
    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_message:
          "ANTHROPIC_API_KEY not configured on this environment.",
        latency_ms: latency,
      })
      .eq("id", runId);
    return {
      runId,
      status: "failed",
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: latency,
      error: "ANTHROPIC_API_KEY not configured on this environment.",
    };
  }

  // 2. Call Anthropic.
  try {
    const response = await anthropic.messages.create({
      model: input.model,
      max_tokens: input.maxTokens ?? 4096,
      temperature: input.temperature ?? 0.7,
      system: input.systemPrompt,
      messages: [{ role: "user", content: input.userMessage }],
    });

    const latency = Date.now() - startedAt;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateCost(input.model, inputTokens, outputTokens);

    // Extract text content blocks. Filter to type='text' since
    // some responses include other block types (tool use, etc.)
    // even though our calls don't use tools.
    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as { type: "text"; text: string }).text)
      .join("\n");

    // Try to extract embedded JSON. Most agent prompts ask for
    // a fenced ```json``` block. Falls back to null on any parse
    // failure — UI still shows the raw text in that case.
    let parsedOutput: unknown = null;
    const jsonMatch = textContent.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsedOutput = JSON.parse(jsonMatch[1]);
      } catch {
        parsedOutput = null;
      }
    }

    // 3. Update with success.
    await supabase
      .from("agent_runs")
      .update({
        raw_output: textContent,
        parsed_output: (parsedOutput ?? null) as never,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        status: "success",
        latency_ms: latency,
      })
      .eq("id", runId);

    return {
      runId,
      status: "success",
      output: textContent,
      parsedOutput,
      cost,
      inputTokens,
      outputTokens,
      latencyMs: latency,
    };
  } catch (err) {
    const latency = Date.now() - startedAt;
    const message = err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_message: message,
        latency_ms: latency,
      })
      .eq("id", runId);

    return {
      runId,
      status: "failed",
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: latency,
      error: message,
    };
  }
}

// ------------------------------------------------------------
// Run helpers — used by /admin/ai/runs surfaces
// ------------------------------------------------------------

export async function getAgentRun(id: string): Promise<AgentRunRow | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("agent_runs")
    .select("*")
    .eq("id", id)
    .single();
  return (data as AgentRunRow | null) ?? null;
}

export interface ListAgentRunsFilters {
  agentTypes?: AgentType[];
  statuses?: Array<"pending" | "success" | "failed" | "cancelled">;
  triggeredByUserId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listAgentRuns(
  filters: ListAgentRunsFilters = {},
): Promise<{ items: AgentRunRow[]; total: number; page: number; pageSize: number }> {
  const supabase = getServiceClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, filters.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("agent_runs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.agentTypes && filters.agentTypes.length > 0) {
    q = q.in("agent_type", filters.agentTypes);
  }
  if (filters.statuses && filters.statuses.length > 0) {
    q = q.in("status", filters.statuses);
  }
  if (filters.triggeredByUserId) {
    q = q.eq("triggered_by_user_id", filters.triggeredByUserId);
  }
  if (filters.startDate) q = q.gte("created_at", filters.startDate);
  if (filters.endDate) q = q.lte("created_at", filters.endDate);
  if (filters.search) {
    // Search both user_message + raw_output via OR. Postgres
    // text columns; not full-text index — fine at small scale.
    q = q.or(
      `user_message.ilike.%${filters.search}%,raw_output.ilike.%${filters.search}%`,
    );
  }

  const { data, count } = await q;
  return {
    items: (data ?? []) as AgentRunRow[],
    total: count ?? 0,
    page,
    pageSize,
  };
}

// Approve + apply (P11 — text-only record of external action)
export async function approveAgentRun(args: {
  runId: string;
  approverUserId: string;
  appliedAction?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getServiceClient();
  const nowIso = new Date().toISOString();
  const update: Database["public"]["Tables"]["agent_runs"]["Update"] = {
    approved_at: nowIso,
    approved_by_user_id: args.approverUserId,
  };
  if (args.appliedAction) {
    update.applied_action = args.appliedAction;
    update.applied_at = nowIso;
  }
  const { error } = await supabase
    .from("agent_runs")
    .update(update)
    .eq("id", args.runId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
