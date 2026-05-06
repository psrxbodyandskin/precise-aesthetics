import "server-only";
import { runAgent, type AgentRunResult } from "./base";
import { getServiceClient } from "@/lib/supabase/server";

// P11 — Practice Health Reviewer.
// Identifies practices needing administrative attention based
// on engagement + outcome signals over a time window.

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

export interface PracticeHealthParams {
  triggeredByUserId: string;
  timeRangeDays: number;
}

export async function runPracticeHealthReviewer(
  params: PracticeHealthParams,
): Promise<AgentRunResult> {
  const userMessage = await buildPracticeHealthSummary(params.timeRangeDays);
  return runAgent({
    agentType: "practice_health_reviewer",
    model: "claude-sonnet-4-5",
    systemPrompt: SYSTEM_PROMPT,
    userMessage,
    triggeredByUserId: params.triggeredByUserId,
    triggerType: "manual",
    triggerContext: { time_range_days: params.timeRangeDays },
    maxTokens: 4096,
    temperature: 0.4,
  });
}

async function buildPracticeHealthSummary(days: number): Promise<string> {
  const supabase = getServiceClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // All active practices with their treatment counts + last activity
  const { data: practices } = await supabase
    .from("practices")
    .select("id, name, status, city, state")
    .eq("status", "active");

  const lines: string[] = [
    `# Practice health review`,
    ``,
    `**Window:** Last ${days} days (since ${since}).`,
    `**Active practices:** ${practices?.length ?? 0}`,
    ``,
    `## Per-practice signals`,
  ];

  for (const p of practices ?? []) {
    const { count: txCount } = await supabase
      .from("treatments")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", p.id)
      .gte("treatment_date", since);

    const { count: aeCount } = await supabase
      .from("treatment_adverse_events")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", p.id)
      .gte("created_at", since);

    const { data: lastTreatment } = await supabase
      .from("treatments")
      .select("treatment_date")
      .eq("practice_id", p.id)
      .order("treatment_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: certCount } = await supabase
      .from("practice_certifications")
      .select("id", { count: "exact", head: true })
      .eq("practice_id", p.id)
      .eq("status", "certified");

    lines.push(
      ``,
      `### ${p.name} (${p.city ?? "?"}, ${p.state ?? "?"})`,
      `- Practice id: ${p.id}`,
      `- Treatments in window: ${txCount ?? 0}`,
      `- Adverse events in window: ${aeCount ?? 0}`,
      `- Active certifications: ${certCount ?? 0}`,
      `- Last treatment date: ${lastTreatment?.treatment_date ?? "(none)"}`,
    );
  }

  return lines.join("\n");
}
