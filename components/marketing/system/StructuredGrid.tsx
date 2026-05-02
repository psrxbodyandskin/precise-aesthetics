import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface NumberedItem {
  /** Two-digit number string (e.g., "01"). */
  number: string;
  heading: React.ReactNode;
  body: React.ReactNode;
}

export interface CardItem {
  icon: LucideIcon;
  /** Eyebrow label (e.g., "PREP"). */
  eyebrow: string;
  heading: React.ReactNode;
  body: React.ReactNode;
  /** Optional list of items to show below the body. */
  items?: React.ReactNode[];
  /** Optional figure annotation (e.g., "Fig. 04"). */
  fig?: string;
}

interface NumberedGridProps {
  variant: "numbered";
  items: NumberedItem[];
  /** "light" (bone surface) | "dark" (midnight surface). Defaults to "light". */
  tone?: "light" | "dark";
}

interface CardGridProps {
  variant: "cards";
  items: CardItem[];
  /** "light" (bone surface) | "dark" (midnight surface). Defaults to "light". */
  tone?: "light" | "dark";
  /** Number of columns at lg breakpoint. Default 3. */
  columns?: 2 | 3 | 4;
}

type StructuredGridProps = NumberedGridProps | CardGridProps;

// Reusable structured pattern — numbered list (single column) or card grid.
// Numbered variant matches the homepage Practitioners "Included in the system"
// treatment. Card variant matches the homepage Outcomes 3-up grid.
export function StructuredGrid(props: StructuredGridProps) {
  if (props.variant === "numbered") {
    return <NumberedGrid items={props.items} tone={props.tone ?? "light"} />;
  }
  return (
    <CardGrid
      items={props.items}
      tone={props.tone ?? "light"}
      columns={props.columns ?? 3}
    />
  );
}

function NumberedGrid({
  items,
  tone,
}: {
  items: NumberedItem[];
  tone: "light" | "dark";
}) {
  const isDark = tone === "dark";
  return (
    <ul className="space-y-0" role="list">
      {items.map((item, i) => (
        <li
          key={item.number}
          className={cn(
            "py-6",
            i > 0 &&
              (isDark
                ? "border-t border-brand-300/15"
                : "border-t border-[color:var(--pa-border-default)]"),
          )}
        >
          <div className="grid grid-cols-[auto_1fr] gap-x-6">
            <span
              className={cn(
                "font-display italic text-h2 leading-none pt-1",
                isDark ? "text-brand-300/70" : "text-ink-900/70",
              )}
              aria-hidden="true"
            >
              {item.number}
            </span>
            <div>
              <p
                className={cn(
                  "font-display text-h4 leading-tight",
                  isDark ? "text-cream-50" : "text-ink-900",
                )}
              >
                {item.heading}
              </p>
              <p
                className={cn(
                  "mt-2 font-body text-small leading-body",
                  isDark ? "text-cream-300" : "text-ink-700",
                )}
              >
                {item.body}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CardGrid({
  items,
  tone,
  columns,
}: {
  items: CardItem[];
  tone: "light" | "dark";
  columns: 2 | 3 | 4;
}) {
  const isDark = tone === "dark";
  const colClass: Record<2 | 3 | 4, string> = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
  return (
    <div className={cn("grid grid-cols-1 gap-8 md:gap-10", colClass[columns])}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article
            key={item.eyebrow}
            className={cn(
              "group relative flex flex-col p-8 md:p-10 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1",
              isDark
                ? "bg-midnight-700"
                : "bg-bone-50",
            )}
            style={
              isDark
                ? undefined
                : {
                    boxShadow:
                      "0 1px 1px rgba(31, 47, 79, 0.04), 0 8px 24px rgba(31, 47, 79, 0.06), 0 24px 48px -12px rgba(31, 47, 79, 0.08)",
                  }
            }
          >
            {/* Top hairline accent */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent",
              )}
            />

            {/* Asymmetric corner brackets — Fig. motif */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-0 left-0 h-3 w-px",
                isDark ? "bg-brand-300/40" : "bg-ink-700/45",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute top-0 left-0 h-px w-3",
                isDark ? "bg-brand-300/40" : "bg-ink-700/45",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-0 right-0 h-3 w-px",
                isDark ? "bg-brand-300/40" : "bg-ink-700/45",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-0 right-0 h-px w-3",
                isDark ? "bg-brand-300/40" : "bg-ink-700/45",
              )}
            />

            {/* Eyebrow + icon row */}
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "font-body text-overline tracking-overline uppercase",
                  isDark ? "text-brand-300" : "text-brand-700",
                )}
              >
                {item.fig ? `${item.fig} · ${item.eyebrow}` : item.eyebrow}
              </span>
              <Icon
                className={cn(
                  "size-6 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110",
                  isDark ? "text-brand-300" : "text-brand-500",
                )}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>

            {/* Heading */}
            <p
              className={cn(
                "mt-8 font-display tracking-heading leading-heading text-[clamp(1.5rem,1.5vw+0.5rem,2rem)]",
                isDark ? "text-cream-50" : "text-ink-900",
              )}
            >
              {item.heading}
            </p>

            {/* Body */}
            <p
              className={cn(
                "mt-4 font-body text-body leading-body max-w-[36ch]",
                isDark ? "text-cream-100" : "text-ink-700",
              )}
            >
              {item.body}
            </p>

            {/* Optional items list */}
            {item.items && item.items.length > 0 && (
              <ul
                className={cn(
                  "mt-6 space-y-2 font-body text-small leading-body",
                  isDark ? "text-cream-300" : "text-ink-700",
                )}
                role="list"
              >
                {item.items.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[10px] block h-px w-2 shrink-0",
                        isDark ? "bg-brand-300/60" : "bg-ink-700/40",
                      )}
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </div>
  );
}
