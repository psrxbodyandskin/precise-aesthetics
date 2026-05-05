import Link from "next/link";
import { Layers } from "lucide-react";

import { TrainingStatusChip } from "./TrainingStatusChip";
import type {
  TrainingCurriculumRow,
} from "@/lib/admin/training";

interface CurriculumCardProps {
  curriculum: TrainingCurriculumRow & {
    device: { id: string; display_name: string; slug: string } | null;
  };
  moduleCount: number;
  totalDurationSeconds: number;
  certStats: {
    certified: number;
    in_progress: number;
    not_started: number;
  };
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function CurriculumCard({
  curriculum,
  moduleCount,
  totalDurationSeconds,
  certStats,
}: CurriculumCardProps) {
  return (
    <Link
      href={`/admin/training/curricula/${curriculum.id}`}
      className="block rounded-md border border-ink-700/15 bg-bone-50 p-6 transition-colors duration-[150ms] hover:border-ink-700/35 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers
            className="size-5 text-ink-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {curriculum.device?.display_name ?? "Device"}
          </p>
        </div>
        <TrainingStatusChip status={curriculum.status} />
      </div>

      <h3
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "1.25rem",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        {curriculum.title}
      </h3>
      {curriculum.description && (
        <p
          className="mt-2 font-body text-small text-ink-700 line-clamp-2"
          style={{ lineHeight: 1.55 }}
        >
          {curriculum.description}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-3 text-caption">
        <div>
          <dt
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Modules
          </dt>
          <dd
            className="mt-1 font-body text-ink-900"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {moduleCount}
          </dd>
        </div>
        <div>
          <dt
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Duration
          </dt>
          <dd
            className="mt-1 font-body text-ink-900"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatDuration(totalDurationSeconds)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-700/10 pt-4 text-caption">
        <CertChip label="Certified" count={certStats.certified} tone="brand" />
        <CertChip label="In progress" count={certStats.in_progress} tone="ink" />
        <CertChip label="Not started" count={certStats.not_started} tone="muted" />
      </div>
    </Link>
  );
}

function CertChip({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "brand" | "ink" | "muted";
}) {
  const toneClass =
    tone === "brand"
      ? "text-brand-700"
      : tone === "ink"
        ? "text-ink-900"
        : "text-ink-500";
  return (
    <span className="inline-flex items-center gap-1.5 font-body">
      <span
        className={`font-medium ${toneClass}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count}
      </span>
      <span className="text-ink-500">{label}</span>
    </span>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return `${seconds}s`;
}
