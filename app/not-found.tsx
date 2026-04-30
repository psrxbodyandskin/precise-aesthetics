import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found — Precise Aesthetics",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Section tone="midnight-deep" size="hero" containerWidth="prose">
      <p className="font-body text-overline tracking-overline uppercase text-cream-100/80">
        404
      </p>
      <DisplayHeading level="lg" as="h1" className="mt-8">
        This page isn&rsquo;t here.
      </DisplayHeading>
      <Lead className="mt-8 text-cream-100">
        The link may be outdated or the page hasn&rsquo;t been published yet.
        Return to the teaser to follow the launch.
      </Lead>
      <div className="mt-12">
        <Button asChild variant="primary-on-dark" size="lg">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
    </Section>
  );
}
