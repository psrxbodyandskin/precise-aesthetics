import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type IncludedItem = {
  number: string;
  name: React.ReactNode;
  caption: string;
};

// [DRAFT — pending approval] "What's Included" copy from spec.
const INCLUDED: IncludedItem[] = [
  {
    number: "01",
    name: <>Precise Pico<TrademarkSymbol /> device</>,
    caption: "Multi-wavelength pico delivery system",
  },
  {
    number: "02",
    name: "Protocol Library access",
    caption: "All indications, including PIH Prevention",
  },
  {
    number: "03",
    name: "Biologic Control starter kit",
    caption: "Pre- and post-treatment supplies",
  },
  {
    number: "04",
    name: "Practitioner Portal account",
    caption: "Outcome logging, training, updates",
  },
  {
    number: "05",
    name: "Onboarding & certification",
    caption: "Provisioned at delivery",
  },
  {
    number: "06",
    name: "Data Intelligence access",
    caption: "Anonymized aggregate insights from your sessions",
  },
];

export function ForPractitioners() {
  return (
    <Section
      tone="midnight"
      size="default"
      className="relative isolate overflow-hidden"
    >
      {/* Subtle film grain — atmospheric continuity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left column — editorial intro */}
        <div className="lg:col-span-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="block h-px w-[60px] bg-brand-300/60"
            />
            <span className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
              § For practitioners
            </span>
          </div>
          <DisplayHeading
            level="md"
            as="h2"
            className="mt-8 max-w-[16ch] text-cream-50"
          >
            A complete clinical system &mdash; not just a capital purchase.
          </DisplayHeading>
          <Lead className="mt-8 max-w-[44ch] text-cream-100">
            Practitioners who buy into the Precise System get the device, the
            protocols, the biologic control kits, and access to the
            practitioner portal &mdash; where outcome data, training, and
            protocol updates live. The system grows with the practice.
          </Lead>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button asChild variant="primary-on-dark" size="lg">
              <Link href="/demo">Request a demonstration</Link>
            </Button>
            <Link
              href="/portal-preview"
              className={cn(
                "inline-flex items-center gap-2",
                "font-body text-small text-cream-100 hover:text-cream-50",
                "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
              )}
            >
              <span>See practitioner portal preview</span>
              <ArrowRight
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>

        {/* Right column — "What's Included" callout card with bracket framing */}
        <div className="lg:col-span-6">
          <div className="relative">
            {/* Asymmetric corner brackets — Fig. motif on midnight */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -left-2 h-3 w-px bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -left-2 h-px w-3 bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -right-2 h-3 w-px bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-2 -right-2 h-px w-3 bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 -left-2 h-3 w-px bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 -left-2 h-px w-3 bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 -right-2 h-3 w-px bg-brand-300/40"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 -right-2 h-px w-3 bg-brand-300/40"
            />

            <div className="bg-midnight-700 p-8 md:p-12">
              <div className="flex items-baseline justify-between">
                <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-300">
                  Included in the system
                </p>
                <span className="font-body text-[10px] tracking-[0.24em] uppercase text-cream-300/50">
                  Fig. 09
                </span>
              </div>
              <span
                aria-hidden="true"
                className="mt-4 block h-px w-full bg-brand-300/15"
              />

              <ul className="mt-2" role="list">
                {INCLUDED.map((item, i) => (
                  <li key={item.number} className="group">
                    <div className="grid grid-cols-[auto_1fr] gap-x-6 py-6">
                      <span
                        className="font-display text-h2 italic leading-none text-brand-300/70 pt-1"
                        aria-hidden="true"
                      >
                        {item.number}
                      </span>
                      <div>
                        <p className="font-display text-h4 leading-tight text-cream-50">
                          {item.name}
                        </p>
                        <p className="mt-1 font-body text-caption text-cream-300">
                          {item.caption}
                        </p>
                      </div>
                    </div>
                    {i < INCLUDED.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="block h-px w-full bg-brand-300/10"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
