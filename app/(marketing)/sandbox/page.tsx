/**
 * Internal design-system sandbox.
 * Not linked from production navigation. Direct URL only.
 * Demonstrates every primitive built in Session 3.
 */

import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/marketing/Container";
import { Section } from "@/components/marketing/Section";
import { Logo } from "@/components/marketing/Logo";
import { Button } from "@/components/ui/button";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Heading } from "@/components/marketing/typography/Heading";
import { Lead } from "@/components/marketing/typography/Lead";
import { BodyText } from "@/components/marketing/typography/BodyText";
import { Eyebrow } from "@/components/marketing/typography/Eyebrow";
import { TrademarkSymbol } from "@/components/marketing/typography/TrademarkSymbol";

export const metadata: Metadata = {
  title: "Design System Sandbox",
  robots: { index: false, follow: false },
};

type ButtonVariant =
  | "primary"
  | "primary-on-dark"
  | "secondary"
  | "secondary-on-dark"
  | "champagne"
  | "ghost"
  | "ghost-on-dark";

const BUTTON_SIZES = ["sm", "md", "lg"] as const;

export default function SandboxPage() {
  return (
    <div className="pt-24 md:pt-28">
      <Section tone="bone" size="compact" eyebrow="Internal — Sandbox">
        <DisplayHeading level="md">Design system review.</DisplayHeading>
        <Lead className="mt-6">
          Every primitive built in Session 3, in every relevant variant. Not linked from
          production navigation.
        </Lead>
      </Section>

      {/* 1. Section tone matrix */}
      <Section tone="bone" eyebrow="01 · Section tones">
        <Heading level={2}>One section per tone.</Heading>
        <BodyText className="mt-4">
          Each tone provides its own background, body color, eyebrow accent, and heading
          color via the `data-tone` cascade.
        </BodyText>
      </Section>

      <Section tone="bone" size="compact" eyebrow="Bone tone">
        <DisplayHeading level="md">Predictable outcomes.</DisplayHeading>
        <Lead className="mt-6">Default page background. Ink-700 body, ink-900 headings.</Lead>
        <div className="mt-8">
          <Button variant="primary">Request a demonstration</Button>
        </div>
      </Section>

      <Section tone="midnight" size="compact" eyebrow="Midnight tone">
        <DisplayHeading level="md">Built for every shade.</DisplayHeading>
        <Lead className="mt-6">Hero / luxury sections. Cream-100 body, cream-50 headings.</Lead>
        <div className="mt-8">
          <Button variant="primary-on-dark">Request a demonstration</Button>
        </div>
      </Section>

      <Section tone="midnight-deep" size="compact" eyebrow="Midnight-deep tone">
        <DisplayHeading level="md">The deepest navy.</DisplayHeading>
        <Lead className="mt-6">Reserved for premium moments and footer.</Lead>
        <div className="mt-8">
          <Button variant="primary-on-dark">Request a demonstration</Button>
        </div>
      </Section>

      <Section tone="champagne" size="compact" eyebrow="Champagne tone">
        <DisplayHeading level="md">By invitation.</DisplayHeading>
        <Lead className="mt-6">
          Use sparingly. Reserved for premium and scarcity moments — launch CTA, &quot;invitation
          only&quot; badges, key trademarks. Demonstrated once on this page.
        </Lead>
        <div className="mt-8">
          <Button variant="primary">Request an invitation</Button>
        </div>
      </Section>

      {/* 2. Typography scale */}
      <Section tone="bone" eyebrow="02 · Typography scale">
        <DisplayHeading level="xl">Display XL</DisplayHeading>
        <DisplayHeading level="lg" as="h2" className="mt-6">
          Display LG
        </DisplayHeading>
        <DisplayHeading level="md" as="h3" className="mt-6">
          Display MD
        </DisplayHeading>
        <Heading level={1} className="mt-12">
          Heading 1
        </Heading>
        <Heading level={2} className="mt-4">
          Heading 2
        </Heading>
        <Heading level={3} className="mt-4">
          Heading 3
        </Heading>
        <Heading level={4} className="mt-4">
          Heading 4
        </Heading>
        <Lead className="mt-12">
          Lead paragraph. Used for hero subheadlines and section intros. Max width 58ch for
          rhythm.
        </Lead>
        <BodyText className="mt-6">
          Body text. The default paragraph style — Inter 17px on a 1.6 line-height, max 68ch.
          Skin of every shade.
        </BodyText>
        <BodyText size="small" className="mt-4">
          Small body text. Captions and secondary copy. Inter 15px.
        </BodyText>
        <Eyebrow className="mt-8 block">Eyebrow on bone</Eyebrow>
      </Section>

      <Section tone="midnight" eyebrow="Type on midnight">
        <DisplayHeading level="lg">Display on midnight.</DisplayHeading>
        <Lead className="mt-6">
          Headings inherit cream-50, body inherits cream-100. Eyebrows shift to brand-300.
        </Lead>
        <BodyText className="mt-6">
          Body text on midnight. The contrast ratio against midnight-500 is well above the
          AA 4.5:1 requirement.
        </BodyText>
      </Section>

      {/* 3. Button matrix */}
      <Section tone="bone" eyebrow="03 · Button matrix — bone background">
        <BodyText className="mb-8">
          Primary, secondary, champagne, ghost — sized sm / md / lg. The on-dark variants
          appear in the midnight matrix below.
        </BodyText>
        <div className="space-y-10">
          {(["primary", "secondary", "champagne", "ghost"] as const).map((variant) => (
            <ButtonRow key={variant} variant={variant} />
          ))}
          <div>
            <Eyebrow className="mb-3 block">Disabled / loading</Eyebrow>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" disabled>
                Disabled
              </Button>
              <Button variant="primary" loading>
                Submitting
              </Button>
              <Button asChild variant="secondary">
                <Link href="/demo">As Link (asChild)</Link>
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="midnight" eyebrow="Buttons on midnight">
        <div className="space-y-10">
          {(["primary-on-dark", "secondary-on-dark", "ghost-on-dark"] as const).map(
            (variant) => (
              <ButtonRow key={variant} variant={variant} dark />
            ),
          )}
        </div>
      </Section>

      {/* 4. Logo matrix */}
      <Section tone="bone" eyebrow="04 · Logo matrix">
        <Heading level={3} className="mb-6">
          On bone
        </Heading>
        <div className="flex flex-wrap items-center gap-12">
          <Logo variant="horizontal" tone="navy" href={null} />
          <Logo variant="horizontal" tone="black" href={null} />
          <Logo variant="monogram-circle" tone="navy" href={null} />
          <Logo variant="monogram" tone="navy" href={null} />
        </div>
      </Section>

      <Section tone="midnight" eyebrow="Logos on midnight">
        <Heading level={3} className="mb-6">
          On midnight
        </Heading>
        <div className="flex flex-wrap items-center gap-12">
          <Logo variant="horizontal" tone="cream" href={null} />
          <Logo variant="horizontal" tone="white" href={null} />
          <Logo variant="monogram-circle" tone="cream" href={null} />
          <Logo variant="monogram" tone="cream" href={null} />
        </div>
      </Section>

      {/* 5. Eyebrow tone test */}
      <Section tone="bone" eyebrow="05 · Eyebrow auto-tone">
        <BodyText>
          Eyebrows above each section header use `tone=&quot;auto&quot;` and read the section&apos;s
          `data-tone` attribute via CSS. Notice the eyebrow color changes between bone and
          midnight sections above.
        </BodyText>
      </Section>

      {/* 6. Trademark symbol */}
      <Section tone="bone" eyebrow="06 · Trademark symbol">
        <BodyText>
          Inline ™ at full size, no superscript: Precise Aesthetics
          <TrademarkSymbol /> · The Precise System
          <TrademarkSymbol /> · Precise Pico
          <TrademarkSymbol /> · PIH Prevention Protocol
          <TrademarkSymbol />.
        </BodyText>
      </Section>

      <div className="bg-bone-100 py-12">
        <Container>
          <BodyText size="small" className="text-ink-500">
            Internal sandbox — not linked from production navigation. Remove or restrict
            before launch.
          </BodyText>
        </Container>
      </div>
    </div>
  );
}

function ButtonRow({
  variant,
  dark = false,
}: {
  variant: ButtonVariant;
  dark?: boolean;
}) {
  return (
    <div>
      <Eyebrow tone={dark ? "cream" : "ink"} className="mb-3 block">
        {variant}
      </Eyebrow>
      <div className="flex flex-wrap items-center gap-4">
        {BUTTON_SIZES.map((size) => (
          <Button key={size} variant={variant} size={size}>
            Request a demo
          </Button>
        ))}
      </div>
    </div>
  );
}
