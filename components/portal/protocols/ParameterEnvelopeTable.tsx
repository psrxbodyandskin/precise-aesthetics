import type { ProtocolParameterRow } from "@/lib/sanity/types";

interface ParameterEnvelopeTableProps {
  rows: ProtocolParameterRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Clinical parameter table.
//
// At iPad/desktop widths (>=768px): full table layout, no horizontal
// scroll. Columns: wavelength, fluence, pulse, spot size, fitz notes.
//
// At mobile (<768px): table is hidden via CSS, replaced by stacked
// label/value cards. CSS-only swap so print mode (which always shows
// the table) is unaffected by JS state.
//
// Print: forces table layout regardless of viewport, with break-inside:
// avoid on rows so a parameter row never splits across pages.
export function ParameterEnvelopeTable({ rows }: ParameterEnvelopeTableProps) {
  if (rows.length === 0) {
    return (
      <p className="font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
        Parameters not yet documented for this protocol.
      </p>
    );
  }

  return (
    <div>
      {/* Table — visible at md+ AND on print */}
      <div className="hidden overflow-hidden rounded-md border border-ink-700/15 md:block print:block print:border-ink-900">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-700/15 print:border-ink-900">
              {[
                "Wavelength",
                "Fluence (J/cm²)",
                "Pulse duration (ps)",
                "Spot size (mm)",
                "Fitzpatrick notes",
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="bg-bone-100 px-4 py-2.5 font-body text-overline font-medium uppercase text-ink-500 print:bg-transparent"
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
                className="border-b border-ink-700/10 last:border-0 align-top print:break-inside-avoid"
              >
                <td
                  className="px-4 py-3 font-body text-small text-ink-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.wavelength ?? "—"}
                </td>
                <td
                  className="px-4 py-3 font-body text-small text-ink-700"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatFluence(row.fluenceMin, row.fluenceMax)}
                </td>
                <td
                  className="px-4 py-3 font-body text-small text-ink-700"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {row.pulseDuration ?? "—"}
                </td>
                <td className="px-4 py-3 font-body text-small text-ink-700">
                  {row.spotSize ?? "—"}
                </td>
                <td
                  className="px-4 py-3 font-body text-caption text-ink-500"
                  style={{ lineHeight: 1.55 }}
                >
                  {row.fitzpatrickAdjustment ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards — visible <md, hidden on print */}
      <ul className="space-y-4 md:hidden print:hidden">
        {rows.map((row) => (
          <li
            key={row._key}
            className="rounded-md border border-ink-700/15 bg-bone-50 p-4"
          >
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              {row.wavelength ?? "Parameter row"}
            </p>
            <dl className="mt-3 grid gap-2">
              <FieldRow
                label="Fluence (J/cm²)"
                value={formatFluence(row.fluenceMin, row.fluenceMax)}
              />
              <FieldRow
                label="Pulse duration (ps)"
                value={row.pulseDuration === undefined ? "—" : String(row.pulseDuration)}
              />
              <FieldRow label="Spot size (mm)" value={row.spotSize ?? "—"} />
              {row.fitzpatrickAdjustment && (
                <div className="pt-2 border-t border-ink-700/10">
                  <dt
                    className="font-body text-overline font-medium uppercase text-ink-500"
                    style={EYEBROW_TRACKING}
                  >
                    Fitzpatrick notes
                  </dt>
                  <dd
                    className="mt-1 font-body text-caption text-ink-700"
                    style={{ lineHeight: 1.6 }}
                  >
                    {row.fitzpatrickAdjustment}
                  </dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-body text-caption text-ink-500">{label}</dt>
      <dd
        className="font-body text-small text-ink-900 text-right"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </dd>
    </div>
  );
}

function formatFluence(min: number | undefined, max: number | undefined): string {
  if (min === undefined && max === undefined) return "—";
  if (min !== undefined && max !== undefined) return `${min} – ${max}`;
  return String(min ?? max ?? "—");
}
