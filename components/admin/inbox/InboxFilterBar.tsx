"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  hasActiveInboxFilters,
  parseInboxFiltersFromSearchParams,
  serializeInboxFilters,
} from "@/lib/admin/inbox-filters";
import {
  INBOX_ITEM_TYPES,
  INBOX_STATUSES,
  INBOX_STATUS_LABELS,
  INBOX_TYPE_LABELS,
  type InboxItemTypeValue,
  type InboxStatusValue,
} from "@/lib/schemas/inbox";
import { cn } from "@/lib/utils";

interface InboxFilterBarProps {
  counts: {
    all: number;
    lead: number;
    demo: number;
    contact: number;
  };
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function InboxFilterBar({ counts }: InboxFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const filters = parseInboxFiltersFromSearchParams(
    Object.fromEntries(searchParams.entries()),
  );

  const [search, setSearch] = useState(filters.search ?? "");
  const [statusOpen, setStatusOpen] = useState(false);

  // Debounced search → URL push.
  useEffect(() => {
    const handle = setTimeout(() => {
      const nextSearch = search.trim() ? search.trim() : undefined;
      if ((filters.search ?? "") === (nextSearch ?? "")) return;
      const qs = serializeInboxFilters({ search: nextSearch, page: 1 }, filters);
      startTransition(() => {
        router.push(qs ? `/admin/inbox?${qs}` : "/admin/inbox");
      });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function selectType(type: InboxItemTypeValue | "all") {
    const qs = serializeInboxFilters({ type, page: 1 }, filters);
    startTransition(() => {
      router.push(qs ? `/admin/inbox?${qs}` : "/admin/inbox");
    });
  }

  function selectStatus(status: InboxStatusValue | "all") {
    setStatusOpen(false);
    const qs = serializeInboxFilters({ status, page: 1 }, filters);
    startTransition(() => {
      router.push(qs ? `/admin/inbox?${qs}` : "/admin/inbox");
    });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push("/admin/inbox"));
  }

  const allLabel =
    filters.status === "all" ? "All statuses" : INBOX_STATUS_LABELS[filters.status];

  const showClear = hasActiveInboxFilters(filters);

  return (
    <div className="space-y-3">
      {/* Type pills (scroll horizontally on mobile) */}
      <div
        role="tablist"
        aria-label="Filter by type"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        <TypePill
          active={filters.type === "all"}
          label="All"
          count={counts.all}
          onSelect={() => selectType("all")}
        />
        {INBOX_ITEM_TYPES.map((t) => (
          <TypePill
            key={t}
            active={filters.type === t}
            label={INBOX_TYPE_LABELS[t]}
            count={counts[t]}
            onSelect={() => selectType(t)}
          />
        ))}
      </div>

      {/* Status filter + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Status
          </p>
          <Popover open={statusOpen} onOpenChange={setStatusOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/35 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
              >
                <span>{allLabel}</span>
                <ChevronDown className="size-4 text-ink-500" strokeWidth={1.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1">
              <button
                type="button"
                onClick={() => selectStatus("all")}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-body text-small text-ink-900 hover:bg-bone-100",
                  filters.status === "all" && "bg-bone-100",
                )}
              >
                All statuses
              </button>
              {INBOX_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => selectStatus(s)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-body text-small text-ink-900 hover:bg-bone-100",
                    filters.status === s && "bg-bone-100",
                  )}
                >
                  {INBOX_STATUS_LABELS[s]}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {showClear && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-9 items-center gap-1 rounded-sm px-2 font-body text-small text-ink-500 hover:text-ink-900"
            >
              <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
            aria-label="Search inbox"
          />
        </div>
      </div>
    </div>
  );
}

function TypePill({
  active,
  label,
  count,
  onSelect,
}: {
  active: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-sm border px-3 py-1.5 font-body text-small font-medium transition-colors duration-[150ms]",
        active
          ? "border-midnight-800 bg-midnight-800 text-cream-50"
          : "border-ink-100 bg-bone-100 text-ink-700 hover:border-ink-700/35",
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-medium",
          active ? "bg-cream-50/15 text-cream-50" : "bg-bone-50 text-ink-500",
        )}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {count}
      </span>
    </button>
  );
}
