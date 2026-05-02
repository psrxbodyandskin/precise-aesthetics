import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { BodyText } from "@/components/marketing/typography/BodyText";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoCta() {
  return (
    <Section
      tone="bone"
      size="default"
      className="relative isolate overflow-hidden"
    >
      <BoneBlooms variant="demo" />

      <div className="relative flex flex-col items-center text-center">
        {/* Editorial plate header — closing rhythm */}
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="block h-px w-[60px] bg-brand-700/60"
          />
          <span className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
            § Ready to see the system
          </span>
          <span
            aria-hidden="true"
            className="block h-px w-[60px] bg-brand-700/60"
          />
        </div>

        <DisplayHeading level="md" as="h2" className="mt-10 max-w-[18ch]">
          Schedule a demonstration.
        </DisplayHeading>

        <Lead className="mt-8 text-ink-700">
          We work with practitioners across dermatology, plastic surgery, and
          aesthetic practices. Demonstrations begin at launch. Reserve your
          slot now.
        </Lead>

        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
          <Button asChild variant="primary" size="lg">
            <Link href="/demo">Request a demonstration</Link>
          </Button>
          <Link
            href="#updates"
            className={cn(
              "inline-flex items-center gap-2",
              "font-body text-small text-ink-700 hover:text-ink-900",
              "transition-colors duration-[150ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
            )}
          >
            <span>Or get launch updates</span>
            <ArrowRight
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Restrained closing paragraph — what a demo covers, in one breath */}
        <BodyText className="mt-12 max-w-[58ch] text-center text-ink-700">
          A demonstration covers the device, the protocol library, the biologic
          control system, and the data intelligence layer &mdash; together.
          Allow roughly 45 minutes.
        </BodyText>
      </div>
    </Section>
  );
}
