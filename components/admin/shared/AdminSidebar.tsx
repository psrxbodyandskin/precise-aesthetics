"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  Building2,
  GraduationCap,
  History,
  Inbox,
  LayoutGrid,
  Library,
  LogOut,
  Server,
  Sparkles,
  Users,
} from "lucide-react";
import { NotificationBell } from "@/components/shared/notifications/NotificationBell";
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
  /** P11 — group items into sections with a divider between them. */
  section?: "main" | "ai";
}

interface AdminSidebarProps {
  newAdverseEventsCount?: number;
  newInboxCount?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutGrid, section: "main" },
  { href: "/admin/practices", label: "Practices", icon: Users, section: "main" },
  {
    href: "/admin/inbox",
    label: "Inbox",
    icon: Inbox,
    badgeKey: "inboxNew",
    section: "main",
  },
  {
    href: "/admin/adverse-events",
    label: "Adverse Events",
    icon: AlertCircle,
    badgeKey: "adverseEventsNew",
    section: "main",
  },
  { href: "/admin/protocols", label: "Protocols", icon: Library, section: "main" },
  { href: "/admin/training", label: "Training", icon: GraduationCap, section: "main" },
  // P13 — admin utilities (vendors + stack reference). Help chatbot is
  // a global floating button mounted in the admin layout, not a sidebar entry.
  { href: "/admin/vendors", label: "Vendors", icon: Building2, section: "main" },
  { href: "/admin/stack", label: "Stack", icon: Server, section: "main" },
  // P11 — AI tools section
  { href: "/admin/ai/query", label: "Query", icon: Sparkles, section: "ai" },
  { href: "/admin/ai/runs", label: "Runs", icon: History, section: "ai" },
  { href: "/admin/ai/cost", label: "Cost", icon: BarChart3, section: "ai" },
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
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
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
        <NotificationBell surface="admin" />
      </div>

      <nav className="flex flex-1 flex-row gap-1 md:flex-col">
        {NAV_ITEMS.map((item, idx) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const badge = badgeFor(item.badgeKey);
          const prevSection = idx > 0 ? NAV_ITEMS[idx - 1]?.section : undefined;
          const showAiHeading =
            item.section === "ai" && prevSection !== "ai";
          return (
            <div key={item.href} className="contents">
              {showAiHeading && (
                <div className="hidden md:block mt-4 pt-4 border-t border-cream-50/10">
                  <p
                    className="px-3 pb-2 font-body text-[10px] font-medium uppercase text-cream-300"
                    style={EYEBROW_TRACKING}
                  >
                    AI
                  </p>
                </div>
              )}
              <Link
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
            </div>
          );
        })}
      </nav>

      {/* Sign out — pinned bottom on desktop, inline on mobile */}
      <form
        action="/api/auth/logout?surface=admin"
        method="POST"
        className="mt-4 md:mt-auto md:pt-6 md:border-t md:border-cream-50/10"
      >
        <button
          type="submit"
          className="inline-flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-small font-medium text-cream-100 transition-colors duration-[150ms] hover:bg-cream-50/5 hover:text-cream-50 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          <LogOut
            className="size-4 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span className="flex-1 text-left">Sign out</span>
        </button>
      </form>
    </aside>
  );
}
