import type { ReactNode } from "react";

export const metadata = {
  title: "Content Studio — Precise Aesthetics",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return children;
}
