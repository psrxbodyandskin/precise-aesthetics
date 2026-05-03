import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface PortalShellProps {
  practiceName: string;
  children: ReactNode;
}

// Minimal practitioner-portal chrome. Renders on every authed
// dashboard surface (not on /portal/login or /portal/setup, which
// have their own layouts).
//
// Header layout: brand lockup left, practice name + sign-out right.
// No SaaS-y top-nav sprawl — protocol library, treatment logs, etc.
// will be reached through the dashboard body in P4+.
export function PortalShell({ practiceName, children }: PortalShellProps) {
  return (
    <div className="relative min-h-screen bg-bone-100">
      <header
        className="border-b border-ink-700/15 bg-bone-100/80 backdrop-blur-sm"
        role="banner"
      >
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-5 md:px-12">
          <Link
            href="/portal"
            className="flex items-center gap-3 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
            aria-label="Precise Aesthetics — portal home"
          >
            <Image
              src="/brand/precise-aesthetics-brand-identity/assets/logos/precise-aesthetics-horizontal-navy@2x.png"
              alt=""
              aria-hidden="true"
              width={160}
              height={40}
              priority
              className="h-7 w-auto"
            />
          </Link>

          <div className="flex items-center gap-6">
            <p
              className="hidden font-body text-overline font-medium uppercase text-ink-700 md:block"
              style={EYEBROW_TRACKING}
            >
              {practiceName}
            </p>
            <form action="/api/auth/logout?surface=portal" method="post">
              <button
                type="submit"
                className="font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main">{children}</main>
    </div>
  );
}
