"use client";

import Link from "next/link";

import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type AgentRunRow = Database["public"]["Tables"]["agent_runs"]["Row"];

interface RunsTableProps {
  items: AgentRunRow[];
}

const HEADER_TRACKING = { letterSpacing: "0.18em" } as const;

const STATUS_STYLE: Record<AgentRunRow["status"], string> = {
  pending: "bg-bone-200 text-ink-500 ring-1 ring-inset ring-ink-500/20",
  success:
    "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
  failed: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  cancelled: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

const AGENT_LABEL: Record<AgentRunRow["agent_type"], string> = {
  pattern_analyst: "Pattern analyst",
  protocol_drafter: "Protocol drafter",
  practice_health_reviewer: "Practice health",
  communication_drafter: "Comm drafter",
  query_assistant: "Query assistant",
  lead_enricher: "Lead enricher",
  help_assistant: "Help",
};

export function RunsTable({ items }: RunsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-6 py-10 text-center">
        <p className="font-body text-ink-700">No agent runs yet.</p>
        <p className="mt-2 font-body text-caption text-ink-500">
          Trigger an agent from the dashboard or inbox to see runs here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50">
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-700/10 text-left">
              <Th>Time</Th>
              <Th>Agent</Th>
              <Th>Trigger</Th>
              <Th>Status</Th>
              <Th>Cost</Th>
              <Th>Latency</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr
                key={r.id}
                className="border-b border-ink-700/5 last:border-b-0 transition-colors duration-[150ms] hover:bg-bone-100"
              >
                <Td>
                  <Link
                    href={`/admin/ai/runs/${r.id}`}
                    className="block hover:text-brand-700"
                  >
                    <span
                      className="font-body text-caption text-ink-700"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                      title={new Date(r.created_at).toLocaleString()}
                    >
                      {formatRelative(r.created_at)}
                    </span>
                  </Link>
                </Td>
                <Td>
                  <Link
                    href={`/admin/ai/runs/${r.id}`}
                    className="block hover:text-brand-700"
                  >
                    {AGENT_LABEL[r.agent_type]}
                  </Link>
                </Td>
                <Td>
                  <span className="font-body text-caption text-ink-500">
                    {r.trigger_type === "auto" ? "auto" : "manual"}
                  </span>
                </Td>
                <Td>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium uppercase",
                      STATUS_STYLE[r.status],
                    )}
                    style={{ letterSpacing: "0.08em" }}
                  >
                    {r.status}
                  </span>
                </Td>
                <Td mono>
                  {r.cost_usd !== null
                    ? `$${Number(r.cost_usd).toFixed(4)}`
                    : "—"}
                </Td>
                <Td mono>
                  {r.latency_ms !== null
                    ? `${(r.latency_ms / 1000).toFixed(1)}s`
                    : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-ink-700/10 md:hidden">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href={`/admin/ai/runs/${r.id}`}
              className="block px-4 py-4 transition-colors duration-[150ms] hover:bg-bone-100"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-small font-medium text-ink-900">
                  {AGENT_LABEL[r.agent_type]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium uppercase",
                    STATUS_STYLE[r.status],
                  )}
                  style={{ letterSpacing: "0.08em" }}
                >
                  {r.status}
                </span>
              </div>
              <p
                className="mt-1 font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatRelative(r.created_at)}
                {r.cost_usd !== null
                  ? ` · $${Number(r.cost_usd).toFixed(4)}`
                  : ""}
                {r.latency_ms !== null
                  ? ` · ${(r.latency_ms / 1000).toFixed(1)}s`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
      style={HEADER_TRACKING}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  mono,
}: {
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <td
      className="px-4 py-3 align-top font-body text-small text-ink-900"
      style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
    >
      {children}
    </td>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}
