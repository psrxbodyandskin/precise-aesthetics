"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const AGENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "pattern_analyst", label: "Pattern" },
  { value: "protocol_drafter", label: "Protocol" },
  { value: "practice_health_reviewer", label: "Health" },
  { value: "communication_drafter", label: "Comm" },
  { value: "query_assistant", label: "Query" },
  { value: "lead_enricher", label: "Enricher" },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" },
];

export function RunsFilterBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const selectedAgents = new Set(params.getAll("agent_type"));
  const selectedStatuses = new Set(params.getAll("status"));

  function toggleAgent(value: string) {
    const sp = new URLSearchParams();
    // Preserve other params
    for (const [k, v] of params.entries()) {
      if (k !== "agent_type" && k !== "page") sp.append(k, v);
    }
    const next = new Set(selectedAgents);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    for (const v of next) sp.append("agent_type", v);
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/ai/runs?${qs}` : "/admin/ai/runs");
    });
  }

  function toggleStatus(value: string) {
    const sp = new URLSearchParams();
    for (const [k, v] of params.entries()) {
      if (k !== "status" && k !== "page") sp.append(k, v);
    }
    const next = new Set(selectedStatuses);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    for (const v of next) sp.append("status", v);
    startTransition(() => {
      const qs = sp.toString();
      router.replace(qs ? `/admin/ai/runs?${qs}` : "/admin/ai/runs");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Agent:
        </span>
        {AGENT_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={selectedAgents.has(opt.value)}
            onSelect={() => toggleAgent(opt.value)}
          >
            {opt.label}
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
        {STATUS_OPTIONS.map((opt) => (
          <Pill
            key={opt.value}
            active={selectedStatuses.has(opt.value)}
            onSelect={() => toggleStatus(opt.value)}
          >
            {opt.label}
          </Pill>
        ))}
      </div>
    </div>
  );
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
