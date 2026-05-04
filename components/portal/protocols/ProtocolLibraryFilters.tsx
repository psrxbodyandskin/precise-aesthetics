"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Search, X } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  FITZPATRICK_TYPES,
  hasActiveFilters,
  parseFiltersFromSearchParams,
  serializeFilters,
  type FitzpatrickType,
  type ProtocolFilters,
} from "@/lib/portal/filters";
import { cn } from "@/lib/utils";

interface IndicationOption {
  id: string;
  title: string;
}

interface ProtocolLibraryFiltersProps {
  indications: IndicationOption[];
}

export function ProtocolLibraryFilters({
  indications,
}: ProtocolLibraryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Initial state from URL
  const initial = parseFiltersFromSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const [searchValue, setSearchValue] = useState(initial.search ?? "");
  const [indicationIds, setIndicationIds] = useState<string[]>(
    initial.indicationCategoryIds ?? [],
  );
  const [fitzTypes, setFitzTypes] = useState<FitzpatrickType[]>(
    (initial.fitzpatrickTypes ?? []).filter(isFitz),
  );

  // Debounced search — 300ms before pushing to URL
  useEffect(() => {
    const t = setTimeout(() => {
      pushFilters({
        search: searchValue || undefined,
        indicationCategoryIds: indicationIds.length > 0 ? indicationIds : undefined,
        fitzpatrickTypes: fitzTypes.length > 0 ? fitzTypes : undefined,
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Indication + Fitzpatrick changes push immediately
  function pushFilters(next: ProtocolFilters) {
    const qs = serializeFilters(next);
    startTransition(() => {
      router.replace(`/portal/protocols${qs}`);
    });
  }

  function toggleIndication(id: string) {
    const next = indicationIds.includes(id)
      ? indicationIds.filter((x) => x !== id)
      : [...indicationIds, id];
    setIndicationIds(next);
    pushFilters({
      search: searchValue || undefined,
      indicationCategoryIds: next.length > 0 ? next : undefined,
      fitzpatrickTypes: fitzTypes.length > 0 ? fitzTypes : undefined,
    });
  }

  function toggleFitz(t: FitzpatrickType) {
    const next = fitzTypes.includes(t)
      ? fitzTypes.filter((x) => x !== t)
      : [...fitzTypes, t];
    setFitzTypes(next);
    pushFilters({
      search: searchValue || undefined,
      indicationCategoryIds: indicationIds.length > 0 ? indicationIds : undefined,
      fitzpatrickTypes: next.length > 0 ? next : undefined,
    });
  }

  function clearAll() {
    setSearchValue("");
    setIndicationIds([]);
    setFitzTypes([]);
    startTransition(() => {
      router.replace("/portal/protocols");
    });
  }

  const active = hasActiveFilters({
    search: searchValue || undefined,
    indicationCategoryIds: indicationIds.length > 0 ? indicationIds : undefined,
    fitzpatrickTypes: fitzTypes.length > 0 ? fitzTypes : undefined,
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative w-full sm:w-[280px]">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          placeholder="Search protocols"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-10 bg-bone-50 border-ink-700/15 pl-9"
          aria-label="Search protocols by title"
          suppressHydrationWarning
        />
      </div>

      {/* Indication multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md border border-ink-700/15 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
              indicationIds.length > 0 && "border-brand-500/30",
            )}
          >
            <span>Indication</span>
            {indicationIds.length > 0 && (
              <span
                className="rounded-sm bg-brand-300/30 px-1.5 py-0.5 font-medium text-caption text-ink-900"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {indicationIds.length}
              </span>
            )}
            <ChevronDown
              className="size-3.5 text-ink-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72">
          {indications.length === 0 ? (
            <p className="font-body text-caption text-ink-500">
              No indications available yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {indications.map((i) => {
                const checked = indicationIds.includes(i.id);
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => toggleIndication(i.id)}
                      className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left transition-colors duration-[150ms] hover:bg-bone-100 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                    >
                      <span
                        className={cn(
                          "inline-flex size-4 shrink-0 items-center justify-center rounded-sm border",
                          checked
                            ? "border-brand-500 bg-brand-500 text-cream-50"
                            : "border-ink-700/30 bg-bone-50",
                        )}
                        aria-hidden="true"
                      >
                        {checked && (
                          <Check className="size-3" strokeWidth={2} />
                        )}
                      </span>
                      <span className="font-body text-small text-ink-900">
                        {i.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </PopoverContent>
      </Popover>

      {/* Fitzpatrick multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 items-center gap-2 rounded-md border border-ink-700/15 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
              fitzTypes.length > 0 && "border-brand-500/30",
            )}
          >
            <span>Fitzpatrick</span>
            {fitzTypes.length > 0 && (
              <span
                className="rounded-sm bg-brand-300/30 px-1.5 py-0.5 font-medium text-caption text-ink-900"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {fitzTypes.length}
              </span>
            )}
            <ChevronDown
              className="size-3.5 text-ink-500"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56">
          <ul className="space-y-1">
            {FITZPATRICK_TYPES.map((t) => {
              const checked = fitzTypes.includes(t);
              return (
                <li key={t}>
                  <button
                    type="button"
                    onClick={() => toggleFitz(t)}
                    className="flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-left transition-colors duration-[150ms] hover:bg-bone-100 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                  >
                    <span
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-sm border",
                        checked
                          ? "border-brand-500 bg-brand-500 text-cream-50"
                          : "border-ink-700/30 bg-bone-50",
                      )}
                      aria-hidden="true"
                    >
                      {checked && <Check className="size-3" strokeWidth={2} />}
                    </span>
                    <span className="font-body text-small text-ink-900">
                      Type {t}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {active && (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex h-10 items-center gap-1.5 px-2 font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  );
}

function isFitz(s: string): s is FitzpatrickType {
  return (FITZPATRICK_TYPES as readonly string[]).includes(s);
}
