import { cn } from "@/lib/utils";

interface UnreadBadgeProps {
  count: number;
  className?: string;
  /** Bell-overlay style — small floating dot/chip at top-right of icon. */
  overlay?: boolean;
}

// Numbered chip when count > 0, dot when overlay-style with no
// number, hidden when count is 0. Tabular nums so 1/2/3 don't
// shift width.
export function UnreadBadge({
  count,
  className,
  overlay = false,
}: UnreadBadgeProps) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} unread`}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-brand-700 px-1.5 font-body text-[10px] font-medium text-cream-50",
        overlay
          ? "absolute -right-1 -top-1 h-4 min-w-[1rem] ring-2 ring-bone-100"
          : "h-5 min-w-[1.25rem]",
        className,
      )}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {display}
    </span>
  );
}
