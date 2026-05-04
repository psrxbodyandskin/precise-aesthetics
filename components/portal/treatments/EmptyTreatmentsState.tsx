import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EmptyTreatmentsStateProps {
  variant: "no-treatments-yet" | "no-filter-matches";
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Two distinct empty states for /portal/treatments:
//  - 'no-treatments-yet'  → practice has logged zero treatments (CTA to log)
//  - 'no-filter-matches'  → filters exclude all otherwise-visible rows
export function EmptyTreatmentsState({ variant }: EmptyTreatmentsStateProps) {
  if (variant === "no-treatments-yet") {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          No treatments yet
        </p>
        <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
          Log your first treatment.
        </h2>
        <p
          className="mx-auto mt-3 max-w-[44ch] font-body text-ink-700"
          style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
        >
          Each log contributes to system-wide pattern recognition and helps
          refine the protocols you rely on.
        </p>
        <div className="mt-5">
          <Button asChild variant="primary" size="md">
            <Link href="/portal/treatments/new">Log a treatment</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        No matches
      </p>
      <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
        No treatments match these filters.
      </h2>
      <p
        className="mx-auto mt-3 max-w-[42ch] font-body text-ink-700"
        style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
      >
        Try clearing one or more filters.
      </p>
      <Link
        href="/portal/treatments"
        className="mt-5 inline-block font-body text-small text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
      >
        Clear filters
      </Link>
    </div>
  );
}
