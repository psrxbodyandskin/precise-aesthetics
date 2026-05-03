"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PRACTICE_STATUSES,
  type PracticeStatus,
} from "@/lib/schemas/practice";
import { StatusChip } from "./StatusChip";

export interface PracticeRowData {
  id: string;
  name: string;
  primary_email: string;
  status: PracticeStatus;
  created_at: string;
}

interface PracticesTableProps {
  practices: PracticeRowData[];
  total: number;
  initialStatus: PracticeStatus | "all";
  initialSearch: string;
}

const inputClass =
  "h-10 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";
const selectTriggerClass = cn(
  "w-full sm:w-[180px] !h-10 text-small",
  "bg-bone-50 border-ink-700/35 text-ink-900 data-[placeholder]:text-ink-500",
);
const selectContentClass =
  "border bg-bone-50 border-ink-700/35 text-ink-900 shadow-lg";
const selectItemClass =
  "text-small text-ink-900 focus:bg-bone-200 focus:text-ink-900";

const STATUS_OPTIONS: ReadonlyArray<{ value: PracticeStatus | "all"; label: string }> = [
  { value: "all", label: "All statuses" },
  ...PRACTICE_STATUSES.map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
];

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Practices list table with search + status filter. Pagination ignored for
// P2 (page size 50; admin opens detail per-row). Adds in P7 if it's needed.
export function PracticesTable({
  practices,
  total,
  initialStatus,
  initialSearch,
}: PracticesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<PracticeStatus | "all">(initialStatus);

  function applyFilters(nextSearch: string, nextStatus: PracticeStatus | "all") {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextSearch.trim().length > 0) params.set("search", nextSearch.trim());
    const qs = params.toString();
    router.push(`/admin/practices${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters(search, status);
            }}
            placeholder={"Search by name or email"}
            className={cn(inputClass, "pl-9")}
            suppressHydrationWarning
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            const next = v as PracticeStatus | "all";
            setStatus(next);
            applyFilters(search, next);
          }}
        >
          <SelectTrigger className={selectTriggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className={selectContentClass}>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className={selectItemClass}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {practices.length === 0 ? (
        <div className="rounded-md border border-ink-700/15 bg-bone-50 p-12 text-center">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={{ letterSpacing: "0.18em" }}
          >
            No practices
          </p>
          <p className="mt-3 font-display text-h3 leading-heading text-ink-900">
            Nothing here yet.
          </p>
          <p className="mt-3 font-body text-body leading-body text-ink-700 max-w-[44ch] mx-auto">
            Provision the first practice account to begin.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/practices/new"
              className="inline-flex h-11 items-center rounded-md bg-midnight-800 px-6 font-body font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700"
            >
              + New practice
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-md border border-ink-700/15">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink-700/15 bg-bone-50">
                  <Th>Practice</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {practices.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-ink-700/10 last:border-b-0 hover:bg-bone-50/60"
                  >
                    <Td>
                      <Link
                        href={`/admin/practices/${p.id}`}
                        className="font-medium text-ink-900 hover:underline"
                      >
                        {p.name}
                      </Link>
                    </Td>
                    <Td className="text-ink-700">{p.primary_email}</Td>
                    <Td>
                      <StatusChip status={p.status} />
                    </Td>
                    <Td className="text-ink-500">{formatDate(p.created_at)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-body text-caption text-ink-500">
            Showing {practices.length} of {total}.
          </p>
        </>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
      style={{ letterSpacing: "0.12em" }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-4 font-body text-small text-ink-700",
        className,
      )}
    >
      {children}
    </td>
  );
}
