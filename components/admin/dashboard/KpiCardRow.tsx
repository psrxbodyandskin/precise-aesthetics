import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import {
  compareCounts,
  type DashboardData,
  type TopLineMetrics,
} from "@/lib/admin/dashboard";
import { cn } from "@/lib/utils";

interface KpiCardRowProps {
  topLine: TopLineMetrics;
  showComparison: boolean;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function KpiCardRow({ topLine, showComparison }: KpiCardRowProps) {
  const treatmentsCmp = compareCounts(
    topLine.total_treatments,
    topLine.total_treatments_prior,
    showComparison,
  );
  const adverseCmp = compareCounts(
    topLine.adverse_events,
    topLine.adverse_events_prior,
    showComparison,
  );
  const photosCmp = compareCounts(
    topLine.photos_uploaded,
    topLine.photos_uploaded_prior,
    showComparison,
  );

  const adverseRatePct =
    topLine.total_treatments > 0
      ? (topLine.adverse_events / topLine.total_treatments) * 100
      : 0;
  const adverseRateColor =
    adverseRatePct <= 2
      ? "text-ink-900"
      : adverseRatePct <= 5
        ? "text-brand-700"
        : "text-[#8A2C2C]";

  const photosWithRate =
    topLine.total_treatments > 0
      ? Math.round((topLine.photos_uploaded / topLine.total_treatments) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        eyebrow="Total treatments"
        bigNumber={topLine.total_treatments.toLocaleString()}
        comparison={treatmentsCmp}
      />
      <KpiCard
        eyebrow="Active practices"
        bigNumber={topLine.active_practices.toLocaleString()}
        subline={`of ${topLine.total_practices.toLocaleString()} on the system`}
      />
      <KpiCard
        eyebrow="Adverse event rate"
        bigNumber={`${adverseRatePct.toFixed(1)}%`}
        bigNumberClassName={adverseRateColor}
        subline={`${topLine.adverse_events.toLocaleString()} event${topLine.adverse_events === 1 ? "" : "s"}`}
        comparison={adverseCmp}
      />
      <KpiCard
        eyebrow="Photos uploaded"
        bigNumber={topLine.photos_uploaded.toLocaleString()}
        subline={
          topLine.total_treatments > 0
            ? `${photosWithRate}% of treatments`
            : "no treatments yet"
        }
        comparison={photosCmp}
      />
    </div>
  );
}

interface KpiCardProps {
  eyebrow: string;
  bigNumber: string;
  bigNumberClassName?: string;
  subline?: string;
  comparison?: ReturnType<typeof compareCounts>;
}

function KpiCard({
  eyebrow,
  bigNumber,
  bigNumberClassName,
  subline,
  comparison,
}: KpiCardProps) {
  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {eyebrow}
      </p>
      <p
        className={cn(
          "mt-3 font-display text-ink-900",
          bigNumberClassName,
        )}
        style={{
          fontSize: "clamp(2rem, 2.5vw + 1rem, 2.75rem)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 400,
        }}
      >
        {bigNumber}
      </p>
      {subline && (
        <p
          className="mt-2 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.5 }}
        >
          {subline}
        </p>
      )}
      {comparison && (comparison.delta || comparison.fallback) && (
        <p
          className="mt-3 inline-flex items-center gap-1.5 font-body text-caption text-ink-700"
          style={{ lineHeight: 1.5 }}
        >
          {comparison.delta && (
            <>
              <TrendArrow direction={comparison.direction} />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {comparison.delta}
              </span>
              <span className="text-ink-500">vs prior period</span>
            </>
          )}
          {!comparison.delta && comparison.fallback && (
            <span className="text-ink-500">{comparison.fallback}</span>
          )}
        </p>
      )}
    </div>
  );
}

function TrendArrow({
  direction,
}: {
  direction: "up" | "down" | "neutral";
}) {
  if (direction === "up")
    return (
      <ArrowUp
        className="size-3 text-[#1F5A37]"
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  if (direction === "down")
    return (
      <ArrowDown
        className="size-3 text-[#8A2C2C]"
        strokeWidth={2}
        aria-hidden="true"
      />
    );
  return (
    <ArrowRight
      className="size-3 text-ink-500"
      strokeWidth={2}
      aria-hidden="true"
    />
  );
}

export type { DashboardData };
