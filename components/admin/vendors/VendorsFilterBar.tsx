"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from "@/lib/schemas/vendor";

const CATEGORY_LABEL: Record<string, string> = {
  manufacturer: "Manufacturer",
  software_vendor: "Software",
  service_provider: "Service",
  logistics: "Logistics",
  professional_services: "Pro services",
  other: "Other",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  paused: "Paused",
  former: "Former",
};

export function VendorsFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const initialQ = params.get("q") ?? "";
  const [search, setSearch] = useState(initialQ);
  const selectedCategories = new Set(params.getAll("category"));
  const selectedStatuses = new Set(params.getAll("status"));

  // Debounced URL sync for search; immediate for everything else
  useEffect(() => {
    if (search === initialQ) return;
    const t = setTimeout(() => {
      const sp = buildParams({
        q: search.trim() || undefined,
        category: Array.from(selectedCategories),
        status: Array.from(selectedStatuses),
      });
      startTransition(() => {
        const qs = sp.toString();
        router.replace(qs ? `/admin/vendors?${qs}` : "/admin/vendors");
      });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function toggleCategory(value: string) {
    const next = new Set(selectedCategories);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const sp = buildParams({
      q: search.trim() || undefined,
      category: Array.from(next),
      status: Array.from(selectedStatuses),
    });
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/vendors?${qs}` : "/admin/vendors");
    });
  }

  function toggleStatus(value: string) {
    const next = new Set(selectedStatuses);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const sp = buildParams({
      q: search.trim() || undefined,
      category: Array.from(selectedCategories),
      status: Array.from(next),
    });
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/vendors?${qs}` : "/admin/vendors");
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors by name, contact, email, notes…"
          className="w-full rounded-sm border border-ink-700/20 bg-bone-50 px-3 py-2 font-body text-small text-ink-900 placeholder:text-ink-300 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Category:
        </span>
        {VENDOR_CATEGORIES.map((cat) => (
          <Pill
            key={cat}
            active={selectedCategories.has(cat)}
            onSelect={() => toggleCategory(cat)}
          >
            {CATEGORY_LABEL[cat] ?? cat}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Status:
        </span>
        {VENDOR_STATUSES.map((s) => (
          <Pill
            key={s}
            active={selectedStatuses.has(s)}
            onSelect={() => toggleStatus(s)}
          >
            {STATUS_LABEL[s] ?? s}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function buildParams(data: {
  q?: string;
  category: string[];
  status: string[];
}): URLSearchParams {
  const sp = new URLSearchParams();
  if (data.q) sp.set("q", data.q);
  for (const c of data.category) sp.append("category", c);
  for (const s of data.status) sp.append("status", s);
  return sp;
}

function Pill({
  active,
  onSelect,
  children,
}: {
  active: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "inline-flex h-8 items-center rounded-sm border px-2.5 font-body text-caption font-medium transition-colors duration-[150ms]",
        active
          ? "border-midnight-800 bg-midnight-800 text-cream-50"
          : "border-ink-100 bg-bone-100 text-ink-700 hover:border-ink-700/35",
      )}
    >
      {children}
    </button>
  );
}
