"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/portal/protocols", label: "Protocols" },
  { href: "/portal/treatments", label: "Treatments" },
  { href: "/portal/training", label: "Training" },
  // P10: { href: "/portal/notifications", label: "Notifications" },
];

// Portal primary nav. Single-row horizontal list under the identity
// header. Active link gets a brand-300 underline (no fill — keeps the
// chrome compact for chair-side use).
export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Portal primary navigation"
      className="border-t border-ink-700/10"
    >
      <ul className="flex flex-wrap items-center gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center px-3 font-body text-small font-medium transition-colors duration-[150ms] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm",
                  active
                    ? "text-ink-900 border-b-2 border-brand-500 -mb-px"
                    : "text-ink-700 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
