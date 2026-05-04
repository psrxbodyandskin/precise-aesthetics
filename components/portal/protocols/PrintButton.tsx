"use client";

import { Printer } from "lucide-react";

// Triggers the browser print dialog. Hidden via the .print-hide
// utility in print stylesheets so it doesn't render on paper.
export function PrintButton() {
  function handleClick() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="print-hide inline-flex items-center gap-1.5 rounded-sm border border-ink-700/15 bg-bone-50 px-3 py-1.5 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
      suppressHydrationWarning
    >
      <Printer className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      Print
    </button>
  );
}
