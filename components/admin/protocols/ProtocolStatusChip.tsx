import type { ProtocolStatus } from "@/lib/schemas/protocol";
import { cn } from "@/lib/utils";

interface ProtocolStatusChipProps {
  status: ProtocolStatus;
  className?: string;
}

const STATUS_LABEL: Record<ProtocolStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

const STATUS_STYLE: Record<ProtocolStatus, string> = {
  draft: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/20",
  published: "bg-[#E5F1EA] text-[#1F5A37] ring-1 ring-inset ring-[#2D7A4F]/30",
  archived: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

const EYEBROW_TRACKING = { letterSpacing: "0.08em" } as const;

export function ProtocolStatusChip({
  status,
  className,
}: ProtocolStatusChipProps) {
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
