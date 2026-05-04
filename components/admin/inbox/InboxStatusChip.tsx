import { cn } from "@/lib/utils";
import {
  INBOX_STATUS_LABELS,
  type InboxStatusValue,
} from "@/lib/schemas/inbox";

const STATUS_STYLE: Record<InboxStatusValue, string> = {
  // new: error tint — urgent attention (matches adverse events 'new')
  new: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  // contacted: brand tint — in progress
  contacted:
    "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
  // qualified: ink with brand-300 dot — strong, advancing
  qualified: "bg-bone-200 text-ink-900 ring-1 ring-inset ring-ink-700/15",
  // closed: muted — deprioritized
  closed: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

interface InboxStatusChipProps {
  status: InboxStatusValue;
  className?: string;
}

export function InboxStatusChip({ status, className }: InboxStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        STATUS_STYLE[status],
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {status === "qualified" && (
        <span
          aria-hidden="true"
          className="inline-block size-1.5 rounded-full bg-brand-300"
        />
      )}
      {INBOX_STATUS_LABELS[status]}
    </span>
  );
}
