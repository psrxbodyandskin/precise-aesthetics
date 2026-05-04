import type { ReactNode } from "react";

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  empty?: boolean;
  emptyCaption?: string;
  emptyEncouragement?: string;
  children: ReactNode;
  className?: string;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Wraps each chart with a consistent frame + handles the launch-day
// empty state per spec callout A: when there's no data, render the
// frame + a sober caption + encouragement copy ("Charts populate as
// practitioners log treatments"). Never blank rectangles.
export function ChartFrame({
  title,
  subtitle,
  empty = false,
  emptyCaption = "No treatment data yet.",
  emptyEncouragement = "Charts populate as practitioners log treatments.",
  children,
  className = "",
}: ChartFrameProps) {
  return (
    <section
      className={`rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6 ${className}`}
    >
      <header className="mb-5">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="mt-1 font-body text-caption text-ink-500"
            style={{ lineHeight: 1.55 }}
          >
            {subtitle}
          </p>
        )}
      </header>
      {empty ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-ink-700/15 bg-bone-100/40 p-8 text-center">
          <p className="font-body text-small text-ink-700">{emptyCaption}</p>
          <p
            className="font-body text-caption text-ink-500"
            style={{ lineHeight: 1.55 }}
          >
            {emptyEncouragement}
          </p>
        </div>
      ) : (
        children
      )}
    </section>
  );
}
