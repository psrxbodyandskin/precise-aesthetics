import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { getServiceClient } from "@/lib/supabase/server";

// P11 — Pattern Analyst.
// Triggered when Roni clicks "Analyze outcomes" on the admin
// dashboard. Pulls aggregated treatment data via SQL summaries
// and asks Claude to surface statistically meaningful patterns.

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

export interface PatternAnalystParams {
  triggeredByUserId: string;
  timeRangeStart: string; // ISO
  timeRangeEnd: string;
  filterByProtocol?: string | null;
  filterByFitzpatrick?: string[] | null;
  /** Set to true when triggered from /admin/dashboard adverse events panel
   *  to focus the analysis on adverse-event signals. */
  focusOnAdverseEvents?: boolean;
}

export async function runPatternAnalyst(
  params: PatternAnalystParams,
): Promise<AgentRunResult> {
  const userMessage = await buildPatternUserMessage(params);
  return runAgent({
    agentType: "pattern_analyst",
    model: "claude-sonnet-4-5",
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: {
      time_range_start: params.timeRangeStart,
      time_range_end: params.timeRangeEnd,
      filter_by_protocol: params.filterByProtocol ?? null,
      filter_by_fitzpatrick: params.filterByFitzpatrick ?? null,
      focus_on_adverse_events: Boolean(params.focusOnAdverseEvents),
    },
    maxTokens: 4096,
    temperature: 0.4,
  });
}

// ------------------------------------------------------------
// Data gathering — formats Supabase query results as a markdown
// summary for the user message. Conservative: only surfaces
// counts and rates, not raw rows. Keeps user_message size
// reasonable + prevents leaking PHI (which the schema doesn't
// store anyway, but defense-in-depth).
// ------------------------------------------------------------
async function buildPatternUserMessage(
  params: PatternAnalystParams,
): Promise<string> {
  const supabase = getServiceClient();

  let baseQuery = supabase
    .from("treatments")
    .select("id, indication, patient_fitzpatrick, patient_age_range, protocol_id", {
      count: "exact",
      head: false,
    })
    .gte("treatment_date", params.timeRangeStart)
    .lte("treatment_date", params.timeRangeEnd);
  if (params.filterByProtocol) {
    baseQuery = baseQuery.eq("protocol_id", params.filterByProtocol);
  }
  if (params.filterByFitzpatrick && params.filterByFitzpatrick.length > 0) {
    baseQuery = baseQuery.in(
      "patient_fitzpatrick",
      params.filterByFitzpatrick as Array<"I" | "II" | "III" | "IV" | "V" | "VI">,
    );
  }
  const { data: treatments, count: totalCount } = await baseQuery;

  // Per-indication counts
  const byIndication = new Map<string, number>();
  const byFitz = new Map<string, number>();
  for (const t of treatments ?? []) {
    byIndication.set(t.indication, (byIndication.get(t.indication) ?? 0) + 1);
    byFitz.set(t.patient_fitzpatrick, (byFitz.get(t.patient_fitzpatrick) ?? 0) + 1);
  }

  // Adverse events in same window
  const treatmentIds = (treatments ?? []).map((t) => t.id);
  let adverseCount = 0;
  if (treatmentIds.length > 0) {
    const { count: aeCount } = await supabase
      .from("treatment_adverse_events")
      .select("id", { count: "exact", head: true })
      .in("treatment_id", treatmentIds);
    adverseCount = aeCount ?? 0;
  }

  const total = totalCount ?? 0;
  const aeRate = total > 0 ? ((adverseCount / total) * 100).toFixed(2) : "0.00";

  // Markdown summary
  const lines: string[] = [
    `# Treatment outcomes summary`,
    ``,
    `**Time window:** ${params.timeRangeStart} → ${params.timeRangeEnd}`,
    `**Total treatments logged:** ${total}`,
    `**Adverse events flagged:** ${adverseCount} (${aeRate}%)`,
    ``,
    `## Distribution by indication`,
    ...Array.from(byIndication.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([ind, count]) => `- ${ind}: ${count}`),
    ``,
    `## Distribution by Fitzpatrick type`,
    ...Array.from(byFitz.entries())
      .sort()
      .map(([fitz, count]) => `- Type ${fitz}: ${count}`),
  ];

  if (params.focusOnAdverseEvents) {
    lines.push(
      ``,
      `## Focus`,
      `Roni is investigating adverse-event patterns specifically. Surface clusters by indication, Fitzpatrick type, protocol version, or parameter envelope.`,
    );
  }

  if (params.filterByProtocol) {
    lines.push(``, `## Filter`, `Scoped to protocol_id = ${params.filterByProtocol}.`);
  }
  if (params.filterByFitzpatrick && params.filterByFitzpatrick.length > 0) {
    lines.push(
      ``,
      `## Filter`,
      `Scoped to Fitzpatrick types: ${params.filterByFitzpatrick.join(", ")}.`,
    );
  }

  return lines.join("\n");
}
