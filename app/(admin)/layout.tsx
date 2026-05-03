import type { Metadata } from "next";
import type { ReactNode } from "react";

// /admin/* route group root layout. Internal team only. Hidden from search
// engines via metadata-level robots noindex. Real admin chrome lands in
// later sessions when admin features ship (P8 lead inbox, P11 AI agents).
//
// `/admin/login` itself also sets noindex below (per ambiguity F: admin
// surface kept off the public crawl path).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bone-100">
      <main id="main">{children}</main>
    </div>
  );
}
