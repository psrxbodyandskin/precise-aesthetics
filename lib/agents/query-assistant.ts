import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { getServiceClient } from "@/lib/supabase/server";
import { validateReadOnlySql } from "./sql-guard";

// P11 — Query Assistant.
// Three-pass design:
//   1. LLM: natural-language question → SQL query
//   2. Server: validate SQL is read-only, execute via
//      execute_readonly_query() RPC (READ ONLY transaction +
//      10s statement timeout + is_admin gate)
//   3. LLM: SQL + result + original question → human-readable answer
//
// Each LLM call lands its own agent_runs row. The "headline" run
// surfaced in /admin/ai/runs is the explanation pass; the SQL-
// generation pass links via replay_of_id for full audit.

const SQL_GENERATION_PROMPT = `You are a SQL query assistant for the Precise Aesthetics admin dashboard. You translate natural-language questions into PostgreSQL SELECT queries.

You have access to these tables in the public schema:
- treatments (de-identified clinical logs: id, practice_id, treatment_date, protocol_id, protocol_version_id, indication, treatment_site, patient_age_range, patient_fitzpatrick, patient_sex, session_number, wavelength_nm, fluence_j_per_cm2, pulse_duration_ps, spot_size_mm, total_pulses, treatment_duration_minutes, prep_kit_used, recovery_kit_dispensed, maintenance_kit_recommended, has_followup, entered_by_name, notes)
- treatment_adverse_events (id, treatment_id, practice_id, description, status, created_at)
- protocols (id, sanity_id, title, slug, status, current_version, indication_tags, fitzpatrick_types)
- protocol_versions (id, protocol_id, version, title, published_at)
- protocol_devices (protocol_id, device_id)
- practices (id, name, status, city, state, primary_email, created_at)
- practice_devices (practice_id, device_id)
- practice_authorized_users (id, practice_id, full_name, role_label, is_active)
- training_modules, training_curricula, curriculum_modules, module_progress
- practice_certifications (id, practice_id, practice_user_id, device_id, status, certified_at)
- leads, demo_requests, contact_messages
- notifications, notification_dispatch_log
- audit_log

Rules:
- SELECT only. No INSERT, UPDATE, DELETE, ALTER, DROP, CREATE, TRUNCATE.
- No queries against auth.* or storage.* schemas.
- Use CTEs for clarity on complex queries.
- Always include LIMIT (default 100 if user doesn't specify).
- Aggregate where the question implies aggregation.
- Return ONLY the SQL query inside a fenced \`\`\`sql block. No commentary.

Example:
Question: "What's the PIH adverse event rate for Fitzpatrick V melasma in the last 90 days?"
\`\`\`sql
SELECT
  COUNT(DISTINCT t.id) AS total_treatments,
  COUNT(DISTINCT ae.id) AS adverse_events,
  ROUND(100.0 * COUNT(DISTINCT ae.id) / NULLIF(COUNT(DISTINCT t.id), 0), 2) AS pih_rate_pct
FROM treatments t
LEFT JOIN treatment_adverse_events ae ON ae.treatment_id = t.id
WHERE t.indication = 'melasma'
  AND t.patient_fitzpatrick = 'V'
  AND t.treatment_date >= NOW() - INTERVAL '90 days';
\`\`\``;

const EXPLANATION_PROMPT = `You are a clinical data analyst. Given a question, the SQL that was run against the Precise Aesthetics database, and the result rows, write a clear human-readable answer.

Voice: factual, specific, sentence case. Use numbers from the result. Note any limitations or caveats. Markdown allowed.

Format:
1. One-sentence direct answer.
2. Supporting detail with specific numbers.
3. Caveats only if they're material (e.g. small sample size, partial data window).`;

export interface QueryAssistantParams {
  triggeredByUserId: string;
  question: string;
}

export interface QueryAssistantResult extends AgentRunResult {
  sql?: string;
  queryResult?: unknown[];
  explanationRunId?: string;
}

export async function runQueryAssistant(
  params: QueryAssistantParams,
): Promise<QueryAssistantResult> {
  // Pass 1: SQL generation
  const sqlGenResult = await runAgent({
    agentType: "query_assistant",
    model: "claude-sonnet-4-5",
    systemPrompt: SQL_GENERATION_PROMPT,
    userMessage: params.question,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: { question: params.question, pass: "sql_generation" },
    maxTokens: 1500,
    temperature: 0.0, // deterministic for SQL
  });

  if (sqlGenResult.status !== "success" || !sqlGenResult.output) {
    return sqlGenResult;
  }

  // Extract SQL from fenced block
  const sqlMatch = sqlGenResult.output.match(/```sql\s*\n?([\s\S]*?)\n?```/);
  const rawSql = sqlMatch?.[1]?.trim() ?? sqlGenResult.output.trim();

  // Pass 2a: route-level safety check
  const guard = validateReadOnlySql(rawSql);
  if (!guard.safe) {
    // Treat as a failed run — write a synthetic row keyed off
    // the SQL-gen run so audit shows "rejected at the guard."
    const supabase = getServiceClient();
    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_message: `SQL guard rejected: ${guard.reason}`,
      })
      .eq("id", sqlGenResult.runId);
    return {
      ...sqlGenResult,
      status: "failed",
      error: `SQL guard rejected: ${guard.reason}`,
      sql: rawSql,
    };
  }

  // Pass 2b: execute via the read-only RPC
  const supabase = getServiceClient();
  let queryResult: unknown[] = [];
  try {
    const { data, error } = await supabase.rpc("execute_readonly_query", {
      query_text: rawSql,
    });
    if (error) {
      await supabase
        .from("agent_runs")
        .update({
          status: "failed",
          error_message: `SQL execution failed: ${error.message}`,
        })
        .eq("id", sqlGenResult.runId);
      return {
        ...sqlGenResult,
        status: "failed",
        error: `SQL execution failed: ${error.message}`,
        sql: rawSql,
      };
    }
    queryResult = (data ?? []) as unknown[];
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase
      .from("agent_runs")
      .update({
        status: "failed",
        error_message: `SQL execution threw: ${message}`,
      })
      .eq("id", sqlGenResult.runId);
    return {
      ...sqlGenResult,
      status: "failed",
      error: `SQL execution threw: ${message}`,
      sql: rawSql,
    };
  }

  // Pass 3: explanation run
  const explanationUserMsg = [
    `## Question`,
    params.question,
    ``,
    `## SQL`,
    `\`\`\`sql`,
    rawSql,
    `\`\`\``,
    ``,
    `## Result rows (JSON)`,
    JSON.stringify(queryResult, null, 2).slice(0, 8000), // cap input size
  ].join("\n");

  const explanationResult = await runAgent({
    agentType: "query_assistant",
    model: "claude-sonnet-4-5",
    systemPrompt: EXPLANATION_PROMPT,
    userMessage: explanationUserMsg,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: { question: params.question, pass: "explanation" },
    replayOfId: sqlGenResult.runId, // chain for audit
    maxTokens: 1500,
    temperature: 0.4,
  });

  return {
    ...explanationResult,
    sql: rawSql,
    queryResult,
    explanationRunId: explanationResult.runId,
  };
}
