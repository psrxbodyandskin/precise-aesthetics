import { cn } from "@/lib/utils";
import type { VendorCategory } from "@/lib/schemas/vendor";

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  manufacturer: "Manufacturer",
  software_vendor: "Software vendor",
  service_provider: "Service provider",
  logistics: "Logistics",
  professional_services: "Professional services",
  other: "Other",
};

export function VendorCategoryChip({
  category,
  className,
}: {
  category: VendorCategory;
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
      {CATEGORY_LABEL[category]}
    </span>
  );
}
