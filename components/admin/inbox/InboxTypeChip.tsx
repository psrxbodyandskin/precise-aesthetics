import { Calendar, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INBOX_TYPE_LABELS,
  type InboxItemTypeValue,
} from "@/lib/schemas/inbox";

const TYPE_ICON: Record<InboxItemTypeValue, typeof Mail> = {
  lead: Mail,
  demo: Calendar,
  contact: MessageCircle,
};

interface InboxTypeChipProps {
  type: InboxItemTypeValue;
  className?: string;
}

export function InboxTypeChip({ type, className }: InboxTypeChipProps) {
  const Icon = TYPE_ICON[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-ink-700/15 bg-bone-100 px-2 py-1 font-body text-[11px] font-medium uppercase text-ink-700",
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      <Icon className="size-3" strokeWidth={1.75} aria-hidden="true" />
      {INBOX_TYPE_LABELS[type]}
    </span>
  );
}
