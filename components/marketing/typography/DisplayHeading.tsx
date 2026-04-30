import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type DisplayLevel = "xl" | "lg" | "md";

interface DisplayHeadingProps {
  level?: DisplayLevel;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  balance?: boolean;
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<DisplayLevel, string> = {
  xl: "text-display-xl",
  lg: "text-display-lg",
  md: "text-display-md",
};

const defaultTag: Record<DisplayLevel, "h1" | "h2" | "h3" | "p" | "span" | "div"> = {
  xl: "h1",
  lg: "h2",
  md: "h3",
};

export function DisplayHeading({
  level = "lg",
  as,
  balance = true,
  className,
  children,
}: DisplayHeadingProps) {
  const Tag: ElementType = as ?? defaultTag[level];
  return (
    <Tag
      className={cn(
        "font-display font-normal tracking-display leading-display",
        sizeClass[level],
        balance && "text-balance",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
