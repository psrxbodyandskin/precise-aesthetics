# Session P11 — AI Agent Integration

> Run after P10 (Notifications) is deployed and confirmed working. Builds the AI agent framework and wires all six on-demand agents into the admin panel. Anthropic API direct, robust observability via agent_runs table, cost tracking, replay capability.

## Setup

**Activate skills:** `ui-ux-pro-max`, `frontend-design`

**Read in order:**
1. `CLAUDE.md`
2. `design-system/MASTER.md`
3. `design-system/BRAND-IDENTITY.md`
4. `design-system/COPY-DECK.md`
5. `spec/PORTAL-MASTER-SPEC.md` (six-agent architecture reference)
6. `spec/RLS-PATTERNS.md`
7. `spec/SESSION-P4-PROTOCOL-LIBRARY-SCHEMA.md` (Pattern Analyst + Protocol Drafter use this data)
8. `spec/SESSION-P6-TREATMENT-LOGGING.md` (Pattern Analyst + Practice Health Reviewer use this data)
9. `spec/SESSION-P8-INBOX.md` (Lead Enricher + Communication Drafter integrate here)
10. `spec/SESSION-P10-NOTIFICATIONS.md` (Communication Drafter integrates here)
11. This spec

---

## Architecture

**Direct Anthropic API integration.** No SDK. Single-shot prompt → structured response per agent invocation. Pure inference calls, no tool use, no conversation chains, no agent orchestration frameworks.

**Six agents, all on-demand or per-event:**

| Agent | Trigger | Model |
|-------|---------|-------|
| Pattern Analyst | Roni clicks "Analyze outcomes" | claude-sonnet-4-5 |
| Protocol Drafter | Roni clicks "Draft update" with direction | claude-sonnet-4-5 |
| Practice Health Reviewer | Roni clicks "Review practices" | claude-sonnet-4-5 |
| Communication Drafter | Roni clicks "Draft email" with context | claude-sonnet-4-5 |
| Query Assistant | Roni types natural-language question | claude-sonnet-4-5 |
| Lead Enricher | Auto-triggered per new lead/demo submission | claude-haiku-4-5 |

**Observability:** Every run logged to `agent_runs` table with full payload, tokens, cost, status, latency, errors, replay linkage.

**Practitioners see zero AI.** Everything lives in admin.

---

## Goal

After this session:
- Anthropic API client wired into the codebase
- `agent_runs` table tracks every execution with full observability
- Six agent functions in `lib/agents/*.ts`, each callable from admin API routes
- Six admin UI surfaces (button + loading state + result display + replay)
- Lead Enricher auto-runs on new inbox submissions (background, async)
- Pattern Analyst, Protocol Drafter, Practice Health Reviewer surfaced from /admin/dashboard
- Communication Drafter surfaced from /admin/inbox/[type]/[id] detail pages
- Query Assistant surfaced as a dedicated /admin/ai/query page
- Cost dashboard in admin showing token spend over time
- All output reviewable, editable, copyable; nothing auto-applied without admin approval

---

## What Gets Built

### Database
- `agent_runs` table — full run record per execution
- `agent_run_status` enum
- Migration `0014_agent_runs.sql`

### Server-side framework
- `lib/anthropic/client.ts` — Anthropic SDK client (the official `@anthropic-ai/sdk` package, used as a thin wrapper, not the agent SDK)
- `lib/agents/base.ts` — base agent runner (handles logging, cost calc, error capture)
- `lib/agents/pattern-analyst.ts`
- `lib/agents/protocol-drafter.ts`
- `lib/agents/practice-health-reviewer.ts`
- `lib/agents/communication-drafter.ts`
- `lib/agents/query-assistant.ts`
- `lib/agents/lead-enricher.ts`

### Admin UI
- `/admin/dashboard` extensions: "Run analysis" buttons next to relevant chart sections
- `/admin/inbox/[type]/[id]` extensions: "Draft email" + enrichment display
- `/admin/ai/query` — new natural-language query page
- `/admin/ai/runs` — agent run history with filters, cost summary, replay
- `/admin/ai/cost` — token usage + spend dashboard

### Result display components
- `AgentRunResult` — shared component rendering agent output (with markdown support)
- `ReplayButton`
- `CopyToClipboardButton`
- `EditAndSendButton` (where applicable)

---

## Critical Constraints

1. **Build on P1-P10 foundation.** Use `requireAdmin()`, RLS Class C (admin-only), audit log via `logAudit()`.
2. **MASTER.md tokens only.** No new colors, fonts, icons.
3. **Anthropic API key server-only.** Never reaches the client. All agent invocations route through API routes that check `requireAdmin()`.
4. **Every run logged.** No silent invocations. Cost tracking is real, not theoretical.
5. **All outputs human-reviewable.** No agent output auto-applies — Roni reviews and approves before action.
6. **Idempotent Lead Enricher.** Runs once per lead, even if dispatch fires twice (use deterministic check on lead's `enriched_at`).
7. **All migrations held for manual review.**
8. **Mobile-friendly result display.** Roni reviews from her phone often.
9. **Reduced motion respected.** No loading animations beyond a simple spinner.

---

# DATA MODEL

## Migration: `0014_agent_runs.sql`

```sql
create type public.agent_run_status as enum (
  'pending',
  'success',
  'failed',
  'cancelled'
);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  
  -- Agent identification
  agent_type text not null check (agent_type in (
    'pattern_analyst',
    'protocol_drafter',
    'practice_health_reviewer',
    'communication_drafter',
    'query_assistant',
    'lead_enricher'
  )),
  
  -- Trigger context
  triggered_by_user_id uuid references auth.users(id), -- null for auto-triggered (Lead Enricher)
  trigger_type text not null check (trigger_type in ('manual', 'auto')),
  trigger_context jsonb, -- e.g. { "lead_id": "...", "scope": "30d" }
  
  -- Anthropic call details
  model text not null, -- 'claude-sonnet-4-5' | 'claude-haiku-4-5'
  system_prompt text, -- the prompt template used (for replay + debugging)
  user_message text, -- the actual input
  
  -- Response
  raw_output text, -- full Anthropic response content
  parsed_output jsonb, -- if agent returns structured data, the parsed version
  
  -- Tokens + cost
  input_tokens integer,
  output_tokens integer,
  cost_usd numeric(10, 6), -- 6 decimal places (~fractions of a cent)
  
  -- Status
  status public.agent_run_status not null default 'pending',
  error_message text,
  latency_ms integer,
  
  -- Replay linkage
  replay_of_id uuid references public.agent_runs(id),
  
  -- Approval state (for outputs that get acted on)
  approved_at timestamptz,
  approved_by_user_id uuid references auth.users(id),
  applied_action text, -- e.g. "Email sent to lead", "Protocol updated to v1.2"
  applied_at timestamptz
);

create index idx_agent_runs_agent_type on public.agent_runs(agent_type);
create index idx_agent_runs_triggered_by on public.agent_runs(triggered_by_user_id);
create index idx_agent_runs_created_at on public.agent_runs(created_at desc);
create index idx_agent_runs_status on public.agent_runs(status);
create index idx_agent_runs_replay_of on public.agent_runs(replay_of_id);

-- RLS
alter table public.agent_runs enable row level security;

create policy agent_runs_admin_all on public.agent_runs
  for all using (public.is_admin()) with check (public.is_admin());

-- Practices never see this table

-- RPC: cost summary by date range
create or replace function public.agent_cost_summary(
  range_start timestamptz,
  range_end timestamptz
)
returns table(
  agent_type text,
  run_count bigint,
  total_input_tokens bigint,
  total_output_tokens bigint,
  total_cost_usd numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Unauthorized';
  end if;
  
  return query
    select 
      ar.agent_type,
      count(*)::bigint as run_count,
      coalesce(sum(ar.input_tokens), 0)::bigint as total_input_tokens,
      coalesce(sum(ar.output_tokens), 0)::bigint as total_output_tokens,
      coalesce(sum(ar.cost_usd), 0) as total_cost_usd
    from public.agent_runs ar
    where ar.created_at between range_start and range_end
      and ar.status = 'success'
    group by ar.agent_type
    order by total_cost_usd desc;
end;
$$;
```

---

# AGENT FRAMEWORK

## `lib/anthropic/client.ts`

Thin wrapper around `@anthropic-ai/sdk`. Single instance, server-only.

```typescript
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is required");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Pricing per million tokens (May 2026 rates)
export const MODEL_PRICING = {
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
} as const;

export type AnthropicModel = keyof typeof MODEL_PRICING;

export function calculateCost(
  model: AnthropicModel, 
  inputTokens: number, 
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[model];
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}
```

## `lib/agents/base.ts` — Base agent runner

Handles all the cross-cutting concerns: insert agent_runs row, call Anthropic, capture response, calculate cost, update row, return result.

```typescript
import "server-only";
import { anthropic, calculateCost, type AnthropicModel } from "@/lib/anthropic/client";
import { getServiceClient } from "@/lib/supabase/server-auth";

export interface AgentRunInput {
  agentType: string;
  model: AnthropicModel;
  systemPrompt: string;
  userMessage: string;
  triggeredByUserId?: string; // null for auto-triggers
  triggerType: 'manual' | 'auto';
  triggerContext?: Record<string, any>;
  replayOfId?: string;
  maxTokens?: number; // default 4096
  temperature?: number; // default 0.7
}

export interface AgentRunResult {
  runId: string;
  status: 'success' | 'failed';
  output?: string;
  parsedOutput?: any; // if response includes JSON
  cost: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  error?: string;
}

export async function runAgent(input: AgentRunInput): Promise<AgentRunResult> {
  const supabase = getServiceClient();
  
  // 1. Insert pending row
  const { data: runRow, error: insertError } = await supabase
    .from('agent_runs')
    .insert({
      agent_type: input.agentType,
      model: input.model,
      system_prompt: input.systemPrompt,
      user_message: input.userMessage,
      triggered_by_user_id: input.triggeredByUserId || null,
      trigger_type: input.triggerType,
      trigger_context: input.triggerContext || null,
      replay_of_id: input.replayOfId || null,
      status: 'pending',
    })
    .select()
    .single();
  
  if (insertError) throw insertError;
  
  // 2. Call Anthropic with timing
  const startTime = Date.now();
  
  try {
    const response = await anthropic.messages.create({
      model: input.model,
      max_tokens: input.maxTokens || 4096,
      temperature: input.temperature || 0.7,
      system: input.systemPrompt,
      messages: [{ role: 'user', content: input.userMessage }],
    });
    
    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const cost = calculateCost(input.model, inputTokens, outputTokens);
    
    // Extract text content
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => (block as any).text)
      .join('\n');
    
    // Try to parse as JSON if it looks like JSON
    let parsedOutput = null;
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try { parsedOutput = JSON.parse(jsonMatch[1]); } catch {}
    }
    
    // 3. Update with success
    await supabase
      .from('agent_runs')
      .update({
        raw_output: textContent,
        parsed_output: parsedOutput,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        status: 'success',
        latency_ms: latencyMs,
      })
      .eq('id', runRow.id);
    
    return {
      runId: runRow.id,
      status: 'success',
      output: textContent,
      parsedOutput,
      cost,
      inputTokens,
      outputTokens,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    
    // 4. Update with failure
    await supabase
      .from('agent_runs')
      .update({
        status: 'failed',
        error_message: error.message || 'Unknown error',
        latency_ms: latencyMs,
      })
      .eq('id', runRow.id);
    
    return {
      runId: runRow.id,
      status: 'failed',
      cost: 0,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      error: error.message || 'Unknown error',
    };
  }
}

export async function approveAgentRun(runId: string, approverUserId: string, appliedAction?: string): Promise<void>;
export async function getAgentRun(runId: string);
export async function listAgentRuns(filters: {...});
```

---

# THE SIX AGENTS

Each agent has its own file in `lib/agents/`. Each exports a single function that calls `runAgent()` with the right system prompt, model, and input shape.

## 1. Pattern Analyst

**File:** `lib/agents/pattern-analyst.ts`

Triggered when Roni clicks "Analyze outcomes" on the admin dashboard.

**Input:** time range, optional filter (specific protocol, specific Fitzpatrick type)
**Output:** structured analysis with statistically significant patterns, suggested protocol refinements

```typescript
const SYSTEM_PROMPT = `You are a clinical data analyst for Precise Aesthetics, a multi-wavelength pico laser system company. Your role is to analyze aggregated treatment outcome data and surface statistically significant patterns that suggest protocol refinement opportunities.

Voice: clinical, measured, evidence-based. No marketing language. No exclamations. Sentence case throughout.

You will receive:
- A summary of treatment outcomes within a time window
- Patient context distributions (Fitzpatrick types, indications, age ranges)
- Adverse event rates
- Parameter envelope usage data

Return your analysis as a JSON object with this structure:

\`\`\`json
{
  "summary": "1-2 paragraph high-level findings",
  "patterns": [
    {
      "title": "Brief pattern title",
      "description": "What was observed",
      "evidence": "Statistical detail (n, p-value if applicable, effect size)",
      "indication": "Affected indication",
      "fitzpatrick_types": ["IV", "V"],
      "suggested_action": "What to consider changing in the protocol",
      "confidence": "high | medium | low"
    }
  ],
  "concerns": [
    {
      "title": "Brief concern title",
      "description": "What pattern raises a clinical concern",
      "severity": "high | medium | low"
    }
  ],
  "data_gaps": ["Areas where more data would strengthen analysis"]
}
\`\`\`

Be conservative. Only surface patterns with real evidence. If data is insufficient for a meaningful finding, say so in data_gaps. Do not invent statistics.`;

export async function runPatternAnalyst(params: {
  triggeredByUserId: string;
  timeRangeStart: string;
  timeRangeEnd: string;
  filterByProtocol?: string;
  filterByFitzpatrick?: string[];
}): Promise<AgentRunResult>;
```

The function gathers the data via Supabase queries, formats it as a markdown summary in the user message, and runs the agent.

## 2. Protocol Drafter

**File:** `lib/agents/protocol-drafter.ts`

Triggered when Roni clicks "Draft update" with a refinement direction.

**Input:** existing protocol Sanity ID + Roni's direction (free text, e.g., "Tighten fluence range on Fitz V melasma based on last quarter's data")
**Output:** structured draft document she can paste into Sanity Studio

```typescript
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

export async function runProtocolDrafter(params: {
  triggeredByUserId: string;
  protocolSanityId: string;
  direction: string;
  supportingDataSummary?: string;
}): Promise<AgentRunResult>;
```

## 3. Practice Health Reviewer

**File:** `lib/agents/practice-health-reviewer.ts`

Triggered when Roni clicks "Review practices."

**Input:** time window
**Output:** prioritized list of practices needing attention

```typescript
const SYSTEM_PROMPT = `You are a practice health reviewer for Precise Aesthetics. Your role is to identify practices that need administrative attention based on engagement patterns and outcome signals.

Voice: operational, fact-based, action-oriented.

You will receive:
- Engagement data per practice (treatments logged, last activity, certifications)
- Outcome signals (adverse event rate, protocol adherence)
- Pattern flags (sudden volume drop, unusually high or low results)

Return a JSON object:

\`\`\`json
{
  "high_priority": [
    {
      "practice_name": "...",
      "practice_id": "...",
      "concern_summary": "Brief statement of what's notable",
      "signals": ["specific data points"],
      "suggested_outreach": "What kind of message or check-in"
    }
  ],
  "medium_priority": [...],
  "monitoring": [...],
  "exceptional_results": [
    {
      "practice_name": "...",
      "achievement": "What they're doing exceptionally well",
      "consideration": "Worth highlighting / studying / KOL candidate"
    }
  ]
}
\`\`\`

Prioritize ruthlessly. Only flag practices where there's a real signal. Don't fill quotas.`;

export async function runPracticeHealthReviewer(params: {
  triggeredByUserId: string;
  timeRangeDays: number;
}): Promise<AgentRunResult>;
```

## 4. Communication Drafter

**File:** `lib/agents/communication-drafter.ts`

Triggered when Roni or you click "Draft email" from inbox detail or practice detail.

**Input:** target (lead/practice/practitioner), context, purpose ("welcome", "follow up", "address concern", custom direction)
**Output:** drafted email body in brand voice

```typescript
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

export async function runCommunicationDrafter(params: {
  triggeredByUserId: string;
  recipientContext: string;
  purpose: string;
  additionalNotes?: string;
}): Promise<AgentRunResult>;
```

## 5. Query Assistant

**File:** `lib/agents/query-assistant.ts`

Triggered from `/admin/ai/query` natural-language query interface.

**Input:** natural-language question
**Output:** SQL query + explanation + result preview

This is the most architecturally interesting agent — it generates SQL that runs against the Supabase database.

**Two-pass design:**

1. **Pass 1 (LLM):** Translate question → SQL query
2. **Pass 2 (server):** Validate SQL is read-only (SELECT only, no JOIN to auth/storage tables it shouldn't see), execute against Supabase service-role
3. **Pass 3 (LLM):** Take result + original question → human-readable answer

```typescript
const SQL_GENERATION_PROMPT = `You are a SQL query assistant for the Precise Aesthetics admin dashboard. You translate natural-language questions into PostgreSQL SELECT queries.

You have access to these tables (full schema provided in user message):
- treatments (de-identified clinical logs)
- protocols (current published protocols, with versions)
- protocol_versions (immutable snapshots)
- practices (practice accounts)
- practice_devices (which devices each practice owns)
- treatment_adverse_events
- module_progress, training_curricula, training_modules, practice_user_certifications
- leads, demo_requests, contact_messages

Rules:
- SELECT only. No INSERT, UPDATE, DELETE, ALTER, DROP.
- No queries against auth.* or storage.* tables.
- Use CTEs for clarity on complex queries.
- Always include reasonable LIMITs (default 100 if user doesn't specify).
- Aggregate where the question implies aggregation.
- Return ONLY the SQL query, no commentary.

Example:
Question: "What's the PIH adverse event rate for Fitzpatrick V melasma in the last 90 days?"
SQL:
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

const EXPLANATION_PROMPT = `Given a question, the SQL that was run, and the result, write a clear human-readable answer for an admin reviewing clinical data. Be specific. Use numbers from the result. Note any limitations or caveats.`;

export async function runQueryAssistant(params: {
  triggeredByUserId: string;
  question: string;
}): Promise<AgentRunResult & { sql?: string; queryResult?: any[] }>;
```

**SQL safety:**
- Parse the generated SQL; reject if it contains `INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE` (case-insensitive)
- Reject if it references `auth.` or `storage.` schemas
- Wrap execution in `SET TRANSACTION READ ONLY` to enforce
- Cap execution time at 10 seconds

## 6. Lead Enricher

**File:** `lib/agents/lead-enricher.ts`

Auto-triggered per new lead/demo/contact submission. The only auto-running agent.

**Input:** lead/demo/contact record
**Output:** structured enrichment data — practice info inferred from public web, role guesses, peer signals

```typescript
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

export async function runLeadEnricher(params: {
  leadType: 'lead' | 'demo' | 'contact';
  leadId: string;
}): Promise<AgentRunResult>;
```

This agent runs without web search in P11 (just inference from the lead data + email domain analysis). Adding web search is a Q4 polish — Anthropic's web search tool integration adds real cost + complexity.

---

# ADMIN UI

## Dashboard extensions (`/admin/dashboard`)

Add three "Run analysis" buttons:

**Section: Treatment volume over time**
- Below the chart: button "Analyze outcomes for this period"
- Triggers Pattern Analyst with current time range
- Shows result inline below button (collapsible panel)

**Section: Recent treatments timeline**
- Below the list: button "Review practices needing attention"
- Triggers Practice Health Reviewer
- Shows result inline

**Section: Adverse events panel**
- Button: "Analyze adverse event patterns"
- Triggers Pattern Analyst with focus on adverse events

## Inbox extensions (`/admin/inbox/[type]/[id]`)

**Lead/Demo detail pages — Section C (Enrichment):**
- If `enrichment_data` is null (Lead Enricher hasn't run yet or failed): "Run enrichment" button
- If populated: structured display of enriched data + "Re-run enrichment" button (creates replay)

**All inbox detail pages — Action row:**
- "Draft email" button → opens modal with Communication Drafter
- Modal fields:
  - Purpose dropdown: "Welcome / Follow up / Address concern / Custom"
  - Optional notes textarea
  - "Generate" button → calls Communication Drafter
- Result: shows 2 email alternatives, each with subject + body
- Each alternative has: "Use this" button (copies to clipboard with mailto: link) + "Edit and refine" textarea

## Practice detail extensions (`/admin/practices/[id]`)

- Section: "Communication" — "Draft email" button (same Communication Drafter modal)
- Pre-fills recipientContext with practice name + status + recent activity

## New page: `/admin/ai/query`

**Purpose:** Natural-language data queries against the system.

**Layout:**

Page header:
```
Eyebrow: § AI · QUERY ASSISTANT
H1: Ask a question.
Lead: Type a question about treatment data, protocol performance, or practice activity. The assistant will translate it to SQL, run it, and explain the answer.
```

**Input:**
- Large textarea: "What would you like to know?"
- Examples in placeholder: "What's the PIH rate trend for Fitz V melasma over the last 90 days?" / "Which protocols have the highest adverse event rates?" / "How many treatments were logged each month this year?"
- "Ask" button below

**Result display:**
- Question (echoed back)
- Generated SQL (collapsible code block, syntax-highlighted)
- Result table (rendered from query result)
- Human-readable answer (markdown-rendered)
- Cost: "$0.04 · 2.1s"
- "Replay this query" button (re-runs same question, links as replay_of)
- "Save to favorites" button (P12 polish or skip)

## New page: `/admin/ai/runs`

**Purpose:** Agent run history with filters, replay, audit.

**Layout:**

Page header:
```
Eyebrow: § AI · RUN HISTORY
H1: Agent runs.
Lead: Every AI agent execution is logged here.
```

Filter bar:
- Agent type multi-select
- Status filter (success / failed / pending)
- Triggered by user
- Date range
- Search (in user_message + raw_output)

Table:
- Time
- Agent type (chip with icon)
- Triggered by (user or "auto")
- Status chip
- Cost
- Latency
- Click row → detail view with full input + output

Detail view:
- Full agent run record
- "Replay" button → re-runs with same input
- "Approve and apply" if applicable (mostly for Protocol Drafter outputs)

## New page: `/admin/ai/cost`

**Purpose:** Cost dashboard.

**Layout:**

KPI cards at top:
- Total cost this month
- Total tokens this month
- Total runs this month
- Avg cost per run

Charts:
- Line chart: cost over time (daily for 30d, weekly for 90d/12m, monthly for all-time)
- Stacked bar: cost by agent type
- Table: top 10 most expensive runs (drill-down to detail)

Time range selector at top (matches dashboard pattern).

---

# ADMIN SIDEBAR UPDATE

`AdminSidebar.tsx` NAV_ITEMS — add an "AI" section. Could be:

**Option A — Top-level entries:**
```
Dashboard / Practices / Inbox / Adverse Events / Protocols / Training / AI Query / AI Runs
```

**Option B — Grouped section:**
```
Dashboard / Practices / Inbox / Adverse Events / Protocols / Training / 
─── AI ───
Query / Runs / Cost
```

Recommend Option B with a small section divider. Cleaner as nav grows. Use the existing AdminSidebar `NAV_ITEMS` structure — add a `section` field to support grouping.

---

# COMPONENTS

```
components/admin/ai/
├── RunAnalysisButton.tsx           (triggers an agent, shows loading + result inline)
├── AgentRunResult.tsx              (renders agent output with markdown support)
├── AgentRunDetailView.tsx          (full run page)
├── ReplayButton.tsx
├── CopyToClipboardButton.tsx
├── DraftEmailModal.tsx             (Communication Drafter wrapper)
├── EnrichmentSection.tsx           (replaces P8 placeholder, now fully wired)
├── QueryAssistantInterface.tsx     (the /admin/ai/query main UI)
├── RunsTable.tsx
├── RunsFilterBar.tsx
├── CostKpiRow.tsx
├── CostByAgentChart.tsx
└── CostOverTimeChart.tsx
```

---

# API ROUTES

All under `/api/admin/ai/*`, all require `requireAdmin()`:

- `POST /api/admin/ai/pattern-analyst`
- `POST /api/admin/ai/protocol-drafter`
- `POST /api/admin/ai/practice-health-reviewer`
- `POST /api/admin/ai/communication-drafter`
- `POST /api/admin/ai/query-assistant` (also handles SQL execution server-side)
- `POST /api/admin/ai/lead-enricher` (manual re-trigger; auto-trigger lives in lead/demo/contact creation routes)
- `GET /api/admin/ai/runs` — list with filters
- `GET /api/admin/ai/runs/[id]` — detail
- `POST /api/admin/ai/runs/[id]/replay` — replay a previous run
- `POST /api/admin/ai/runs/[id]/approve` — mark approved (records approval, optional applied_action)
- `GET /api/admin/ai/cost-summary` — for cost dashboard

Auto-trigger for Lead Enricher: extend the existing lead/demo/contact creation routes to fire-and-forget call to `runLeadEnricher()`. Don't block the form submission on it.

---

# ENVIRONMENT VARIABLES

New required env vars:

```
ANTHROPIC_API_KEY=<anthropic key>
```

Document in `.env.example` and `CLAUDE.md`. Set on Vercel for production.

---

# VERIFICATION

Before declaring done:

1. `npm run build` clean
2. `npx tsc --noEmit` clean
3. `npm run lint` clean
4. Migration written, NOT applied
5. Manual test sequence (after migration applied + ANTHROPIC_API_KEY set):
   - Sign in as admin
   - Visit `/admin/dashboard` → click "Analyze outcomes" → Pattern Analyst runs, result displays inline
   - Verify agent_runs row created with model, tokens, cost, latency
   - Click "Replay" → new run with replay_of_id linked
   - Visit `/admin/ai/query` → ask "How many treatments were logged in the last 30 days?" → SQL generated, executed, answer displayed
   - Test SQL safety: ask question that would generate UPDATE → server rejects
   - Ask question with no data → graceful empty result
   - Visit `/admin/inbox/lead/[id]` → Lead Enricher result displayed (or "Run enrichment" button)
   - Click "Draft email" on demo request → Communication Drafter modal → 2 alternatives generated
   - Visit `/admin/ai/runs` → see all runs above
   - Visit `/admin/ai/cost` → see cost breakdown
6. Cost verification:
   - Total spend across all test runs visible in /admin/ai/cost
   - Per-agent costs match expected ranges from the spec
7. Auto-trigger verification:
   - Submit a /demo form on the marketing site
   - Verify Lead Enricher auto-runs (agent_runs row appears with trigger_type='auto')
   - Verify it doesn't double-run on duplicate webhook delivery
8. Failure mode verification:
   - Set ANTHROPIC_API_KEY to invalid value → trigger an agent → run row inserted with status='failed', error_message captured
9. Mobile/iPad readability:
   - Run analysis result panels readable
   - Modal forms usable
   - Cost charts responsive

---

# PRE-DELIVERY CHECKLIST

- [ ] Tokens-only, no new colors/fonts/icons
- [ ] All migrations held for manual review
- [ ] ANTHROPIC_API_KEY server-only, never reaches client
- [ ] Every agent run logged to agent_runs (no silent invocations)
- [ ] SQL safety in Query Assistant (read-only enforcement)
- [ ] Cost calculation accurate per model
- [ ] Lead Enricher idempotent (won't double-run)
- [ ] All outputs human-reviewable (no auto-apply)
- [ ] Markdown rendering in result display
- [ ] Mobile-friendly result panels
- [ ] All copy [DRAFT]-marked

---

# DELIVERABLES

When done, report:
1. Production preview URLs (key admin AI surfaces)
2. Lighthouse scores
3. Migration SQL location (held)
4. Components built
5. Drafted copy flagged for approval
6. Test results per agent (one successful run + cost verified for each of 6 agents)
7. SQL safety verification (Query Assistant rejects writes)
8. Auto-trigger verification (Lead Enricher fires on form submission)
9. Failure mode verification (failed runs logged correctly)
10. Total cost of test runs (so we know the per-test spend)
11. Decisions made not explicit in spec
12. Anything to verify before P12

After P11 is approved + migration applied + manual tests pass, P12 is the final session: QA + security review + accessibility pass + final deploy.
