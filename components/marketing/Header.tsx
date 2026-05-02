"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type HeaderTone = "dark" | "light";

interface HeaderProps {
  /**
   * Forced tone at scroll-top. If omitted, the Header auto-detects the first
   * `[data-tone]` element inside <main> and uses light for bone/champagne,
   * dark for midnight/midnight-deep.
   */
  defaultTone?: HeaderTone;
}

interface SubItem {
  href: string;
  label: string;
  /** Short caption shown below the label inside the dropdown panel. [DRAFT — copy approval] */
  caption: string;
}

interface NavItem {
  href: string;
  label: string;
  /** Optional dropdown items. When present, "The System" expands to overview + four pillars. */
  children?: SubItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/system",
    label: "The System",
    children: [
      // [DRAFT — copy approval] dropdown captions
      { href: "/system", label: "Overview", caption: "The architecture and manifesto" },
      { href: "/system/protocols", label: "Protocols", caption: "The clinical IP at the center" },
      { href: "/system/delivery", label: "Delivery", caption: "The instrument that executes" },
      { href: "/system/biologic-control", label: "Biologic Control", caption: "Prep, recovery, maintenance" },
      { href: "/system/data-intelligence", label: "Data Intelligence", caption: "How the system gets smarter" },
    ],
  },
  { href: "/pico", label: "Precise Pico" },
  { href: "/demo", label: "Practitioners" },
  { href: "/launch", label: "Launch" },
  { href: "/about", label: "About" },
];

export function Header({ defaultTone }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [detectedTone, setDetectedTone] = useState<HeaderTone | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (defaultTone) return;
    const first = document.querySelector<HTMLElement>("main [data-tone]");
    const tone = first?.dataset.tone;
    if (tone === "midnight" || tone === "midnight-deep") setDetectedTone("dark");
    else setDetectedTone("light");
  }, [defaultTone, pathname]);

  const resolvedDefault: HeaderTone = defaultTone ?? detectedTone ?? "dark";
  const effectiveTone: HeaderTone = scrolled ? "light" : resolvedDefault;
  const isLight = effectiveTone === "light";

  return (
    <header
      role="banner"
      data-tone={isLight ? "bone" : "midnight"}
      className={cn(
        "fixed top-0 left-0 right-0 z-40 w-full",
        "transition-colors duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled
          ? "bg-bone-100/95 backdrop-blur-sm border-b border-bone-300/60"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-24 max-w-[1280px] items-center justify-between px-6 md:h-28 md:px-10 lg:px-12">
        <Logo variant="horizontal" tone={isLight ? "navy" : "cream"} width={360} priority />

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            if (item.children) {
              return (
                <DropdownNavItem
                  key={item.href}
                  item={item}
                  active={active}
                  isLight={isLight}
                  pathname={pathname}
                />
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-small font-medium transition-colors duration-[150ms]",
                  isLight
                    ? "text-ink-700 hover:text-ink-900"
                    : "text-cream-100 hover:text-cream-50",
                  active && "underline underline-offset-[6px] decoration-1",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Button
            asChild
            variant={isLight ? "primary" : "primary-on-dark"}
            size="sm"
          >
            <Link href="/demo">Request a demonstration</Link>
          </Button>
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-md md:hidden",
                isLight ? "text-ink-900" : "text-cream-50",
              )}
            >
              <Menu className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </SheetTrigger>
          <SheetContent
            id="mobile-menu"
            side="right"
            className="bg-bone-100 border-bone-300 flex flex-col"
          >
            <SheetHeader className="px-6">
              <SheetTitle className="text-left font-display text-h3 text-ink-900">
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1 px-6 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));

                if (item.children) {
                  return (
                    <MobileDropdownGroup
                      key={item.href}
                      item={item}
                      active={active}
                      pathname={pathname}
                      onLinkClick={() => setOpen(false)}
                    />
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "py-3 font-display text-h3 text-ink-900 transition-colors",
                      active && "underline underline-offset-[6px]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto px-6 pb-8 pt-12">
              <Button asChild variant="primary" size="md" className="w-full">
                <Link href="/demo" onClick={() => setOpen(false)}>
                  Request a demonstration
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

// — Desktop dropdown nav item —
function DropdownNavItem({
  item,
  active,
  isLight,
  pathname,
}: {
  item: NavItem;
  active: boolean;
  isLight: boolean;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);

  // Hover-open with a small delay to avoid flicker on accidental crossings.
  const handleMouseEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  // Click-outside + Esc to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 text-small font-medium transition-colors duration-[150ms]",
          isLight
            ? "text-ink-700 hover:text-ink-900"
            : "text-cream-100 hover:text-cream-50",
          active && "underline underline-offset-[6px] decoration-1",
        )}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform duration-[150ms]",
            open && "rotate-180",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown panel */}
      <div
        role="menu"
        aria-orientation="vertical"
        className={cn(
          "absolute left-1/2 top-full -translate-x-1/2 mt-3 min-w-[320px]",
          "transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        )}
      >
        <div className="bg-bone-100 border border-brand-300/30 shadow-[0_2px_4px_rgba(10,15,28,.06),0_12px_32px_rgba(10,15,28,.08)] p-2">
          <ul className="flex flex-col" role="none">
            {item.children!.map((sub) => {
              const subActive =
                pathname === sub.href ||
                (sub.href !== "/system" && pathname.startsWith(`${sub.href}/`));
              return (
                <li key={sub.href} role="none">
                  <Link
                    href={sub.href}
                    role="menuitem"
                    aria-current={subActive ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-sm px-4 py-3 transition-colors duration-[150ms]",
                      "hover:bg-bone-200/70 focus-visible:bg-bone-200/70",
                      "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
                      subActive && "bg-bone-200/50",
                    )}
                  >
                    <span className="block font-body text-small font-medium text-ink-900">
                      {sub.label}
                    </span>
                    <span className="mt-0.5 block font-body text-caption text-ink-500">
                      {sub.caption}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// — Mobile collapsible nav group —
function MobileDropdownGroup({
  item,
  active,
  pathname,
  onLinkClick,
}: {
  item: NavItem;
  active: boolean;
  pathname: string;
  onLinkClick: () => void;
}) {
  const [open, setOpen] = useState(active);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center justify-between py-3 text-left font-display text-h3 text-ink-900 transition-colors",
          active && "underline underline-offset-[6px]",
        )}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={cn(
            "size-5 transition-transform duration-[150ms]",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul className="ml-4 mb-2 flex flex-col gap-1 border-l border-ink-700/15 pl-4" role="list">
          {item.children!.map((sub) => {
            const subActive =
              pathname === sub.href ||
              (sub.href !== "/system" && pathname.startsWith(`${sub.href}/`));
            return (
              <li key={sub.href}>
                <Link
                  href={sub.href}
                  onClick={onLinkClick}
                  aria-current={subActive ? "page" : undefined}
                  className={cn(
                    "block py-2 font-body text-body text-ink-700",
                    subActive && "text-ink-900 font-medium",
                  )}
                >
                  {sub.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
