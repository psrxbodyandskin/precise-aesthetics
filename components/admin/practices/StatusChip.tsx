import type { PracticeStatus } from "@/lib/schemas/practice";
import { cn } from "@/lib/utils";

interface StatusChipProps {
  status: PracticeStatus;
  className?: string;
}

const STATUS_LABEL: Record<PracticeStatus, string> = {
  
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
};

const STATUS_STYLE: Record<PracticeStatus, string> = {
  pending: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/20",
  active: "bg-[#E5F1EA] text-[#1F5A37] ring-1 ring-inset ring-[#2D7A4F]/30",
  suspended: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  archived: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

const EYEBROW_TRACKING = { letterSpacing: "0.08em" } as const;

// Small uppercase status chip. Used in the practices list table and on
// the detail page header.
export function StatusChip({ status, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        STATUS_STYLE[status],
        className,
      )}
      style={EYEBROW_TRACKING}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
