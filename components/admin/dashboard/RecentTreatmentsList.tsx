import Link from "next/link";
import { AlertCircle, Camera } from "lucide-react";
import type { RecentTreatment } from "@/lib/admin/dashboard";
import { PracticeIdHash } from "./PracticeIdHash";

interface RecentTreatmentsListProps {
  treatments: RecentTreatment[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function RecentTreatmentsList({
  treatments,
}: RecentTreatmentsListProps) {
  return (
    <section className="rounded-md border border-ink-700/15 bg-bone-50 p-5 md:p-6">
      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Recent treatments
        </p>
        <p
          className="mt-1 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Last 20 treatments across all practices. Practice identifiers
          anonymized — click through for full context.
        </p>
      </header>

      {treatments.length === 0 ? (
        <p
          className="mt-6 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          No treatments logged yet.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-ink-700/10">
          {treatments.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/treatments/${t.id}`}
                className="flex items-center gap-3 py-3 transition-colors duration-[150ms] hover:bg-bone-100/60 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
              >
                <span
                  className="w-20 shrink-0 font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(t.treatment_date)}
                </span>
                <PracticeIdHash practiceId={t.practice_id} />
                <div className="min-w-0 flex-1">
                  <span className="font-body text-small text-ink-900 truncate">
                    {t.protocol_title ?? "—"}
                    {t.protocol_version_label && (
                      <span
                        className="ml-2 font-body text-caption font-normal text-ink-500"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        v{t.protocol_version_label}
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className="hidden font-body text-caption text-ink-500 sm:inline"
                  style={{ lineHeight: 1.55 }}
                >
                  {t.indication}
                </span>
                <span
                  className="font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Fitz {t.patient_fitzpatrick}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {t.photo_count > 0 && (
                    <Camera
                      className="size-3.5 text-ink-500"
                      strokeWidth={1.5}
                      aria-label={`${t.photo_count} photos`}
                    />
                  )}
                  {t.has_adverse_event && (
                    <AlertCircle
                      className="size-3.5 text-[#8A2C2C]"
                      strokeWidth={1.5}
                      aria-label="Adverse event flagged"
                    />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
