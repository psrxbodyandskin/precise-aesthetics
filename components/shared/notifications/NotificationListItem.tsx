"use client";

import Link from "next/link";

import { CategoryIcon } from "./CategoryIcon";
import {
  CATEGORY_META,
  type NotificationCategory,
} from "@/lib/schemas/notifications";
import { cn } from "@/lib/utils";

interface NotificationListItemProps {
  id: string;
  category: string;
  title: string;
  body?: string | null;
  linkPath?: string | null;
  createdAt: string;
  unread: boolean;
  /** Compact (dropdown) vs spacious (full page). */
  variant?: "panel" | "page";
  /** Surface — drives the mark-read endpoint path. */
  surface: "portal" | "admin";
  onMarkedRead?: (id: string) => void;
}

// Used by both the bell dropdown and the full notification list.
// Click → POST mark-read + navigate to link_path. Optimistic UI:
// caller passes onMarkedRead which removes the item from the
// local "unread" tally before the server round-trip resolves.
export function NotificationListItem({
  id,
  category,
  title,
  body,
  linkPath,
  createdAt,
  unread,
  variant = "panel",
  surface,
  onMarkedRead,
}: NotificationListItemProps) {
  const isPage = variant === "page";
  const cat = category as NotificationCategory;
  const meta = CATEGORY_META[cat];

  function handleClick() {
    if (unread) {
      onMarkedRead?.(id);
      const path =
        surface === "portal"
          ? `/api/portal/notifications/${id}/read`
          : `/api/admin/notifications/${id}/read`;
      // Fire-and-forget — UI already updated optimistically.
      fetch(path, { method: "POST" }).catch(() => {});
    }
  }

  const Wrapper: React.ElementType = linkPath ? Link : "div";
  const wrapperProps = linkPath
    ? { href: linkPath, onClick: handleClick }
    : { onClick: handleClick };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "block transition-colors duration-[150ms]",
        isPage
          ? "border-b border-ink-700/10 px-4 py-4 hover:bg-bone-100"
          : "px-4 py-3 hover:bg-bone-100",
        unread && "bg-brand-300/5",
        linkPath && "cursor-pointer",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            unread ? "bg-brand-700" : "bg-transparent",
          )}
        />
        <CategoryIcon
          category={cat}
          className="mt-0.5 size-4 shrink-0 text-ink-700"
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-body text-small text-ink-900 line-clamp-2",
              unread && "font-medium",
            )}
            style={{ lineHeight: 1.45 }}
          >
            {title}
          </p>
          {body && (
            <p
              className={cn(
                "mt-0.5 font-body text-caption text-ink-700",
                isPage ? "line-clamp-3" : "line-clamp-1",
              )}
              style={{ lineHeight: 1.5 }}
            >
              {body}
            </p>
          )}
          <p
            className="mt-1 font-body text-[11px] text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={new Date(createdAt).toLocaleString()}
          >
            {meta?.label ? `${meta.label} · ` : ""}
            {formatRelative(createdAt)}
          </p>
        </div>
      </div>
    </Wrapper>
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
