import { cn } from "@/lib/utils";

export interface SpecRow {
  /** Optional label for this individual row. If omitted, row is a continuation
   *  of the category and renders aligned under the category label.
   *  When `value` is a string[], renders as a stacked list. */
  value: React.ReactNode | string[];
}

export interface SpecGroup {
  /** Category label (e.g., "Wavelengths"). */
  category: string;
  /** Rows under this category. Most categories are a single row with a
   *  string[] value; some have a single string. */
  rows: SpecRow[];
}

export interface SpecTableProps {
  /** Groups of specs, ordered top to bottom. */
  groups: SpecGroup[];
  /** Optional className passthrough. */
  className?: string;
}

// Two-column technical spec table.
// Desktop: category label left (Inter overline tracked, ink-500), spec values
// right (Inter regular, ink-900), 1px hairline divider between rows, generous
// vertical padding.
// Mobile: stacks to single column with category label above values.
// Reference register: NEJM tables, Stripe docs tables, Apple spec pages.
export function SpecTable({ groups, className }: SpecTableProps) {
  return (
    <dl
      className={cn(
        "w-full",
        "border-t border-[color:var(--pa-border-subtle)]",
        className,
      )}
    >
      {groups.map((group) => (
        <div
          key={group.category}
          className={cn(
            "grid grid-cols-1 gap-y-2 gap-x-12 py-6",
            "md:grid-cols-[200px_1fr] md:gap-y-0 md:py-7",
            "border-b border-[color:var(--pa-border-subtle)]",
          )}
        >
          <dt className="font-body text-overline tracking-overline uppercase text-ink-500">
            {group.category}
          </dt>
          <dd className="font-body text-body leading-body text-ink-900">
            <SpecRows rows={group.rows} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SpecRows({ rows }: { rows: SpecRow[] }) {
  if (rows.length === 1) {
    return <SpecValue value={rows[0].value} />;
  }
  return (
    <ul className="space-y-1.5" role="list">
      {rows.map((row, i) => (
        <li key={i}>
          <SpecValue value={row.value} />
        </li>
      ))}
    </ul>
  );
}

function SpecValue({ value }: { value: SpecRow["value"] }) {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1.5" role="list">
        {value.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }
  return <>{value}</>;
}
