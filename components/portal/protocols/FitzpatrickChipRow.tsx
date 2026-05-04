import { FITZPATRICK_TYPES, type FitzpatrickType } from "@/lib/portal/filters";
import { cn } from "@/lib/utils";

interface FitzpatrickChipRowProps {
  applicable: string[] | null | undefined;
  /** Compact = smaller dimensions for cards. Default = reading view. */
  compact?: boolean;
}

// I/II/III/IV/V/VI chips. Applicable types highlighted with brand-300/30
// fill + ink-900 text. Non-applicable shown muted in ink-300.
//
// Used on protocol cards (compact) and on the reading view identity
// section (default).
export function FitzpatrickChipRow({
  applicable,
  compact = false,
}: FitzpatrickChipRowProps) {
  const set = new Set(applicable ?? []);
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        compact ? "gap-1" : "gap-1.5",
      )}
      aria-label="Applicable Fitzpatrick types"
    >
      {FITZPATRICK_TYPES.map((t) => {
        const active = set.has(t);
        return (
          <li key={t}>
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-sm font-body font-medium leading-none",
                compact ? "h-5 min-w-[1.25rem] px-1.5 text-[10px]" : "h-7 min-w-[1.75rem] px-2 text-caption",
                active
                  ? "bg-brand-300/30 text-ink-900 ring-1 ring-inset ring-brand-500/40"
                  : "text-ink-300 ring-1 ring-inset ring-ink-300/30",
              )}
              aria-current={active ? "true" : undefined}
              title={active ? `Type ${t} — applicable` : `Type ${t} — not applicable`}
            >
              {t}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function isFitzpatrick(value: string): value is FitzpatrickType {
  return (FITZPATRICK_TYPES as readonly string[]).includes(value);
}
