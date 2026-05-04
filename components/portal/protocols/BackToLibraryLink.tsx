import Link from "next/link";
import { ChevronLeft } from "lucide-react";

// "Back to library" link. Hidden on print via the .print-hide utility.
export function BackToLibraryLink() {
  return (
    <Link
      href="/portal/protocols"
      className="print-hide inline-flex items-center gap-1.5 font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
    >
      <ChevronLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      Back to library
    </Link>
  );
}
