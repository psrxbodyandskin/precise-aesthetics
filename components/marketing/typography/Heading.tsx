import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingProps {
  level: HeadingLevel;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

const sizeClass: Record<HeadingLevel, string> = {
  1: "text-h1",
  2: "text-h2",
  3: "text-h3",
  4: "text-h4",
};

const defaultTag: Record<HeadingLevel, ElementType> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

export function Heading({ level, as, className, children }: HeadingProps) {
  const Tag: ElementType = as ?? defaultTag[level];
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
