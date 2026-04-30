import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BodyTextProps {
  size?: "default" | "small";
  className?: string;
  children: ReactNode;
}

export function BodyText({ size = "default", className, children }: BodyTextProps) {
  return (
    <p
      className={cn(
        "font-body leading-body",
        size === "small" ? "text-small" : "text-body max-w-[68ch]",
        className,
      )}
    >
      {children}
    </p>
  );
}
