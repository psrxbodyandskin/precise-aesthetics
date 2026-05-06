"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface AuditLogPaginationProps {
  page: number;
  pageSize: number;
  total: number;
}

export function AuditLogPagination({
  page,
  pageSize,
  total,
}: AuditLogPaginationProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  function goTo(target: number) {
    const next = Math.max(1, Math.min(totalPages, target));
    if (next === page) return;
    const sp = new URLSearchParams(params.toString());
    if (next === 1) sp.delete("page");
    else sp.set("page", String(next));
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/audit-log?${qs}` : "/admin/audit-log");
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p
        className="font-body text-caption text-ink-500"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </p>
      <div className="flex items-center gap-1">
        <PageButton
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft
            className="size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </PageButton>
        <span
          className="px-2 font-body text-caption text-ink-700"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {page} / {totalPages}
        </span>
        <PageButton
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight
            className="size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  ...rest
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
} & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-sm border border-ink-700/15 bg-bone-50 text-ink-700",
        "transition-colors duration-[150ms] hover:border-ink-700/35",
        "disabled:opacity-40 disabled:hover:border-ink-700/15",
        "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
