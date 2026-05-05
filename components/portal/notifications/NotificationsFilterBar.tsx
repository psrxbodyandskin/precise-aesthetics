"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationsFilterBarProps {
  basePath: string;
  surface: "portal" | "admin";
}

export function NotificationsFilterBar({
  basePath,
  surface,
}: NotificationsFilterBarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const unreadOnly = params.get("unread") === "1";

  function setUnread(next: boolean) {
    const sp = new URLSearchParams(params.toString());
    if (next) sp.set("unread", "1");
    else sp.delete("unread");
    sp.delete("page");
    const qs = sp.toString();
    startTransition(() => {
      router.replace(qs ? `${basePath}?${qs}` : basePath);
    });
  }

  async function markAllRead() {
    const path =
      surface === "portal"
        ? "/api/portal/notifications/mark-all-read"
        : "/api/admin/notifications/mark-all-read";
    const res = await fetch(path, { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not mark all read.");
      return;
    }
    toast.success("All notifications marked read.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="tablist" aria-label="Filter by status" className="flex gap-1">
        <Pill active={!unreadOnly} onSelect={() => setUnread(false)}>
          All
        </Pill>
        <Pill active={unreadOnly} onSelect={() => setUnread(true)}>
          Unread
        </Pill>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={markAllRead}
        disabled={pending}
      >
        Mark all as read
      </Button>
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
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        "inline-flex h-9 items-center rounded-sm border px-3 font-body text-small font-medium transition-colors duration-[150ms]",
        active
          ? "border-midnight-800 bg-midnight-800 text-cream-50"
          : "border-ink-100 bg-bone-100 text-ink-700 hover:border-ink-700/35",
      )}
    >
      {children}
    </button>
  );
}
