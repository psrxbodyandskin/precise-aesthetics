import { Section } from "@/components/marketing/Section";
import { BoneBlooms } from "@/components/marketing/BoneBlooms";
import { cn } from "@/lib/utils";

interface PullQuoteSectionProps {
  /** Pull quote text — set in italic Fraunces, large. */
  pullQuote: React.ReactNode;
  /** Body content — typically a single <p> or fragment of <p>s. The first
   *  paragraph receives a Fraunces drop-cap on its first letter. */
  children: React.ReactNode;
  /** Figure number (e.g., "02") shown in the eyebrow plate. */
  figNumber: string;
  /** Optional eyebrow label override. Defaults to "Fig. {figNumber}". */
  eyebrowLabel?: string;
  /** Flip the column orientation: false = quote left/body right (default).
   *  true = body left/quote right. */
  flip?: boolean;
  /** Bone bloom variant key. */
  bloomVariant?: "thesis" | "outcomes" | "demo" | "lead" | "practitioner";
  /** Optional id for in-page anchors. */
  id?: string;
}

// Bone-100 editorial section: pull quote + body in a 2-up grid. The first
// paragraph of children receives a drop cap via the `dropcap-paragraph`
// CSS class (defined inline below). Reused on /system, /system/protocols,
// /system/delivery, /system/biologic-control, /system/data-intelligence.
export function PullQuoteSection({
  pullQuote,
  children,
  figNumber,
  eyebrowLabel,
  flip = false,
  bloomVariant = "thesis",
  id,
}: PullQuoteSectionProps) {
  const eyebrow = eyebrowLabel ?? `Fig. ${figNumber}`;
  return (
    <Section
      tone="bone"
      size="default"
      className="relative isolate overflow-hidden"
      id={id}
    >
      <BoneBlooms variant={bloomVariant} />

      {/* Eyebrow plate header */}
      <div className="relative flex items-center gap-3">
        <span
          aria-hidden="true"
          className="block h-px w-[60px] bg-brand-500"
        />
        <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
          § {eyebrow}
        </p>
      </div>

      {/* 2-up: pull quote + body */}
      <div className="relative mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Pull quote column */}
        <div className={cn("lg:col-span-6", flip ? "lg:order-2" : "lg:order-1")}>
          <div className="relative pl-6 md:pl-10">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-2 bottom-2 w-px bg-ink-900/40"
            />
            <p className="font-display italic leading-tight text-ink-900 text-[clamp(2.25rem,4vw+1rem,4rem)] tracking-display">
              {pullQuote}
            </p>
          </div>
        </div>

        {/* Body column. Consumer is responsible for applying the
            `first-letter:` drop-cap utilities to the first paragraph
            (see DropCapParagraph for a pre-styled helper). */}
        <div
          className={cn(
            "lg:col-span-6",
            flip ? "lg:order-1" : "lg:order-2",
          )}
        >
          {children}
        </div>
      </div>
    </Section>
  );
}
