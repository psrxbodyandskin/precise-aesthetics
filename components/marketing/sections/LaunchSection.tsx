import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";
import { Button } from "@/components/ui/button";

// Champagne is sanctioned here per BRAND-IDENTITY §5.2 — three uses on this
// page only: eyebrow accent, invitation card hairline, primary CTA button.
export function LaunchSection() {
  return (
    <Section
      tone="midnight-deep"
      size="default"
      id="launch"
      className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_55%_70%_at_50%_50%,_#1F2F4F_0%,_#0C1426_72%)]"
    >
      {/* Film-grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.6'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      <div className="relative flex flex-col items-center text-center">
        {/* Editorial section header — champagne use #1 */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="block h-px w-[60px] bg-champagne-200/50"
          />
          <span className="font-body text-overline tracking-overline font-medium uppercase text-champagne-200">
            § By invitation
          </span>
          <span
            aria-hidden="true"
            className="block h-px w-[60px] bg-champagne-200/50"
          />
        </div>

        <DisplayHeading
          level="lg"
          as="h2"
          className="mt-10 max-w-[16ch] text-cream-50"
        >
          The Precise System<TrademarkSymbol /> launches August 8, 2026.
        </DisplayHeading>
        <Lead className="mt-8 text-cream-100 mx-auto">
          An evening of clinical demonstrations and conversation at the Civic
          Opera Building, Chicago. Attendance is by invitation only.
        </Lead>

        {/* Decorative ornament — single hairline asterisk */}
        <span
          aria-hidden="true"
          className="mt-10 font-display text-h2 leading-none text-champagne-200/60 select-none"
        >
          &middot;
        </span>

        {/* Invitation card — champagne use #2 (full hairline frame).
            Bone surface against midnight, large Fraunces date.
            Champagne hairline border on all four sides plus inset corner
            brackets — printed-invitation feel. */}
        <div className="mt-10 w-full max-w-md">
          <div className="relative bg-bone-100 px-10 py-12 md:px-12 md:py-14">
            {/* Full champagne hairline frame — all four edges */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-champagne-400/60"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-champagne-400/60"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-6 left-0 w-px bg-champagne-400/60"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-6 right-0 w-px bg-champagne-400/60"
            />

            {/* Asymmetric inset corner brackets — editorial accent */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 h-3 w-px bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 h-px w-3 bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 right-3 h-3 w-px bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 right-3 h-px w-3 bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 h-3 w-px bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 h-px w-3 bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 h-3 w-px bg-champagne-400/80"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 h-px w-3 bg-champagne-400/80"
            />

            {/* Editorial Fig. caption */}
            <span
              aria-hidden="true"
              className="absolute top-5 right-7 font-body text-[10px] tracking-[0.24em] uppercase text-ink-500"
            >
              Fig. 10
            </span>
            <p className="font-body text-overline tracking-overline font-medium uppercase text-ink-500">
              Civic Opera Building &middot; Chicago
            </p>
            <p className="mt-6 font-display italic leading-none tracking-display text-ink-900 text-[clamp(2.5rem,3vw+1rem,3.75rem)]">
              August 8
            </p>
            <p className="mt-1 font-display text-h2 leading-tight tracking-heading text-ink-900">
              2026
            </p>
            <span
              aria-hidden="true"
              className="mt-8 block h-px w-[60px] bg-ink-700/30"
            />
            <p className="mt-6 font-body text-caption italic text-ink-500">
              By invitation only
            </p>
          </div>
        </div>

        {/* Champagne use #3 — primary CTA */}
        <div className="mt-12">
          <Button asChild variant="champagne" size="lg">
            <Link href="/launch">Request an invitation</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
