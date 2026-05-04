"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProtocolStatusChip } from "./ProtocolStatusChip";
import type { ProtocolStatus } from "@/lib/schemas/protocol";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface ProtocolRow {
  id: string;
  title: string;
  slug: string;
  status: ProtocolStatus;
  current_version: string | null;
  pending_major_bump: boolean;
  last_published_at: string | null;
  indication_categories: { id: string; title: string; slug: string } | null;
}

interface IndicationOption {
  id: string;
  title: string;
}

interface ProtocolsTableProps {
  protocols: ProtocolRow[];
  indications: IndicationOption[];
}

export function ProtocolsTable({
  protocols,
  indications,
}: ProtocolsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProtocolStatus | "all">(
    "all",
  );
  const [indicationFilter, setIndicationFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return protocols.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (
        indicationFilter !== "all" &&
        p.indication_categories?.id !== indicationFilter
      )
        return false;
      if (s.length > 0 && !p.title.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [protocols, search, statusFilter, indicationFilter]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_240px]">
        <Input
          type="search"
          placeholder="Search protocols by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 bg-bone-50 border-ink-700/35"
          suppressHydrationWarning
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ProtocolStatus | "all")}
        >
          <SelectTrigger
            className="h-11 bg-bone-50 border-ink-700/35"
            suppressHydrationWarning
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={indicationFilter}
          onValueChange={setIndicationFilter}
        >
          <SelectTrigger
            className="h-11 bg-bone-50 border-ink-700/35"
            suppressHydrationWarning
          >
            <SelectValue placeholder="Indication" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All indications</SelectItem>
            {indications.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
        <table className="w-full text-left text-small">
          <thead className="border-b border-ink-700/10">
            <tr>
              {["Title", "Indication", "Status", "Version", "Last published"].map(
                (h) => (
                  <th
                    key={h}
                    className="font-body text-overline font-medium uppercase text-ink-500 px-5 py-3"
                    style={EYEBROW_TRACKING}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center font-body text-ink-500"
                >
                  No protocols match these filters. Author the first one in
                  Sanity Studio.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-ink-700/10 last:border-0 transition-colors duration-[150ms] hover:bg-bone-100"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/protocols/${p.id}`}
                      className="font-body text-ink-900 hover:text-brand-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                    >
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-ink-700">
                    {p.indication_categories?.title ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <ProtocolStatusChip status={p.status} />
                  </td>
                  <td
                    className="px-5 py-4 text-ink-700"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {p.current_version ?? "—"}
                    {p.pending_major_bump && (
                      <span
                        className="ml-2 inline-flex items-center rounded-sm bg-[#FFF6D6] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[#7A5A00] ring-1 ring-inset ring-[#A8801F]/30"
                        style={EYEBROW_TRACKING}
                        title="Next publish will be a major version bump"
                      >
                        Major queued
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-ink-500">
                    {formatDate(p.last_published_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-caption text-ink-500">
        Showing {filtered.length} of {protocols.length} protocols.
      </p>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}
