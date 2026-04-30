"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

const NAV_ITEMS = [
  { href: "/system", label: "The System" },
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
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-1 px-6">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
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
