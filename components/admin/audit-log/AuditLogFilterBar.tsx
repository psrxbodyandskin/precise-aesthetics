"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuditLogFilterBarProps {
  actionVerbs: Array<{ action: string; occurrences: number }>;
  targetTypes: Array<{ target_type: string; occurrences: number }>;
  practices: Array<{ id: string; name: string }>;
}

// P14 — sticky filter bar.
//
// All filter state lives in the URL — bookmarkable + shareable. Filter
// changes navigate via router.replace so the back button still goes
// to the previous page (not previous filter state).
//
// Practice filter footnote: we explicitly surface the matching limitation
// (target_type='practice' only — see P14 spec § 2 / KNOWN-GOTCHAS.md)
// when the operator picks a practice. The footnote is prominent, not
// hidden in a tooltip, so "fewer results than expected" doesn't get read
// as a bug.

export function AuditLogFilterBar({
  actionVerbs,
  targetTypes,
  practices,
}: AuditLogFilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  // Local mirror for the search input (debounced)
  const initialQ = params.get("q") ?? "";
  const [search, setSearch] = useState(initialQ);

  const actorRole = params.get("actor_role") ?? "";
  const action = params.get("action") ?? "";
  const targetType = params.get("target_type") ?? "";
  const practiceId = params.get("practice_id") ?? "";
  const dateFrom = params.get("date_from") ?? "";
  const dateTo = params.get("date_to") ?? "";

  const anyFilterActive = Boolean(
    initialQ ||
      actorRole ||
      action ||
      targetType ||
      practiceId ||
      dateFrom ||
      dateTo,
  );

  // Debounced search → URL
  useEffect(() => {
    if (search === initialQ) return;
    const t = setTimeout(() => {
      pushFilter({ q: search.trim() || null });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function pushFilter(patch: Record<string, string | null>) {
    const sp = new URLSearchParams();
    for (const [k, v] of params.entries()) {
      if (k in patch) continue; // skip — will be rewritten below
      if (k === "page") continue; // any filter change resets page to 1
      sp.append(k, v);
    }
    for (const [k, v] of Object.entries(patch)) {
      if (v !== null && v !== "") sp.set(k, v);
    }
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/audit-log?${qs}` : "/admin/audit-log");
    });
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.replace("/admin/audit-log"));
  }

  return (
    <div className="space-y-3 rounded-md border border-ink-700/15 bg-bone-50 p-4">
      {/* Row 1: search + date range */}
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <div>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, target, actor, or metadata"
            className="font-body text-small"
          />
        </div>
        <DateInput
          label="From"
          value={dateFrom}
          onChange={(v) => pushFilter({ date_from: v || null })}
        />
        <DateInput
          label="To"
          value={dateTo}
          onChange={(v) => pushFilter({ date_to: v || null })}
        />
      </div>

      {/* Row 2: dropdowns */}
      <div className="grid gap-3 md:grid-cols-4">
        <Field label="Actor">
          <Select
            value={actorRole || "_all"}
            onValueChange={(v) =>
              pushFilter({ actor_role: v === "_all" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field label="Action verb">
          <Select
            value={action || "_all"}
            onValueChange={(v) =>
              pushFilter({ action: v === "_all" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All actions</SelectItem>
              {actionVerbs.map((v) => (
                <SelectItem key={v.action} value={v.action}>
                  <span className="font-mono text-caption">{v.action}</span>
                  <span className="ml-2 text-ink-500">
                    ({v.occurrences})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Target type">
          <Select
            value={targetType || "_all"}
            onValueChange={(v) =>
              pushFilter({ target_type: v === "_all" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All targets</SelectItem>
              {targetTypes.map((t) => (
                <SelectItem key={t.target_type} value={t.target_type}>
                  {t.target_type}
                  <span className="ml-2 text-ink-500">
                    ({t.occurrences})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Practice">
          <Select
            value={practiceId || "_all"}
            onValueChange={(v) =>
              pushFilter({ practice_id: v === "_all" ? null : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All practices</SelectItem>
              {practices.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Practice-filter footnote (see P14 ambiguity #2 / KNOWN-GOTCHAS.md) */}
      {practiceId && (
        <p
          className={cn(
            "rounded-sm border border-[#B8862B]/30 bg-[#FBF4E3]/50 px-3 py-2",
            "font-body text-caption text-ink-700",
          )}
          style={{ lineHeight: 1.55 }}
        >
          <strong className="font-medium">Practice filter limitation:</strong>{" "}
          matches entries where the practice itself is the target (e.g.,{" "}
          <code className="font-mono">practice.invite</code>,{" "}
          <code className="font-mono">practice.activate</code>). Entries that
          reference a practice inside metadata are not captured here. Use the
          target id filter on a specific record to walk a full investigation.
        </p>
      )}

      {anyFilterActive && (
        <div className="flex items-center justify-between gap-3 border-t border-ink-700/10 pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-ink-500"
          >
            <X
              className="mr-1 size-3.5"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="mb-1 font-body text-overline font-medium uppercase text-ink-500"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p
        className="mb-1 font-body text-overline font-medium uppercase text-ink-500"
        style={{ letterSpacing: "0.18em" }}
      >
        {label}
      </p>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-body text-small"
      />
    </div>
  );
}
