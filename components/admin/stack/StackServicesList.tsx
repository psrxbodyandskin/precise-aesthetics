import Link from "next/link";

import type { StackServiceRow } from "@/lib/admin/stack";
import { STACK_CATEGORY_LABEL } from "./StackCategoryChip";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface StackServicesListProps {
  services: StackServiceRow[];
}

// Group by category for the list view per spec § 664.
export function StackServicesList({ services }: StackServicesListProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-12 text-center">
        <p className="font-body text-small text-ink-700">No services yet.</p>
        <p
          className="mt-2 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Click &ldquo;New service&rdquo; to add the first one.
        </p>
      </div>
    );
  }

  // Group services by category
  const groups = new Map<string, StackServiceRow[]>();
  for (const s of services) {
    const list = groups.get(s.category) ?? [];
    list.push(s);
    groups.set(s.category, list);
  }

  // Render groups in fixed category order
  const ordered = Array.from(groups.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div className="space-y-10">
      {ordered.map(([category, items]) => (
        <section key={category}>
          <p
            className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {STACK_CATEGORY_LABEL[category as keyof typeof STACK_CATEGORY_LABEL] ??
              category}
          </p>
          <ul className="divide-y divide-ink-700/10 rounded-md border border-ink-700/15 bg-bone-50">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/admin/stack/${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors duration-[150ms] hover:bg-bone-100/60 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                >
                  <div className="min-w-0">
                    <p className="font-body text-small font-medium text-ink-900">
                      {s.name}
                    </p>
                    <p
                      className="mt-0.5 truncate font-body text-caption text-ink-500"
                      style={{ lineHeight: 1.5 }}
                    >
                      {s.what_it_does}
                    </p>
                  </div>
                  <div
                    className="flex shrink-0 flex-wrap items-center gap-3 font-body text-caption text-ink-500"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {s.plan_tier && <span>{s.plan_tier}</span>}
                    {s.monthly_cost_estimate_usd !== null && (
                      <span>
                        ${Number(s.monthly_cost_estimate_usd).toFixed(2)}/mo
                      </span>
                    )}
                    {s.renewal_date && (
                      <span>
                        Renews {new Date(s.renewal_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
