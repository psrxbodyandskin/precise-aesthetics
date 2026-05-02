import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4;
type HeadingTag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface HeadingProps {
  level: HeadingLevel;
  as?: HeadingTag;
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<HeadingLevel, string> = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
  4: "text-h4",
};

const defaultTag: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

export function Heading({ level, as, className, children }: HeadingProps) {
  const Tag: HeadingTag = as ?? defaultTag[level];
  return (
    <Tag
      className={cn(
        "font-display tracking-heading leading-heading",
        sizeClass[level],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
