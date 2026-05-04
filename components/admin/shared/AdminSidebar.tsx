"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Library, Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Admin sidebar — extended each session as new features land. P2 ships
// Dashboard + Practices. Future sessions append to NAV_ITEMS rather
// than restructuring.
//
// Editorial register: midnight-800 surface, cream-100 text, brand-300
// active accent. Sidebar is fixed-width on desktop, hidden under a
// hamburger on mobile (mobile drawer lands in a future session — for P2,
// the mobile experience is "scroll the sidebar above content").

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/protocols", label: "Protocols", icon: Library },
  { href: "/admin/practices", label: "Practices", icon: Users },
];

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function AdminSidebar() {
  const pathname = usePathname();

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
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
