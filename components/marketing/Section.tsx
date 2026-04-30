import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container, type ContainerWidth } from "./Container";
import { Eyebrow } from "./typography/Eyebrow";
import type { SectionTone } from "./tone-context";

type SectionSize = "compact" | "default" | "hero";

interface SectionProps {
  tone?: SectionTone;
  size?: SectionSize;
  containerWidth?: ContainerWidth;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
  id?: string;
  as?: "section" | "div";
}

const toneClass: Record<SectionTone, string> = {
  bone: "bg-bone-100 text-ink-700",
  midnight: "bg-midnight-500 text-cream-100",
  "midnight-deep": "bg-midnight-800 text-cream-100",
  champagne: "bg-champagne-200 text-ink-900",
};

const headingColorClass: Record<SectionTone, string> = {
  bone: "[&_h1]:text-ink-900 [&_h2]:text-ink-900 [&_h3]:text-ink-900 [&_h4]:text-ink-900",
  midnight:
    "[&_h1]:text-cream-50 [&_h2]:text-cream-50 [&_h3]:text-cream-50 [&_h4]:text-cream-50",
  "midnight-deep":
    "[&_h1]:text-cream-50 [&_h2]:text-cream-50 [&_h3]:text-cream-50 [&_h4]:text-cream-50",
  champagne:
    "[&_h1]:text-ink-900 [&_h2]:text-ink-900 [&_h3]:text-ink-900 [&_h4]:text-ink-900",
};

const sizeClass: Record<SectionSize, string> = {
  compact: "py-12 md:py-16",
  default: "py-20 md:py-32",
  hero: "py-32 md:py-40",
};

export function Section({
  tone = "bone",
  size = "default",
  containerWidth = "default",
  eyebrow,
  className,
  children,
  id,
  as: Tag = "section",
}: SectionProps) {
  const Component: ElementType = Tag;
  return (
    <Component
      id={id}
      data-tone={tone}
      className={cn(toneClass[tone], headingColorClass[tone], sizeClass[size], className)}
    >
      <Container width={containerWidth}>
        {eyebrow && (
          <div className="mb-12 md:mb-14">
            <Eyebrow className="mb-3 md:mb-4 block">{eyebrow}</Eyebrow>
            <span
              data-tone-color="auto-divider"
              aria-hidden="true"
              className="block h-px w-[60px]"
            />
          </div>
        )}
        {children}
      </Container>
    </Component>
  );
}
