import { Check } from "lucide-react";

interface BiologicControlSummaryProps {
  prepKitRequired?: boolean;
  recoveryKitRequired?: boolean;
  maintenanceKitRecommended?: boolean;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface Item {
  label: string;
  status: "Required" | "Recommended";
  active: boolean;
}

// Three-column status block: prep / recovery / maintenance.
// Active = brand-300 check; inactive = ink-300/50 check (muted).
// No ✗ marks — absence is shown by absence per spec.
export function BiologicControlSummary({
  prepKitRequired,
  recoveryKitRequired,
  maintenanceKitRecommended,
}: BiologicControlSummaryProps) {
  const items: Item[] = [
    { label: "Prep kit", status: "Required", active: Boolean(prepKitRequired) },
    {
      label: "Recovery kit",
      status: "Required",
      active: Boolean(recoveryKitRequired),
    },
    {
      label: "Maintenance kit",
      status: "Recommended",
      active: Boolean(maintenanceKitRecommended),
    },
  ];

  return (
    <ul className="grid gap-4 sm:grid-cols-3 print:grid-cols-3 print:break-inside-avoid">
      {items.map((it) => (
        <li
          key={it.label}
          className="rounded-md border border-ink-700/15 bg-bone-50 p-5 print:border-ink-900"
        >
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {it.label}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              aria-hidden="true"
              className={
                it.active
                  ? "inline-flex size-5 items-center justify-center rounded-full bg-brand-300/30 text-brand-700"
                  : "inline-flex size-5 items-center justify-center rounded-full bg-ink-300/15 text-ink-300"
              }
            >
              <Check className="size-3.5" strokeWidth={2} />
            </span>
            <span className="font-body text-small font-medium text-ink-900">
              {it.active ? it.status : "Optional"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
