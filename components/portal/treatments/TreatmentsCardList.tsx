import Link from "next/link";
import type { FilteredTreatmentRow } from "@/lib/portal/treatments";
import { TreatmentIndicators } from "./TreatmentIndicators";

interface TreatmentsCardListProps {
  rows: FilteredTreatmentRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Mobile card layout. Visible at <md, hidden on desktop where the
// table renders instead.
export function TreatmentsCardList({ rows }: TreatmentsCardListProps) {
  return (
    <ul className="space-y-3 md:hidden">
      {rows.map((t) => (
        <li key={t.id}>
          <Link
            href={`/portal/treatments/${t.id}`}
            className="block rounded-md border border-ink-700/15 bg-bone-50 p-4 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span
                className="font-body text-caption font-medium uppercase text-ink-500"
                style={{
                  ...EYEBROW_TRACKING,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatDate(t.treatment_date)}
              </span>
              <TreatmentIndicators
                photoCount={t.photo_count}
                hasAdverseEvent={t.adverse_event_id !== null}
              />
            </div>
            <p className="mt-2 font-body text-small font-medium text-ink-900">
              {t.protocol?.title ?? "—"}
              {t.protocol_version_label && (
                <span
                  className="ml-2 font-body text-caption font-normal text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  v{t.protocol_version_label}
                </span>
              )}
            </p>
            <p
              className="mt-1 font-body text-caption text-ink-500"
              style={{ lineHeight: 1.55 }}
            >
              {t.indication} · Fitz {t.patient_fitzpatrick} · {t.entered_by_name}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
