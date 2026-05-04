import Link from "next/link";
import type { FilteredTreatmentRow } from "@/lib/portal/treatments";
import { TreatmentIndicators } from "./TreatmentIndicators";

interface TreatmentsTableProps {
  rows: FilteredTreatmentRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Desktop table layout. Mobile uses TreatmentsCardList instead — both
// rendered, CSS picks which is visible (md:hidden / hidden md:block).
export function TreatmentsTable({ rows }: TreatmentsTableProps) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-ink-700/15 bg-bone-50 md:block">
      <table className="w-full text-left">
        <thead className="border-b border-ink-700/10">
          <tr>
            {[
              "Date",
              "Protocol",
              "Indication",
              "Fitz",
              "Entered by",
              "",
            ].map((h, i) => (
              <th
                key={i}
                className="bg-bone-100 px-4 py-2.5 font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              className="border-b border-ink-700/10 last:border-0 transition-colors duration-[150ms] hover:bg-bone-100"
            >
              <td className="px-4 py-3 align-top">
                <Link
                  href={`/portal/treatments/${t.id}`}
                  className="font-body text-small text-ink-900 hover:text-brand-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(t.treatment_date)}
                </Link>
              </td>
              <td className="px-4 py-3 align-top">
                <span className="font-body text-small text-ink-900">
                  {t.protocol?.title ?? "—"}
                </span>
                {t.protocol_version_label && (
                  <span
                    className="ml-2 inline-flex items-center rounded-sm border border-ink-700/15 bg-bone-100 px-1.5 py-0.5 font-body text-caption text-ink-700"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    v{t.protocol_version_label}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 align-top font-body text-small text-ink-700">
                {t.indication}
              </td>
              <td
                className="px-4 py-3 align-top font-body text-small text-ink-700"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {t.patient_fitzpatrick}
              </td>
              <td className="px-4 py-3 align-top font-body text-small text-ink-700">
                {t.entered_by_name}
              </td>
              <td className="px-4 py-3 align-top">
                <TreatmentIndicators
                  photoCount={t.photo_count}
                  hasAdverseEvent={t.adverse_event_id !== null}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
