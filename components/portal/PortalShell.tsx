import type { ReactNode } from "react";
import { Logo } from "@/components/marketing/Logo";
import { PortalNav } from "./PortalNav";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface PortalShellProps {
  practiceName: string;
  children: ReactNode;
}

// Practitioner-portal chrome. Renders on every authed dashboard
// surface (not on /portal/login or /portal/setup, which have their
// own layouts).
//
// Layout:
//   [logo]  ────────  [practice name]  [sign out]
//   [Protocols] [future P6: Treatments] [future P7: Notifications]
//
// Both rows hide on print (.print-hide) so chair-side print output
// is content-only.
export function PortalShell({ practiceName, children }: PortalShellProps) {
  return (
    <div className="relative min-h-screen bg-bone-100">
      <header
        data-portal-chrome="true"
        className="print-hide border-b border-ink-700/15 bg-bone-100/80 backdrop-blur-sm"
        role="banner"
      >
        <div className="mx-auto max-w-[1200px] px-6 md:px-12">
          {/* Identity row */}
          <div className="flex items-center justify-between gap-6 py-5">
            <Logo
              variant="horizontal"
              tone="navy"
              width={240}
              href="/portal"
              priority
            />

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

          {/* Nav row */}
          <PortalNav />
        </div>
      </header>

      <main id="main">{children}</main>
    </div>
  );
}
