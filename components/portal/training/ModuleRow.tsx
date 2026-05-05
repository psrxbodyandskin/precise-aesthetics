import Link from "next/link";
import { Check, Circle, Play } from "lucide-react";

import type {
  ModuleProgressRow,
  TrainingModuleRow,
} from "@/lib/portal/training";
import { cn } from "@/lib/utils";

interface ModuleRowProps {
  index: number;
  module: TrainingModuleRow;
  progress: ModuleProgressRow | null;
  isRequired: boolean;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModuleRow({
  index,
  module,
  progress,
  isRequired,
}: ModuleRowProps) {
  const isComplete = Boolean(progress?.is_complete);
  const watchPercent = progress?.watch_percentage ?? 0;
  const inProgress = !isComplete && watchPercent > 0;

  return (
    <li>
      <Link
        href={`/portal/training/modules/${module.id}`}
        className="block rounded-md border border-ink-700/15 bg-bone-50 p-4 transition-colors duration-[150ms] hover:border-ink-700/35 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
      >
        <div className="flex items-center gap-4">
          {/* Module number */}
          <div className="flex shrink-0 items-center justify-center">
            <span
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-full font-body text-caption font-medium",
                isComplete
                  ? "bg-brand-500 text-cream-50"
                  : "bg-bone-200 text-ink-700",
              )}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {isComplete ? (
                <Check className="size-4" strokeWidth={2} aria-hidden="true" />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
          </div>

          {/* Title + duration */}
          <div className="flex-1 min-w-0">
            <p className="font-body text-small font-medium text-ink-900">
              {module.title}
            </p>
            <p
              className="mt-0.5 font-body text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {module.video_duration_seconds
                ? formatDuration(module.video_duration_seconds)
                : "—"}
              {!isRequired && " · Optional"}
            </p>
          </div>

          {/* Status */}
          <div className="shrink-0">
            {isComplete ? (
              <span
                className="font-body text-caption font-medium uppercase text-brand-700"
                style={EYEBROW_TRACKING}
              >
                Complete
              </span>
            ) : inProgress ? (
              <span
                className="font-body text-caption text-ink-700"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {watchPercent}% watched
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 font-body text-caption text-ink-500"
                style={EYEBROW_TRACKING}
              >
                <Circle
                  className="size-3"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Not started
              </span>
            )}
          </div>

          {/* Action arrow */}
          <Play
            className="size-4 shrink-0 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
