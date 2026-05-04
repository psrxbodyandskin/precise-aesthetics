import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { AdverseEventsSummary } from "@/lib/admin/dashboard";
import { PracticeIdHash } from "./PracticeIdHash";
import { cn } from "@/lib/utils";

interface AdverseEventsPanelProps {
  summary: AdverseEventsSummary;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  reviewing: "Reviewing",
  addressed: "Addressed",
};
const STATUS_STYLE: Record<string, string> = {
  new: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  reviewing: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/20",
  addressed: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

export function AdverseEventsPanel({ summary }: AdverseEventsPanelProps) {
  return (
    <section className="rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Adverse events
          </p>
          <p
            className="mt-2 font-display text-h4 leading-heading text-ink-900"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {summary.total}
            <span className="ml-2 font-body text-caption font-normal text-ink-500">
              total
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["new", "reviewing", "addressed"] as const).map((status) => {
            const n = summary.by_status[status] ?? 0;
            return (
              <span
                key={status}
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
                  STATUS_STYLE[status],
                )}
                style={{
                  letterSpacing: "0.08em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {STATUS_LABEL[status]} · {n}
              </span>
            );
          })}
        </div>
      </header>

      {summary.recent.length > 0 ? (
        <ul className="mt-5 divide-y divide-ink-700/10">
          {summary.recent.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/adverse-events/${r.id}`}
                className="flex items-center justify-between gap-3 py-3 transition-colors duration-[150ms] hover:bg-bone-100/60 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="font-body text-caption text-ink-500"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatDate(r.created_at)}
                  </span>
                  <PracticeIdHash practiceId={r.practice_id} />
                  <span className="truncate font-body text-small text-ink-900">
                    {r.indication}
                  </span>
                  <span
                    className="font-body text-caption text-ink-500"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    Fitz {r.patient_fitzpatrick}
                  </span>
                </div>
                <span
                  className={cn(
                    "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium uppercase",
                    STATUS_STYLE[r.status],
                  )}
                  style={{ letterSpacing: "0.08em" }}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="mt-5 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          No adverse events reported in this period.
        </p>
      )}

      <div className="mt-5 border-t border-ink-700/10 pt-4">
        <Link
          href="/admin/adverse-events"
          className="inline-flex items-center gap-1.5 font-body text-caption text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          View all adverse events
          <ArrowRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
