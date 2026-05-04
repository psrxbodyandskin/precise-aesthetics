import { AlertCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreatmentIndicatorsProps {
  photoCount: number;
  hasAdverseEvent: boolean;
  className?: string;
}

// Compact indicator strip for the treatments list — photo icon + adverse
// event icon. Shown on every row/card.
export function TreatmentIndicators({
  photoCount,
  hasAdverseEvent,
  className,
}: TreatmentIndicatorsProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {photoCount > 0 && (
        <span
          className="inline-flex items-center gap-1 rounded-sm border border-ink-700/15 bg-bone-100 px-1.5 py-0.5 font-body text-caption text-ink-700"
          title={`${photoCount} photo${photoCount === 1 ? "" : "s"} attached`}
        >
          <Camera className="size-3" strokeWidth={1.5} aria-hidden="true" />
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{photoCount}</span>
        </span>
      )}
      {hasAdverseEvent && (
        <span
          className="inline-flex items-center gap-1 rounded-sm bg-[#FBEAEA] px-1.5 py-0.5 font-body text-caption font-medium text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30"
          title="Adverse event flagged"
        >
          <AlertCircle className="size-3" strokeWidth={1.5} aria-hidden="true" />
          AE
        </span>
      )}
    </span>
  );
}
