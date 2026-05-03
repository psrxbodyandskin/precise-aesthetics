import type { ReactNode } from "react";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface AdminPageHeaderProps {
  /** All-caps eyebrow label (without the leading "§ "). */
  eyebrow: string;
  /** Page title — Fraunces display. */
  title: string;
  /** Optional one-line lead under the title. */
  lead?: string;
  /** Right-side actions (buttons, kebab menu, etc.). Stack below on mobile. */
  actions?: ReactNode;
}

// Standard admin page header. Eyebrow + Fraunces display + optional
// lead + optional actions row, with a 60px brand-300/40 hairline at
// the top edge. Reused on every admin page from P2 onward.
export function AdminPageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header>
      <div aria-hidden="true" className="mb-6 flex">
        <span className="block h-px w-[60px] bg-brand-500/50" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § {eyebrow}
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {title}
          </h1>
          {lead && (
            <p
              className="mt-3 max-w-[58ch] font-body text-ink-700"
              style={{ fontSize: "0.9375rem", lineHeight: 1.55 }}
            >
              {lead}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    </header>
  );
}
