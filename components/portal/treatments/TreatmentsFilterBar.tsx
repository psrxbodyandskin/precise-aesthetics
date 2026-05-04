"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FITZPATRICK_TYPES,
  hasActiveTreatmentFilters,
  parseTreatmentFiltersFromSearchParams,
  serializeTreatmentFilters,
  type FitzpatrickType,
  type TreatmentFilters,
} from "@/lib/portal/filters";
import { cn } from "@/lib/utils";

interface ProtocolOption {
  id: string;
  title: string;
  current_version: string | null;
}

interface TreatmentsFilterBarProps {
  protocols: ProtocolOption[];
  indications: string[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Sticky filter bar on /portal/treatments. Desktop renders the controls
// inline. Mobile (<md) renders a "Filters" trigger that opens a Sheet
// with the same controls. Clear filters link surfaces only when any
// filter is active.
export function TreatmentsFilterBar({
  protocols,
  indications,
}: TreatmentsFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const initial = parseTreatmentFiltersFromSearchParams(
    Object.fromEntries(searchParams.entries()),
  );
  const [search, setSearch] = useState(initial.search ?? "");
  const [dateFrom, setDateFrom] = useState(initial.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial.dateTo ?? "");
  const [protocolIds, setProtocolIds] = useState<string[]>(
    initial.protocolIds ?? [],
  );
  const [indicationVals, setIndicationVals] = useState<string[]>(
    initial.indications ?? [],
  );
  const [fitzTypes, setFitzTypes] = useState<FitzpatrickType[]>(
    initial.fitzpatrickTypes ?? [],
  );
  const [hasPhotos, setHasPhotos] = useState(initial.hasPhotos ?? false);
  const [hasAdverse, setHasAdverse] = useState(
    initial.hasAdverseEvent ?? false,
  );

  // Debounced URL sync for search; immediate for everything else
  useEffect(() => {
    const t = setTimeout(() => pushAll(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function build(): TreatmentFilters {
    return {
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      protocolIds: protocolIds.length > 0 ? protocolIds : undefined,
      indications: indicationVals.length > 0 ? indicationVals : undefined,
      fitzpatrickTypes: fitzTypes.length > 0 ? fitzTypes : undefined,
      hasPhotos: hasPhotos || undefined,
      hasAdverseEvent: hasAdverse || undefined,
    };
  }

  function pushAll() {
    const qs = serializeTreatmentFilters(build());
    startTransition(() => {
      router.replace(`/portal/treatments${qs}`);
    });
  }

  function toggleProtocol(id: string) {
    const next = protocolIds.includes(id)
      ? protocolIds.filter((x) => x !== id)
      : [...protocolIds, id];
    setProtocolIds(next);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), protocolIds: next.length > 0 ? next : undefined })}`,
      );
    });
  }
  function toggleIndication(v: string) {
    const next = indicationVals.includes(v)
      ? indicationVals.filter((x) => x !== v)
      : [...indicationVals, v];
    setIndicationVals(next);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), indications: next.length > 0 ? next : undefined })}`,
      );
    });
  }
  function toggleFitz(t: FitzpatrickType) {
    const next = fitzTypes.includes(t)
      ? fitzTypes.filter((x) => x !== t)
      : [...fitzTypes, t];
    setFitzTypes(next);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), fitzpatrickTypes: next.length > 0 ? next : undefined })}`,
      );
    });
  }
  function setDateFromImmediate(v: string) {
    setDateFrom(v);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), dateFrom: v || undefined })}`,
      );
    });
  }
  function setDateToImmediate(v: string) {
    setDateTo(v);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), dateTo: v || undefined })}`,
      );
    });
  }
  function setHasPhotosImmediate(v: boolean) {
    setHasPhotos(v);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), hasPhotos: v || undefined })}`,
      );
    });
  }
  function setHasAdverseImmediate(v: boolean) {
    setHasAdverse(v);
    startTransition(() => {
      router.replace(
        `/portal/treatments${serializeTreatmentFilters({ ...build(), hasAdverseEvent: v || undefined })}`,
      );
    });
  }

  function clearAll() {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setProtocolIds([]);
    setIndicationVals([]);
    setFitzTypes([]);
    setHasPhotos(false);
    setHasAdverse(false);
    startTransition(() => {
      router.replace("/portal/treatments");
    });
  }

  const active = hasActiveTreatmentFilters(build());

  // Shared inner controls (desktop inline + mobile sheet body)
  const SearchInput = (
    <div className="relative w-full sm:w-[280px]">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
        strokeWidth={1.5}
      />
      <Input
        type="search"
        placeholder="Search notes, site, entered by"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-10 bg-bone-50 border-ink-700/15 pl-9"
        aria-label="Search treatments"
        suppressHydrationWarning
      />
    </div>
  );

  const DateRange = (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(e) => setDateFromImmediate(e.target.value)}
        className="h-10 bg-bone-50 border-ink-700/15"
        aria-label="Date from"
        suppressHydrationWarning
      />
      <span className="font-body text-caption text-ink-500">to</span>
      <Input
        type="date"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => setDateToImmediate(e.target.value)}
        className="h-10 bg-bone-50 border-ink-700/15"
        aria-label="Date to"
        suppressHydrationWarning
      />
    </div>
  );

  const ProtocolFilter = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md border border-ink-700/15 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
            protocolIds.length > 0 && "border-brand-500/30",
          )}
        >
          Protocol
          {protocolIds.length > 0 && (
            <CountBadge n={protocolIds.length} />
          )}
          <ChevronDown
            className="size-3.5 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-h-72 overflow-y-auto">
        {protocols.length === 0 ? (
          <p className="font-body text-caption text-ink-500">
            No protocols logged yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {protocols.map((p) => (
              <li key={p.id}>
                <CheckboxButton
                  checked={protocolIds.includes(p.id)}
                  onClick={() => toggleProtocol(p.id)}
                  label={
                    <>
                      {p.title}
                      {p.current_version && (
                        <span
                          className="ml-2 font-body text-caption text-ink-500"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          v{p.current_version}
                        </span>
                      )}
                    </>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );

  const IndicationFilter = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md border border-ink-700/15 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
            indicationVals.length > 0 && "border-brand-500/30",
          )}
        >
          Indication
          {indicationVals.length > 0 && (
            <CountBadge n={indicationVals.length} />
          )}
          <ChevronDown
            className="size-3.5 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 max-h-72 overflow-y-auto">
        {indications.length === 0 ? (
          <p className="font-body text-caption text-ink-500">
            No indications logged yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {indications.map((i) => (
              <li key={i}>
                <CheckboxButton
                  checked={indicationVals.includes(i)}
                  onClick={() => toggleIndication(i)}
                  label={i}
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );

  const FitzFilter = (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-md border border-ink-700/15 bg-bone-50 px-3 font-body text-small text-ink-900 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
            fitzTypes.length > 0 && "border-brand-500/30",
          )}
        >
          Fitzpatrick
          {fitzTypes.length > 0 && <CountBadge n={fitzTypes.length} />}
          <ChevronDown
            className="size-3.5 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <ul className="space-y-1">
          {FITZPATRICK_TYPES.map((t) => (
            <li key={t}>
              <CheckboxButton
                checked={fitzTypes.includes(t)}
                onClick={() => toggleFitz(t)}
                label={`Type ${t}`}
              />
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );

  const Toggles = (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleChip
        label="Has photos"
        active={hasPhotos}
        onChange={setHasPhotosImmediate}
      />
      <ToggleChip
        label="Adverse event"
        active={hasAdverse}
        onChange={setHasAdverseImmediate}
      />
    </div>
  );

  const ClearLink = active && (
    <button
      type="button"
      onClick={clearAll}
      className="inline-flex h-10 items-center gap-1.5 px-2 font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
    >
      <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
      Clear filters
    </button>
  );

  return (
    <>
      {/* Desktop inline bar */}
      <div className="hidden flex-wrap items-center gap-3 md:flex">
        {SearchInput}
        {DateRange}
        {ProtocolFilter}
        {IndicationFilter}
        {FitzFilter}
        {Toggles}
        {ClearLink}
      </div>

      {/* Mobile trigger + sheet */}
      <div className="flex items-center gap-2 md:hidden">
        {SearchInput}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-shrink-0"
            >
              <SlidersHorizontal
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Filters
              {active && <CountBadge n={countActive(build())} />}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full max-w-[420px] overflow-y-auto bg-bone-100"
          >
            <SheetHeader>
              <SheetTitle className="font-display">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6 px-1">
              <FilterSection label="Date range">{DateRange}</FilterSection>
              <FilterSection label="Protocol">{ProtocolFilter}</FilterSection>
              <FilterSection label="Indication">
                {IndicationFilter}
              </FilterSection>
              <FilterSection label="Fitzpatrick">{FitzFilter}</FilterSection>
              <FilterSection label="Indicators">{Toggles}</FilterSection>
              {active && (
                <div className="pt-2 border-t border-ink-700/10">
                  <button
                    type="button"
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 font-body text-small text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                  >
                    <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span
      className="rounded-sm bg-brand-300/30 px-1.5 py-0.5 font-medium text-caption text-ink-900"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {n}
    </span>
  );
}

function CheckboxButton({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <span className="font-body text-small text-ink-900">{label}</span>
    </button>
  );
}

function ToggleChip({
  label,
  active,
  onChange,
}: {
  label: string;
  active: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 items-center rounded-md border px-3 font-body text-small font-medium transition-colors duration-[150ms] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
        active
          ? "border-brand-500/40 bg-brand-300/20 text-ink-900"
          : "border-ink-700/15 bg-bone-50 text-ink-700 hover:border-ink-700/30",
      )}
    >
      {label}
    </button>
  );
}

function FilterSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500 mb-2"
        style={EYEBROW_TRACKING}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function countActive(f: TreatmentFilters): number {
  let n = 0;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  if (f.protocolIds?.length) n++;
  if (f.indications?.length) n++;
  if (f.fitzpatrickTypes?.length) n++;
  if (f.hasPhotos) n++;
  if (f.hasAdverseEvent) n++;
  return n;
}
