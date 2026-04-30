import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LeadProps {
  className?: string;
  children: ReactNode;
}

export function Lead({ className, children }: LeadProps) {
  return (
    <p
      className={cn(
        "font-body text-lead leading-body max-w-[58ch]",
        className,
      )}
    >
      {children}
    </p>
  );
}
