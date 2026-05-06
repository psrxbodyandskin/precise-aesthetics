"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

// P14 — CSV export trigger.
//
// Issues a GET to /api/admin/audit-log/export with the same filter
// query params the operator currently has on the page. If the filter
// set yields more than the 10k cap, the API returns 413 with an error
// message and we surface that as a toast — operator tightens filters.

export function ExportCsvButton() {
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function exportCsv() {
    const qs = params.toString();
    const url = qs
      ? `/api/admin/audit-log/export?${qs}`
      : "/api/admin/audit-log/export";

    startTransition(async () => {
      try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          toast.error(data.error ?? "Export failed.");
          return;
        }
        // Trigger download from the browser
        const blob = await res.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        const today = new Date().toISOString().slice(0, 10);
        a.download = `audit-log-${today}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.success("Exported.");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Export failed.",
        );
      }
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={exportCsv}
      disabled={pending}
    >
      <Download
        className="mr-1 size-3.5"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      {pending ? "Exporting…" : "Export CSV"}
    </Button>
  );
}
