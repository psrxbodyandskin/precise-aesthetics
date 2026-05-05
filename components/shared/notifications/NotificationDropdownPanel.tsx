"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { NotificationListItem } from "./NotificationListItem";
import { EmptyNotificationsState } from "./EmptyNotificationsState";

interface NotificationDropdownPanelProps {
  surface: "portal" | "admin";
  /** Callback so the parent can clear the unread badge optimistically. */
  onCountChange?: (count: number) => void;
}

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link_path: string | null;
  created_at: string;
  read_at: string | null;
}

const fullListPath = (surface: "portal" | "admin") =>
  surface === "portal" ? "/portal/notifications" : "/admin/notifications";

const listPath = (surface: "portal" | "admin") =>
  surface === "portal"
    ? "/api/portal/notifications?pageSize=10"
    : "/api/admin/notifications?pageSize=10";

const markAllPath = (surface: "portal" | "admin") =>
  surface === "portal"
    ? "/api/portal/notifications/mark-all-read"
    : "/api/admin/notifications/mark-all-read";

export function NotificationDropdownPanel({
  surface,
  onCountChange,
}: NotificationDropdownPanelProps) {
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(listPath(surface))
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setItems([]);
          return;
        }
        setItems(data.items as NotificationItem[]);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [surface]);

  function markAllRead() {
    setPending(true);
    fetch(markAllPath(surface), { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.ok) {
          toast.error(data.error ?? "Could not mark all read.");
          return;
        }
        setItems((prev) =>
          prev
            ? prev.map((it) => ({
                ...it,
                read_at: it.read_at ?? new Date().toISOString(),
              }))
            : prev,
        );
        onCountChange?.(0);
      })
      .finally(() => setPending(false));
  }

  function handleItemRead(id: string) {
    setItems((prev) =>
      prev
        ? prev.map((it) =>
            it.id === id && !it.read_at
              ? { ...it, read_at: new Date().toISOString() }
              : it,
          )
        : prev,
    );
    onCountChange?.(Math.max(0, (items?.filter((i) => !i.read_at).length ?? 1) - 1));
  }

  return (
    <div className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-ink-700/15 bg-bone-50 shadow-lg">
      <div className="flex items-center justify-between gap-3 border-b border-ink-700/10 px-4 py-3">
        <p className="font-body text-small font-medium text-ink-900">
          Notifications
        </p>
        <button
          type="button"
          onClick={markAllRead}
          disabled={pending || !items || items.length === 0}
          className="font-body text-caption text-brand-700 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {items === null ? (
          <div className="px-4 py-6 text-center font-body text-caption text-ink-500">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <EmptyNotificationsState variant="panel" />
        ) : (
          <ul className="divide-y divide-ink-700/10">
            {items.map((it) => (
              <li key={it.id}>
                <NotificationListItem
                  id={it.id}
                  category={it.category}
                  title={it.title}
                  body={it.body}
                  linkPath={it.link_path}
                  createdAt={it.created_at}
                  unread={!it.read_at}
                  surface={surface}
                  onMarkedRead={handleItemRead}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-ink-700/10 px-4 py-3 text-center">
        <Link
          href={fullListPath(surface)}
          className="inline-flex items-center gap-1 font-body text-caption text-brand-700 underline-offset-2 hover:underline"
        >
          See all notifications
          <ArrowRight className="size-3" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
