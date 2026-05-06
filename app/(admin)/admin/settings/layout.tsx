import type { ReactNode } from "react";

// P13.5 — settings layout. The sub-nav is rendered by each child page
// itself (below their AdminPageHeader) so the visual hierarchy stays
// consistent: breadcrumb → header → sub-nav → content. A shared layout
// wrapper here would either render above the breadcrumb (wrong) or
// require restructuring every settings page.
//
// This layout is intentionally minimal — it exists so we can attach
// settings-specific metadata or future shared concerns without
// touching individual pages.

export default function AdminSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
