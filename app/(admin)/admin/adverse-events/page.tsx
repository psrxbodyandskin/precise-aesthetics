import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import { listAdverseEvents } from "@/lib/admin/adverse-events";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
  ADVERSE_EVENT_STATUSES,
  type AdverseEventStatus,
} from "@/lib/schemas/treatment";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Adverse Events — Admin",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const STATUS_LABEL: Record<AdverseEventStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  addressed: "Addressed",
};
const STATUS_STYLE: Record<AdverseEventStatus, string> = {
  new: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  reviewing: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/20",
  addressed: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

export default async function AdminAdverseEventsPage() {
  await requireAdmin();
  const { data: events } = await listAdverseEvents({ limit: 200 });

  const rows = (events ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Adverse Events" }]} />

      <AdminPageHeader
        eyebrow="Admin"
        title="Adverse Events"
        lead="Review reported adverse reactions across all practices."
      />

      <div className="mt-12">
        {rows.length === 0 ? (
          <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              All clear
            </p>
            <p className="mt-3 font-body text-ink-700" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
              No adverse events reported.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
            <table className="w-full text-left text-small">
              <thead className="border-b border-ink-700/10">
                <tr>
                  {[
                    "Date",
                    "Practice",
                    "Protocol",
                    "Fitzpatrick",
                    "Indication",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="font-body text-overline font-medium uppercase text-ink-500 px-5 py-3"
                      style={EYEBROW_TRACKING}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = row.id as string;
                  const created = row.created_at as string;
                  const status = row.status as AdverseEventStatus;
                  const practice = (Array.isArray(row.practice) ? row.practice[0] : row.practice) as
                    | { id: string; name: string }
                    | null;
                  const treatment = (
                    Array.isArray(row.treatment) ? row.treatment[0] : row.treatment
                  ) as
                    | {
                        treatment_date: string;
                        indication: string;
                        patient_fitzpatrick: string;
                        protocol_version_label: string;
                        protocol: { title: string } | { title: string }[] | null;
                      }
                    | null;
                  const protoRaw = treatment?.protocol;
                  const protocol = Array.isArray(protoRaw) ? protoRaw[0] : protoRaw;

                  return (
                    <tr
                      key={id}
                      className="border-b border-ink-700/10 last:border-0 transition-colors duration-[150ms] hover:bg-bone-100"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/adverse-events/${id}`}
                          className="font-body text-ink-900 hover:text-brand-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatDate(treatment?.treatment_date ?? created)}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-ink-700">{practice?.name ?? "—"}</td>
                      <td className="px-5 py-4 text-ink-700">
                        {protocol?.title ?? "—"}
                        {treatment?.protocol_version_label && (
                          <span
                            className="ml-2 text-ink-500"
                            style={{ fontVariantNumeric: "tabular-nums" }}
                          >
                            v{treatment.protocol_version_label}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-ink-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {treatment?.patient_fitzpatrick ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        {treatment?.indication ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
                            STATUS_STYLE[status],
                          )}
                          style={{ letterSpacing: "0.08em" }}
                        >
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 font-body text-caption text-ink-500">
          {rows.length} event{rows.length === 1 ? "" : "s"}
          {rows.filter((r) => r.status === "new").length > 0 &&
            ` — ${rows.filter((r) => r.status === "new").length} new`}
          .
        </p>
      </div>

      {/* Hint that all known statuses are filterable in P7+ */}
      <p
        className="mt-12 font-body text-caption text-ink-500"
        style={{ lineHeight: 1.55 }}
      >
        Statuses tracked: {ADVERSE_EVENT_STATUSES.map((s) => STATUS_LABEL[s]).join(" → ")}.
      </p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
