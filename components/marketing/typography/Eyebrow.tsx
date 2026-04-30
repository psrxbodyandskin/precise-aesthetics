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
  const toneClass =
    tone === "ink" ? "text-brand-500" : tone === "cream" ? "text-brand-300" : "";
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
