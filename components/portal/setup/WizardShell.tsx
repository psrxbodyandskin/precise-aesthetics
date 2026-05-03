import type { ReactNode } from "react";
import { SETUP_STEPS, type SetupStepSlug } from "@/lib/schemas/setup-wizard";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface WizardShellProps {
  step: SetupStepSlug;
  title: string;
  /** Short lead under the title — single sentence in editorial register. */
  lead?: string;
  children: ReactNode;
}

// Shared shell for every setup-wizard step. Provides the editorial
// chrome (60px hairline, § eyebrow, Fraunces title) plus the
// hairline progress strip at the top — read as "01 / 07 — Welcome".
//
// Per master spec: bone surface, midnight ink, single column, ~640px
// max width. No card sprawl, no marketing motion. Reduced-motion safe.
export function WizardShell({ step, title, lead, children }: WizardShellProps) {
  const idx = SETUP_STEPS.findIndex((s) => s.slug === step);
  const current = SETUP_STEPS[idx] ?? SETUP_STEPS[0]!;
  const total = SETUP_STEPS.length;
  const completedRatio = Math.max(0, idx) / Math.max(1, total - 1);

  return (
    <article className="relative mx-auto max-w-[640px] px-6 pt-12 pb-20 md:px-12 md:pt-16 md:pb-28">
      {/* Progress strip: hairline + percentage fill, plate number on right */}
      <div aria-hidden="true" className="mb-10 flex items-center gap-4">
        <span
          className="font-body text-overline font-medium uppercase tracking-[0.18em] text-ink-500"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {current.num} / {String(total).padStart(2, "0")}
        </span>
        <div className="relative h-px flex-1 bg-ink-700/15">
          <div
            className="absolute inset-y-0 left-0 bg-brand-500"
            style={{
              width: `${Math.round(completedRatio * 100)}%`,
              transition: "width 240ms ease",
            }}
          />
        </div>
        <span
          className="font-body text-overline font-medium uppercase tracking-[0.18em] text-ink-700"
        >
          {current.title}
        </span>
      </div>

      {/* 60px hairline */}
      <div aria-hidden="true" className="mb-8 flex">
        <span className="block h-px w-[60px] bg-brand-500/50" />
      </div>

      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Setup
        </p>
        <h1
          className="mt-4 font-display text-ink-900"
          style={{
            fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        {lead && (
          <p
            className="mt-4 max-w-[56ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            {lead}
          </p>
        )}
      </header>

      <section className="mt-10">{children}</section>
    </article>
  );
}
