import type { ReactNode } from "react";
import "./print.css";

// Portal protocol routes — print stylesheet loaded once at the layout
// level so both the list and the detail view inherit `.print-hide` /
// `.print-only` utilities and the @media print rules.
export default function ProtocolsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
