"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DashboardRange } from "@/lib/admin/dashboard";
import { cn } from "@/lib/utils";

const OPTIONS: Array<{ value: DashboardRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
  { value: "all", label: "All time" },
];

export function TimeRangeSelector({ current }: { current: DashboardRange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function setRange(next: DashboardRange) {
    if (next === current) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === "30d") params.delete("range");
    else params.set("range", next);
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/admin/dashboard${qs ? `?${qs}` : ""}`);
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Time range"
      className="inline-flex items-center gap-1 rounded-md border border-ink-700/15 bg-bone-50 p-1"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setRange(opt.value)}
            className={cn(
              "rounded-sm px-3 py-1.5 font-body text-caption font-medium transition-colors duration-[150ms] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
              active
                ? "bg-midnight-800 text-cream-50"
                : "text-ink-700 hover:text-ink-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
