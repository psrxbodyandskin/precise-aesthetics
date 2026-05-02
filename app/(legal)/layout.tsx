import type { ReactNode } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";

// Legal pages (/terms, /privacy) share the same chrome as the marketing
// site: full Header on top, site Footer at the bottom. This layout is
// identical to (marketing)/layout.tsx — kept separate because Next.js route
// groups can't share layouts across siblings.
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
