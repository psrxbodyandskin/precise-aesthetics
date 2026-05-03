import type { ReactNode } from "react";

// /portal/* route group root layout. Intentionally minimal in P1 — a
// dedicated practitioner-facing chrome (nav, profile menu, notifications,
// sign-out button) lands in P3 alongside the post-login dashboard.
//
// This layout deliberately does NOT include the marketing Header/Footer.
// The portal is a separate product surface with its own chrome.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bone-100">
      <main id="main">{children}</main>
    </div>
  );
}
