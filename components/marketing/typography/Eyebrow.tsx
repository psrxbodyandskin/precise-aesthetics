import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: ReactNode;
  tone?: "auto" | "ink" | "cream";
  className?: string;
  as?: "span" | "p" | "div";
}

export function Eyebrow({
  children,
  tone = "auto",
  className,
  as: Tag = "span",
}: EyebrowProps) {
  // P12.5 — A11y AA. brand-500 on bone-100 = 3.11:1, fails the 4.5:1
  // text contrast bar. Eyebrows are typography (not large) so the
  // floor applies. Bumped to brand-700 (~8:1) per CLAUDE.md known gotcha.
  const toneClass =
    tone === "ink" ? "text-brand-700" : tone === "cream" ? "text-brand-300" : "";
  const dataAttr = tone === "auto" ? { "data-tone-color": "auto-eyebrow" } : {};

  return (
    <Tag
      {...dataAttr}
      className={cn(
        "font-body text-overline tracking-overline font-medium uppercase",
        toneClass,
        className,
      )}
    >
      {children}
    </Tag>
  );
}
