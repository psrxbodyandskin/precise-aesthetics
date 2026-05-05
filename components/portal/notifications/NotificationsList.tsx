"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NotificationListItem } from "@/components/shared/notifications/NotificationListItem";
import { EmptyNotificationsState } from "@/components/shared/notifications/EmptyNotificationsState";

interface NotificationItem {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link_path: string | null;
  created_at: string;
  read_at: string | null;
}

interface NotificationsListProps {
  items: NotificationItem[];
  surface: "portal" | "admin";
  filtered: boolean;
}

// Used by both /portal/notifications and /admin/notifications.
// Click → mark-as-read fires (optimistic) + navigate.
export function NotificationsList({
  items: initialItems,
  surface,
  filtered,
}: NotificationsListProps) {
  const [items, setItems] = useState(initialItems);
  const router = useRouter();

  function handleRead(id: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id && !it.read_at
          ? { ...it, read_at: new Date().toISOString() }
          : it,
      ),
    );
    // Refresh the page state so the unread filter view re-renders
    // correctly after a few items are removed from the list.
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <EmptyNotificationsState
        variant="page"
        message={filtered ? "No notifications match these filters." : "No notifications yet."}
      />
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50">
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
              variant="page"
              surface={surface}
              onMarkedRead={handleRead}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
