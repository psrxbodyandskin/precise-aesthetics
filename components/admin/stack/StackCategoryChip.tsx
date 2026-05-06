import { cn } from "@/lib/utils";
import type { StackCategory } from "@/lib/schemas/stack";

const LABEL: Record<StackCategory, string> = {
  hosting: "Hosting",
  database: "Database",
  auth: "Auth",
  email: "Email",
  cms: "CMS",
  ai: "AI",
  analytics: "Analytics",
  monitoring: "Monitoring",
  storage: "Storage",
  domain: "Domain",
  payment: "Payment",
  other: "Other",
};

export function StackCategoryChip({
  category,
  className,
}: {
  category: StackCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/15",
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {LABEL[category]}
    </span>
  );
}

export const STACK_CATEGORY_LABEL = LABEL;
