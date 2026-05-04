"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InboxStatusChip } from "./InboxStatusChip";
import {
  INBOX_STATUSES,
  INBOX_STATUS_LABELS,
  type InboxItemTypeValue,
  type InboxStatusValue,
} from "@/lib/schemas/inbox";
import { cn } from "@/lib/utils";

interface StatusWorkflowControlProps {
  type: InboxItemTypeValue;
  id: string;
  status: InboxStatusValue;
  statusChangedAt: string | null;
  statusChangedByLabel?: string;
}

// Linear progression — direct jumps are still allowed via the dropdown.
const ORDER: InboxStatusValue[] = ["new", "contacted", "qualified", "closed"];

export function StatusWorkflowControl({
  type,
  id,
  status,
  statusChangedAt,
  statusChangedByLabel,
}: StatusWorkflowControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const idx = ORDER.indexOf(status);
  const prev = idx > 0 ? ORDER[idx - 1] : null;
  const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;

  function setStatus(target: InboxStatusValue) {
    setOpen(false);
    if (target === status) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/inbox/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not update status.");
        return;
      }
      toast.success(`Marked as ${INBOX_STATUS_LABELS[target]}.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={{ letterSpacing: "0.18em" }}
        >
          Status
        </span>
        <InboxStatusChip status={status} />
        {statusChangedAt && (
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={new Date(statusChangedAt).toLocaleString()}
          >
            Updated {formatRelative(statusChangedAt)}
            {statusChangedByLabel ? ` by ${statusChangedByLabel}` : ""}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prev && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setStatus(prev)}
            disabled={pending}
          >
            <ChevronLeft className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Move back to {INBOX_STATUS_LABELS[prev]}
          </Button>
        )}
        {next && (
          <Button
            type="button"
            size="sm"
            onClick={() => setStatus(next)}
            disabled={pending}
          >
            Advance to {INBOX_STATUS_LABELS[next]}
            <ChevronRight className="ml-1 size-3.5" strokeWidth={1.5} aria-hidden="true" />
          </Button>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Or change to
              <ChevronDown className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 p-1">
            {INBOX_STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-body text-small text-ink-900 hover:bg-bone-100",
                  s === status && "bg-bone-100",
                )}
              >
                {INBOX_STATUS_LABELS[s]}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
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
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}
