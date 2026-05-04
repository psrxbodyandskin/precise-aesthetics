import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

// P7 — Admin dashboard data layer.
//
// All reads go through the SECURITY DEFINER RPCs in
// supabase/migrations/0009_dashboard_rpcs.sql. Each RPC re-checks
// is_admin() before bypassing RLS to compute cross-practice
// aggregates. The service-role client lets us reach the function
// without an admin session token; the function itself is the gate.
// Application-layer callers (route handlers / server components)
// must still go through requireAdmin() — the RPC gate is defense
// in depth, not the only check.

export type DashboardRange = "7d" | "30d" | "90d" | "12m" | "all";

export interface DashboardRangeWindow {
  rangeStart: string; // ISO timestamp
  rangeEnd: string;
  comparisonStart: string;
  bucket: "day" | "week" | "month";
  /** Whether to surface the prior-period comparison sub-line. */
  showComparison: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeRangeWindow(range: DashboardRange): DashboardRangeWindow {
  const now = new Date();
  const rangeEnd = now;

  let rangeStart: Date;
  let bucket: DashboardRangeWindow["bucket"];
  let showComparison = true;

  switch (range) {
    case "7d":
      rangeStart = new Date(now.getTime() - 7 * DAY_MS);
      bucket = "day";
      break;
    case "30d":
      rangeStart = new Date(now.getTime() - 30 * DAY_MS);
      bucket = "day";
      break;
    case "90d":
      rangeStart = new Date(now.getTime() - 90 * DAY_MS);
      bucket = "week";
      break;
    case "12m":
      rangeStart = new Date(now.getTime() - 365 * DAY_MS);
      bucket = "month";
      break;
    case "all":
    default:
      // Use a very early date so the SQL >= clause includes every row.
      rangeStart = new Date("2000-01-01T00:00:00Z");
      bucket = "month";
      showComparison = false;
      break;
  }

  // Comparison period of equal length immediately preceding the range.
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const comparisonStart = new Date(rangeStart.getTime() - rangeMs);

  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    comparisonStart: comparisonStart.toISOString(),
    bucket,
    showComparison,
  };
}

// ------------------------------------------------------------
// Top-level orchestrator — fires all 8 RPCs in parallel, returns
// shaped JSON for the dashboard page to consume.
// ------------------------------------------------------------

export interface DashboardData {
  range: DashboardRange;
  window: DashboardRangeWindow;
  topLine: TopLineMetrics;
  volumeTimeseries: VolumeBucket[];
  protocolStats: ProtocolStatRow[];
  protocolCoverage: ProtocolCoverageRow[];
  indicationDistribution: IndicationSlice[];
  fitzpatrickDistribution: FitzpatrickBar[];
  adverseEvents: AdverseEventsSummary;
  recentTreatments: RecentTreatment[];
}

export interface TopLineMetrics {
  total_treatments: number;
  total_treatments_prior: number;
  active_practices: number;
  total_practices: number;
  adverse_events: number;
  adverse_events_prior: number;
  photos_uploaded: number;
  photos_uploaded_prior: number;
}

export interface VolumeBucket {
  bucket: string; // ISO timestamp at the start of the bucket
  count: number;
}

export interface ProtocolStatRow {
  protocol_id: string;
  title: string;
  slug: string;
  current_version: string;
  treatment_count: number;
  adverse_event_count: number;
  last_used_date: string | null;
  common_fitzpatrick: string | null;
}

export interface ProtocolCoverageRow {
  protocol_id: string;
  title: string;
  treatment_count: number;
  by_fitzpatrick: Record<string, number>;
}

export interface IndicationSlice {
  indication: string;
  n: number;
}

export interface FitzpatrickBar {
  fitzpatrick: string;
  count: number;
}

export interface AdverseEventsSummary {
  total: number;
  by_status: Partial<Record<"new" | "reviewing" | "addressed", number>>;
  recent: Array<{
    id: string;
    created_at: string;
    status: "new" | "reviewing" | "addressed";
    practice_id: string;
    indication: string;
    patient_fitzpatrick: string;
    treatment_date: string;
  }>;
}

export interface RecentTreatment {
  id: string;
  created_at: string;
  treatment_date: string;
  indication: string;
  patient_fitzpatrick: string;
  protocol_version_label: string;
  practice_id: string;
  protocol_title: string | null;
  protocol_slug: string | null;
  photo_count: number;
  has_adverse_event: boolean;
}

export async function getDashboardData(
  range: DashboardRange,
): Promise<DashboardData> {
  const window = computeRangeWindow(range);
  const supabase = getServiceClient();

  const [
    topLineRes,
    volumeRes,
    protocolStatsRes,
    protocolCoverageRes,
    indicationRes,
    fitzpatrickRes,
    adverseRes,
    recentRes,
  ] = await Promise.all([
    supabase.rpc("dashboard_top_line", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
      comparison_start: window.comparisonStart,
    }),
    supabase.rpc("dashboard_volume_timeseries", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
      bucket: window.bucket,
    }),
    supabase.rpc("dashboard_protocol_stats", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
    }),
    supabase.rpc("dashboard_protocol_coverage", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
    }),
    supabase.rpc("dashboard_indication_distribution", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
    }),
    supabase.rpc("dashboard_fitzpatrick_distribution", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
    }),
    supabase.rpc("dashboard_adverse_events_summary", {
      range_start: window.rangeStart,
      range_end: window.rangeEnd,
    }),
    supabase.rpc("dashboard_recent_treatments", {
      limit_count: 20,
    }),
  ]);

  // Tolerate failures per-section so a single bad RPC doesn't take
  // down the whole dashboard. Each section falls back to its empty
  // shape so charts render the empty state gracefully (callout A).
  const topLine = (topLineRes.data as TopLineMetrics | null) ?? {
    total_treatments: 0,
    total_treatments_prior: 0,
    active_practices: 0,
    total_practices: 0,
    adverse_events: 0,
    adverse_events_prior: 0,
    photos_uploaded: 0,
    photos_uploaded_prior: 0,
  };

  if (topLineRes.error) {
    console.error("[dashboard] top_line error", topLineRes.error);
  }

  return {
    range,
    window,
    topLine,
    volumeTimeseries: (volumeRes.data as VolumeBucket[] | null) ?? [],
    protocolStats: (protocolStatsRes.data as ProtocolStatRow[] | null) ?? [],
    protocolCoverage:
      (protocolCoverageRes.data as ProtocolCoverageRow[] | null) ?? [],
    indicationDistribution:
      (indicationRes.data as IndicationSlice[] | null) ?? [],
    fitzpatrickDistribution:
      (fitzpatrickRes.data as FitzpatrickBar[] | null) ?? [],
    adverseEvents:
      (adverseRes.data as AdverseEventsSummary | null) ?? {
        total: 0,
        by_status: {},
        recent: [],
      },
    recentTreatments: (recentRes.data as RecentTreatment[] | null) ?? [],
  };
}

// ------------------------------------------------------------
// Comparison helpers (callout B — handle prior=0 gracefully)
// ------------------------------------------------------------

export interface ComparisonResult {
  /** Display string: e.g. "+18%", "−4%", or null if not comparable. */
  delta: string | null;
  /** "up" | "down" | "neutral" — drives the trend arrow. */
  direction: "up" | "down" | "neutral";
  /** Fallback copy when comparison can't be computed (prior period was 0). */
  fallback: string | null;
}

export function compareCounts(
  current: number,
  prior: number,
  showComparison: boolean,
): ComparisonResult {
  if (!showComparison) {
    return { delta: null, direction: "neutral", fallback: null };
  }
  if (prior === 0) {
    if (current === 0) {
      return {
        delta: null,
        direction: "neutral",
        fallback: "Baseline period — comparison available next month",
      };
    }
    // Current > 0 but prior == 0: a real signal but math returns infinity.
    // Show explicit copy instead of percentage.
    return {
      delta: null,
      direction: "up",
      fallback: "First treatments logged in this period",
    };
  }
  const ratio = (current - prior) / prior;
  const pct = Math.round(ratio * 100);
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  const direction = pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  return {
    delta: `${sign}${Math.abs(pct)}%`,
    direction,
    fallback: null,
  };
}
