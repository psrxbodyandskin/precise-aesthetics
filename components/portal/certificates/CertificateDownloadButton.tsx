"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Print-to-PDF only (Q4). Triggers window.print(); a print stylesheet
// hides UI chrome and renders just the certificate. Browsers offer
// "Save as PDF" in the print dialog on every desktop platform + iOS.
export function CertificateDownloadButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer
        className="mr-2 size-4"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      Print or save as PDF
    </Button>
  );
}
