import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ContainerWidth = "default" | "prose" | "narrow";

interface ContainerProps {
  width?: ContainerWidth;
  className?: string;
  children: ReactNode;
  as?: "div" | "section" | "article";
}

const widthClass: Record<ContainerWidth, string> = {
  default: "max-w-[1280px]",
  prose: "max-w-[720px]",
  narrow: "max-w-[560px]",
};

export function Container({
  width = "default",
  className,
  children,
  as: Tag = "div",
}: ContainerProps) {
  const Component: ElementType = Tag;
  return (
    <Component
      className={cn(
        "mx-auto px-6 md:px-10 lg:px-12",
        widthClass[width],
        className,
      )}
    >
      {children}
    </Component>
  );
}
