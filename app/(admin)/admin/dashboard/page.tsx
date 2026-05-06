import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import {
  getDashboardData,
  type DashboardRange,
} from "@/lib/admin/dashboard";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { TimeRangeSelector } from "@/components/admin/dashboard/TimeRangeSelector";
import { KpiCardRow } from "@/components/admin/dashboard/KpiCardRow";
import { ChartFrame } from "@/components/admin/dashboard/ChartFrame";
import { VolumeTimeSeriesChart } from "@/components/admin/dashboard/VolumeTimeSeriesChart";
import { ProtocolStatsTable } from "@/components/admin/dashboard/ProtocolStatsTable";
import { ProtocolCoverageChart } from "@/components/admin/dashboard/ProtocolCoverageChart";
import { IndicationDistributionChart } from "@/components/admin/dashboard/IndicationDistributionChart";
import { FitzpatrickDistributionChart } from "@/components/admin/dashboard/FitzpatrickDistributionChart";
import { AdverseEventsPanel } from "@/components/admin/dashboard/AdverseEventsPanel";
import { RecentTreatmentsList } from "@/components/admin/dashboard/RecentTreatmentsList";
import { RunAnalysisButton } from "@/components/admin/ai/RunAnalysisButton";

export const metadata: Metadata = {
  title: "Dashboard — Admin",
  robots: { index: false, follow: false },
};

const VALID_RANGES: DashboardRange[] = ["7d", "30d", "90d", "12m", "all"];

// Map dashboard range pills to the day-count input that
// Practice Health Reviewer expects (capped at 365 by the schema).
function rangeToDays(range: DashboardRange): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "12m":
    case "all":
    default:
      return 365;
  }
}

interface DashboardPageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminDashboardPage({
  searchParams,
}: DashboardPageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const range: DashboardRange = VALID_RANGES.includes(sp.range as DashboardRange)
    ? (sp.range as DashboardRange)
    : "30d";

  const data = await getDashboardData(range);
  const noData = data.topLine.total_treatments === 0;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Dashboard" }]} />

      <AdminPageHeader
        eyebrow="Admin"
        title="Dashboard."
        lead="Aggregated treatment data across the network. Patterns surface here for clinical review."
        actions={<TimeRangeSelector current={range} />}
      />

      <div className="mt-12 space-y-6">
        {/* 1. Top-line KPIs */}
        <KpiCardRow
          topLine={data.topLine}
          showComparison={data.window.showComparison}
        />

        {/* 2. Volume over time */}
        <ChartFrame
          title="Treatment volume over time"
          subtitle={
            data.window.bucket === "day"
              ? "Daily counts"
              : data.window.bucket === "week"
                ? "Weekly counts"
                : "Monthly counts"
          }
          empty={noData || data.volumeTimeseries.length === 0}
        >
          <VolumeTimeSeriesChart
            data={data.volumeTimeseries}
            bucket={data.window.bucket}
          />
        </ChartFrame>

        {/* P11 — pattern analyst on the treatment volume window */}
        {!noData && (
          <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6">
            <RunAnalysisButton
              endpoint="/api/admin/ai/pattern-analyst"
              body={{
                timeRangeStart: data.window.rangeStart,
                timeRangeEnd: data.window.rangeEnd,
                focusOnAdverseEvents: false,
              }}
              label="Analyze patterns in this period"
              resultHeading="Pattern analysis"
            />
          </div>
        )}

        {/* 3. Protocol performance — table + coverage chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartFrame
            title="Most-used protocols"
            subtitle="Top 10 by treatment count, with adverse event rate"
            empty={data.protocolStats.length === 0}
          >
            <ProtocolStatsTable rows={data.protocolStats} />
          </ChartFrame>

          <ChartFrame
            title="Protocol coverage"
            subtitle="Skin-type distribution across the top 10 protocols"
            empty={data.protocolCoverage.length === 0}
          >
            <ProtocolCoverageChart rows={data.protocolCoverage} />
          </ChartFrame>
        </div>

        {/* 4. Indication distribution */}
        <ChartFrame
          title="Indication distribution"
          subtitle="Top 8 indications + the rest grouped as 'Other'"
          empty={data.indicationDistribution.length === 0}
        >
          <IndicationDistributionChart slices={data.indicationDistribution} />
        </ChartFrame>

        {/* 5. Fitzpatrick distribution */}
        <ChartFrame
          title="Fitzpatrick distribution"
          subtitle="Treatment counts across the skin-type spectrum"
          empty={noData}
        >
          <FitzpatrickDistributionChart bars={data.fitzpatrickDistribution} />
        </ChartFrame>

        {/* 6. Adverse events panel */}
        <AdverseEventsPanel summary={data.adverseEvents} />

        {/* P11 — pattern analyst with adverse-event focus */}
        {data.adverseEvents.total > 0 && (
          <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6">
            <RunAnalysisButton
              endpoint="/api/admin/ai/pattern-analyst"
              body={{
                timeRangeStart: data.window.rangeStart,
                timeRangeEnd: data.window.rangeEnd,
                focusOnAdverseEvents: true,
              }}
              label="Analyze adverse-event patterns"
              resultHeading="Adverse event analysis"
            />
          </div>
        )}

        {/* 7. Recent treatments timeline */}
        <RecentTreatmentsList treatments={data.recentTreatments} />

        {/* P11 — practice health reviewer (per spec section "Recent treatments timeline") */}
        <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6">
          <RunAnalysisButton
            endpoint="/api/admin/ai/practice-health-reviewer"
            body={{
              timeRangeDays: rangeToDays(range),
            }}
            label="Review practices needing attention"
            resultHeading="Practice health review"
          />
        </div>
      </div>
    </div>
  );
}
