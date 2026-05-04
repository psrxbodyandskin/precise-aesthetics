"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, Inbox, LayoutGrid, Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Admin sidebar — extended each session as new features land. P2 ships
// Dashboard + Practices. P4 added Protocols. P6 adds Adverse Events
// with a "new" badge sourced from the layout. P8 adds Inbox between
// Practices and Adverse Events, with its own badge for status='new'
// items across leads + demo requests + contact messages.

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  /** Pulled from a layout-level prop. */
  badgeKey?: "adverseEventsNew" | "inboxNew";
}

interface AdminSidebarProps {
  newAdverseEventsCount?: number;
  newInboxCount?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/practices", label: "Practices", icon: Users },
  { href: "/admin/inbox", label: "Inbox", icon: Inbox, badgeKey: "inboxNew" },
  {
    href: "/admin/adverse-events",
    label: "Adverse Events",
    icon: AlertCircle,
    badgeKey: "adverseEventsNew",
  },
  { href: "/admin/protocols", label: "Protocols", icon: Library },
];

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function AdminSidebar({
  newAdverseEventsCount = 0,
  newInboxCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();

  function badgeFor(key: NavItem["badgeKey"]): number {
    if (key === "adverseEventsNew") return newAdverseEventsCount;
    if (key === "inboxNew") return newInboxCount;
    return 0;
  }

  return (
    <aside
      aria-label="Admin navigation"
      className="flex w-full flex-col border-b border-cream-50/10 bg-midnight-800 px-6 py-6 md:fixed md:top-0 md:left-0 md:h-screen md:w-[240px] md:border-b-0 md:border-r md:py-10"
    >
      <div className="mb-8">
        <p
          className="font-body text-[11px] font-medium uppercase text-cream-300"
          style={EYEBROW_TRACKING}
        >
          § Admin
        </p>
        <p className="mt-2 font-display text-[18px] leading-tight text-cream-50">
          Precise Aesthetics
        </p>
      </div>

      <nav className="flex flex-row gap-1 md:flex-col">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const badge = badgeFor(item.badgeKey);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-3 rounded-sm px-3 py-2.5 text-small font-medium transition-colors duration-[150ms]",
                active
                  ? "bg-cream-50/10 text-cream-50"
                  : "text-cream-100 hover:bg-cream-50/5 hover:text-cream-50",
              )}
            >
              <Icon
                className="size-4 shrink-0"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span
                  aria-label={`${badge} new`}
                  className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-300 px-1.5 font-body text-[10px] font-medium text-ink-900"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
