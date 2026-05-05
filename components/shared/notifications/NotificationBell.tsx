"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationDropdownPanel } from "./NotificationDropdownPanel";
import { UnreadBadge } from "./UnreadBadge";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  surface: "portal" | "admin";
  /** Override the default 60s poll cadence (useful for tests). */
  pollIntervalMs?: number;
  className?: string;
}

const unreadPath = (surface: "portal" | "admin") =>
  surface === "portal"
    ? "/api/portal/notifications/unread-count"
    : "/api/admin/notifications/unread-count";

// P10 — bell with poll-based unread count.
//   - Polls every 60s when the tab is foreground (visibility API).
//   - Pauses when backgrounded; immediate refresh on visibility return.
//   - Optimistic count updates from the dropdown panel via
//     onCountChange (mark-all-read, mark-single-read).
export function NotificationBell({
  surface,
  pollIntervalMs = 60_000,
  className,
}: NotificationBellProps) {
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    fetch(unreadPath(surface), { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && typeof data.count === "number") {
          setCount(data.count);
        }
      })
      .catch(() => {});
  }, [surface]);

  // Initial fetch + polling lifecycle
  useEffect(() => {
    refresh();

    function startPolling() {
      stopPolling();
      intervalRef.current = setInterval(refresh, pollIntervalMs);
    }
    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
    };
  }, [refresh, pollIntervalMs]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={
            count > 0 ? `Notifications (${count} unread)` : "Notifications"
          }
          className={cn(
            "relative inline-flex size-9 items-center justify-center rounded-sm text-ink-700 transition-colors duration-[150ms] hover:bg-ink-100/40 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
            surface === "admin" && "text-cream-100 hover:bg-cream-50/10 hover:text-cream-50",
            className,
          )}
        >
          <Bell className="size-5" strokeWidth={1.5} aria-hidden="true" />
          <UnreadBadge count={count} overlay />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <NotificationDropdownPanel
          surface={surface}
          onCountChange={(n) => setCount(n)}
        />
      </PopoverContent>
    </Popover>
  );
}
