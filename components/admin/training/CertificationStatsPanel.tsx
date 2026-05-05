import type { CurriculumCertStats } from "@/lib/admin/training";

interface CertificationStatsPanelProps {
  stats: CurriculumCertStats;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function CertificationStatsPanel({
  stats,
}: CertificationStatsPanelProps) {
  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Certification stats
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Certified" value={stats.certified} tone="brand" />
        <Stat label="In progress" value={stats.in_progress} tone="ink" />
        <Stat label="Not started" value={stats.not_started} tone="muted" />
        <Stat
          label="Total practices"
          value={stats.total_practices_with_device}
          tone="muted"
        />
      </dl>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "ink" | "muted";
}) {
  const toneClass =
    tone === "brand"
      ? "text-brand-700"
      : tone === "ink"
        ? "text-ink-900"
        : "text-ink-500";
  return (
    <div>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </dt>
      <dd
        className={`mt-1 font-display text-2xl ${toneClass}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </dd>
    </div>
  );
}
