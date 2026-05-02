import { Activity, ShieldCheck, Target, type LucideIcon } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { CountUpStat } from "@/components/marketing/CountUpStat";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { BodyText } from "@/components/marketing/typography/BodyText";

type OutcomeCard = {
  fig: string;
  icon: LucideIcon;
  // For animated stats: numeric target + prefix/suffix.
  // For symbolic stats (e.g., "∞"), use `staticStat` instead.
  stat?: { target: number; prefix?: string; suffix?: string; decimals?: number };
  staticStat?: string;
  statSrLabel: string;
  description: string;
  caption: string;
};

// [DRAFT — pending approval] Stats are illustrative; real numbers need
// clinical sign-off before launch. Build with placeholders and review.
// [CLINICAL DATA — PRE-LAUNCH SIGN-OFF REQUIRED]
const OUTCOMES: OutcomeCard[] = [
  {
    fig: "Fig. 06",
    icon: ShieldCheck,
    stat: { target: 95, prefix: "~", suffix: "%" },
    statSrLabel: "approximately ninety-five percent",
    description:
      "Reduction in post-inflammatory hyperpigmentation events vs. standard pico protocols",
    caption: "Internal protocol data, n=247",
  },
  {
    fig: "Fig. 07",
    icon: Target,
    stat: { target: 4, suffix: "×" },
    statSrLabel: "four times",
    description:
      "More predictable session-to-session outcomes across skin types",
    caption: "Aggregate practitioner data",
  },
  {
    fig: "Fig. 08",
    icon: Activity,
    staticStat: "∞",
    statSrLabel: "ongoing",
    description:
      "Every session contributes to the data layer that refines the next",
    caption: "Continuously updated",
  },
];

function OutcomeCardItem({ card }: { card: OutcomeCard }) {
  const Icon = card.icon;
  return (
    <article
      className="group relative flex flex-col bg-bone-50 p-8 md:p-10 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1"
      style={{
        boxShadow:
          "0 1px 1px rgba(31, 47, 79, 0.04), 0 8px 24px rgba(31, 47, 79, 0.06), 0 24px 48px -12px rgba(31, 47, 79, 0.08)",
      }}
    >
      {/* Top hairline — brand-300 architectural accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-300/60 to-transparent"
      />

      {/* Asymmetric corner brackets — Fig. 01 motif on light surface */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-3 w-px bg-ink-700/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-px w-3 bg-ink-700/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-3 w-px bg-ink-700/45"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-px w-3 bg-ink-700/45"
      />

      {/* Figure caption + icon row */}
      <div className="flex items-center justify-between">
        <span className="font-body text-overline tracking-overline uppercase text-brand-700">
          {card.fig}
        </span>
        <Icon
          className="size-6 text-brand-500 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </div>

      {/* Oversized editorial stat — counts up on viewport entry */}
      <p className="mt-12 font-display italic leading-none tracking-display text-ink-900 text-[clamp(3rem,4vw+1rem,5rem)]">
        {card.stat ? (
          <CountUpStat
            target={card.stat.target}
            prefix={card.stat.prefix}
            suffix={card.stat.suffix}
            decimals={card.stat.decimals ?? 0}
            srLabel={card.statSrLabel}
          />
        ) : (
          <>
            <span aria-hidden="true">{card.staticStat}</span>
            <span className="sr-only">{card.statSrLabel}</span>
          </>
        )}
      </p>
      <p className="mt-6 font-body text-body leading-body text-ink-700 max-w-[28ch]">
        {card.description}
      </p>
      <div className="mt-auto pt-8">
        <span
          aria-hidden="true"
          className="block h-px w-[40px] bg-ink-700/40"
        />
        <p className="mt-3 font-body text-caption text-ink-500">
          {card.caption}
        </p>
      </div>
    </article>
  );
}

export function Outcomes() {
  return (
    <Section
      tone="bone"
      size="default"
      className="relative isolate overflow-hidden"
    >
      <BoneBlooms variant="outcomes" />

      {/* Editorial section header — asymmetric 2-up.
          Left col: heading. Right col: lead + source citation block. */}
      <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Left col — eyebrow + heading */}
        <div className="lg:col-span-7">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-700/60"
            />
            <span className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
              § The outcomes
            </span>
          </div>
          <DisplayHeading level="md" as="h2" className="mt-8 max-w-[16ch]">
            Predictable on Fitzpatrick IV through VI.
          </DisplayHeading>
        </div>

        {/* Right col — lead */}
        <div className="lg:col-span-5 lg:pt-2">
          <Lead className="text-ink-700">
            The reason the system exists is the result. Engineered protocols,
            biologic control, and outcome tracking &mdash; together &mdash;
            produce consistency where the industry has historically failed.
          </Lead>
        </div>
      </div>

      <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
        {OUTCOMES.map((card) => (
          <OutcomeCardItem key={card.description} card={card} />
        ))}
      </div>

      <div className="relative mt-20 flex justify-center">
        <div className="flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="block h-px w-[40px] bg-ink-700/45"
          />
          <BodyText className="mt-6 max-w-[58ch] text-ink-700">
            Real-world treatment data continuously refines the protocol
            library. Every practitioner using the system contributes to the
            next practitioner&rsquo;s better outcomes.
          </BodyText>
        </div>
      </div>
    </Section>
  );
}
