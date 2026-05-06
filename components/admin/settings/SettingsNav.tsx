"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

// P13.5 — sub-nav for /admin/settings/* routes.
// Renders a horizontal tab strip below the AdminPageHeader. Each
// settings page (account, notifications, stack) embeds this so the
// operator can jump between them without going back to the sidebar.

const TABS = [
  { href: "/admin/settings/account", label: "Account" },
  { href: "/admin/settings/notifications", label: "Notifications" },
  { href: "/admin/settings/stack", label: "Stack" },
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sub-navigation"
      className="border-b border-ink-700/15"
    >
      <ul className="flex flex-wrap items-end gap-1">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center px-3 font-body text-small font-medium transition-colors duration-[150ms]",
                  "border-b-2 -mb-px",
                  active
                    ? "border-midnight-800 text-ink-900"
                    : "border-transparent text-ink-500 hover:text-ink-900",
                  "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-t-sm",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
