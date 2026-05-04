import type { ProtocolStatRow } from "@/lib/admin/dashboard";

interface ProtocolStatsTableProps {
  rows: ProtocolStatRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ProtocolStatsTable({ rows }: ProtocolStatsTableProps) {
  return (
    <div className="overflow-hidden rounded-sm border border-ink-700/15">
      <table className="w-full text-left">
        <thead className="border-b border-ink-700/10">
          <tr>
            {["Protocol", "Treatments", "AE", "Common Fitz", "Last used"].map(
              (h) => (
                <th
                  key={h}
                  className="bg-bone-100 px-3 py-2 font-body text-overline font-medium uppercase text-ink-500"
                  style={EYEBROW_TRACKING}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const aeRate =
              r.treatment_count > 0
                ? (r.adverse_event_count / r.treatment_count) * 100
                : 0;
            return (
              <tr
                key={r.protocol_id}
                className="border-b border-ink-700/10 last:border-0 align-top"
              >
                <td className="px-3 py-2.5">
                  <span className="font-body text-small text-ink-900">
                    {r.title}
                  </span>
                  <span
                    className="ml-2 font-body text-caption text-ink-500"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    v{r.current_version}
                  </span>
                </td>
                <td
                  className="px-3 py-2.5 font-body text-small text-ink-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {r.treatment_count.toLocaleString()}
                </td>
                <td
                  className="px-3 py-2.5 font-body text-small text-ink-700"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {r.adverse_event_count > 0
                    ? `${r.adverse_event_count} (${aeRate.toFixed(1)}%)`
                    : "—"}
                </td>
                <td
                  className="px-3 py-2.5 font-body text-small text-ink-700"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {r.common_fitzpatrick ?? "—"}
                </td>
                <td
                  className="px-3 py-2.5 font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatDate(r.last_used_date)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "2-digit",
    });
  } catch {
    return iso;
  }
}
