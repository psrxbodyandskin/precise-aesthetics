"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Section } from "@/components/marketing/Section";
import { DisplayHeading } from "@/components/marketing/typography/DisplayHeading";
import { Lead } from "@/components/marketing/typography/Lead";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <Section tone="midnight-deep" size="hero" containerWidth="prose">
      <p className="font-body text-overline tracking-overline uppercase text-cream-100/80">
        Something interrupted
      </p>
      <DisplayHeading level="lg" as="h1" className="mt-8">
        We couldn&rsquo;t load this page.
      </DisplayHeading>
      <Lead className="mt-8 text-cream-100">
        The issue has been recorded. Try again, or return to the teaser to
        follow the launch.
      </Lead>
      <div className="mt-12 flex flex-col gap-4 sm:flex-row">
        <Button variant="primary-on-dark" size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="secondary-on-dark" size="lg">
          <Link href="/">Return to home</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-10 font-mono text-caption text-cream-100/60">
          Reference: {error.digest}
        </p>
      )}
    </Section>
  );
}
