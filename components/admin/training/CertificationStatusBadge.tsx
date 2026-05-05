import { cn } from "@/lib/utils";
import {
  CERTIFICATION_STATUS_LABELS,
  type CertificationStatus,
} from "@/lib/schemas/training";

const STATUS_STYLE: Record<CertificationStatus, string> = {
  in_progress:
    "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/15",
  certified:
    "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
  expired:
    "bg-bone-200 text-ink-500 ring-1 ring-inset ring-ink-500/20",
  revoked:
    "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
};

interface CertificationStatusBadgeProps {
  status: CertificationStatus | "not_started";
  className?: string;
}

export function CertificationStatusBadge({
  status,
  className,
}: CertificationStatusBadgeProps) {
  if (status === "not_started") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full bg-bone-200 px-2.5 py-1 font-body text-[11px] font-medium uppercase text-ink-500 ring-1 ring-inset ring-ink-500/20",
          className,
        )}
        style={{ letterSpacing: "0.08em" }}
      >
        Not started
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        STATUS_STYLE[status],
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {CERTIFICATION_STATUS_LABELS[status]}
    </span>
  );
}
