"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface InboxPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function InboxPagination({ page, pageSize, total }: InboxPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function goTo(nextPage: number) {
    const next = Math.max(1, Math.min(totalPages, nextPage));
    if (next === page) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 1) params.delete("page");
    else params.set("page", String(next));
    const qs = params.toString();
    startTransition(() => {
      router.replace(`/admin/inbox${qs ? `?${qs}` : ""}`);
    });
  }

  const pageNumbers: Array<number | "…"> = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    const filtered = Array.from(set)
      .filter((n) => n >= 1 && n <= totalPages)
      .sort((a, b) => a - b);
    const out: Array<number | "…"> = [];
    for (let i = 0; i < filtered.length; i++) {
      const n = filtered[i]!;
      out.push(n);
      const next = filtered[i + 1];
      if (typeof next === "number" && next - n > 1) out.push("…");
    }
    return out;
  })();

  return (
    <nav
      aria-label="Inbox pagination"
      className="mt-6 flex items-center justify-between gap-3"
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-ink-700/15 bg-bone-50 px-3 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
        Prev
      </button>

      <ul className="hidden items-center gap-1 md:flex">
        {pageNumbers.map((n, i) =>
          n === "…" ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1 font-body text-caption text-ink-500"
            >
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                onClick={() => goTo(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-sm border px-2.5 font-body text-caption font-medium transition-colors duration-[150ms] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
                  n === page
                    ? "border-brand-500/40 bg-brand-300/20 text-ink-900"
                    : "border-ink-700/15 bg-bone-50 text-ink-700 hover:border-ink-700/35 hover:text-ink-900",
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>

      <span
        className="font-body text-caption text-ink-500 md:hidden"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {page} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-ink-700/15 bg-bone-50 px-3 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </nav>
  );
}
