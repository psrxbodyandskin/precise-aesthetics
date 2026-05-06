import { cn } from "@/lib/utils";
import type { VendorStatus } from "@/lib/schemas/vendor";

const LABEL: Record<VendorStatus, string> = {
  active: "Active",
  paused: "Paused",
  former: "Former",
};

const STYLE: Record<VendorStatus, string> = {
  active: "bg-brand-300/15 text-brand-700 ring-brand-700/25",
  paused: "bg-bone-200 text-ink-500 ring-ink-500/20",
  former: "bg-bone-200 text-ink-300 ring-ink-300/20",
};

export function VendorStatusChip({ status }: { status: VendorStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase ring-1 ring-inset",
        STYLE[status],
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {LABEL[status]}
    </span>
  );
}
