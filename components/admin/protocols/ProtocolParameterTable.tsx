import type { ProtocolParameterRow } from "@/lib/sanity/types";

interface ProtocolParameterTableProps {
  rows: ProtocolParameterRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ProtocolParameterTable({ rows }: ProtocolParameterTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
      <table className="w-full text-left text-small">
        <thead className="border-b border-ink-700/10">
          <tr>
            {[
              "Wavelength",
              "Fluence (J/cm²)",
              "Pulse (ps)",
              "Spot size",
              "Notes",
            ].map((h) => (
              <th
                key={h}
                className="font-body text-overline font-medium uppercase text-ink-500 px-4 py-2.5"
                style={EYEBROW_TRACKING}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row._key}
              className="border-b border-ink-700/10 last:border-0"
            >
              <td className="px-4 py-3 font-body text-ink-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                {row.wavelength ?? "—"}
              </td>
              <td className="px-4 py-3 text-ink-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatFluence(row.fluenceMin, row.fluenceMax)}
              </td>
              <td className="px-4 py-3 text-ink-700" style={{ fontVariantNumeric: "tabular-nums" }}>
                {row.pulseDuration ?? "—"}
              </td>
              <td className="px-4 py-3 text-ink-700">{row.spotSize ?? "—"}</td>
              <td className="px-4 py-3 text-ink-500" style={{ lineHeight: 1.5 }}>
                {row.fitzpatrickAdjustment ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatFluence(min: number | undefined, max: number | undefined): string {
  if (min === undefined && max === undefined) return "—";
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  return `${min ?? max ?? "—"}`;
}
