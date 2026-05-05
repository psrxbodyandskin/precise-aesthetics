import { cn } from "@/lib/utils";
import {
  TRAINING_CONTENT_STATUS_LABELS,
  type TrainingContentStatus,
} from "@/lib/schemas/training";

const STATUS_STYLE: Record<TrainingContentStatus, string> = {
  draft: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/15",
  published:
    "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
  archived: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

interface TrainingStatusChipProps {
  status: TrainingContentStatus;
  className?: string;
}

export function TrainingStatusChip({
  status,
  className,
}: TrainingStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        STATUS_STYLE[status],
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {TRAINING_CONTENT_STATUS_LABELS[status]}
    </span>
  );
}
