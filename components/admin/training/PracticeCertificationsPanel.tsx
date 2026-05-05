"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CertificationStatusBadge } from "./CertificationStatusBadge";
import type { PracticeCertificationRow } from "@/lib/admin/training";

interface PracticeCertificationsPanelProps {
  practiceId: string;
  rows: Array<{
    device_id: string;
    device_display_name: string;
    device_slug: string;
    certification: PracticeCertificationRow | null;
  }>;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function PracticeCertificationsPanel({
  practiceId,
  rows,
}: PracticeCertificationsPanelProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-5 py-4">
        <p className="font-body text-caption text-ink-500">
          No devices on file for this practice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <CertRow key={row.device_id} practiceId={practiceId} row={row} />
      ))}
    </div>
  );
}

function CertRow({
  practiceId,
  row,
}: {
  practiceId: string;
  row: PracticeCertificationsPanelProps["rows"][number];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const cert = row.certification;
  const isRecertOn = cert?.recert_required ?? false;
  const status = cert?.status ?? "not_started";

  async function setRecert(required: boolean) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/practices/${practiceId}/certifications/${row.device_id}/recert`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recertRequired: required,
            recertReason: required ? reason.trim() || null : null,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not update recert flag.");
        return;
      }
      toast.success(required ? "Re-certification required." : "Re-cert flag cleared.");
      setOpen(false);
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {row.device_display_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CertificationStatusBadge
              status={status as "not_started" | typeof status}
            />
            {cert?.certified_at && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Certified {new Date(cert.certified_at).toLocaleDateString()}
              </span>
            )}
            {isRecertOn && (
              <span className="font-body text-caption text-[#8A2C2C]">
                Re-cert flagged
              </span>
            )}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!cert || busy}
            >
              {isRecertOn ? "Manage recert" : "Require re-certification"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRecertOn
                  ? "Clear re-cert requirement"
                  : "Require re-certification"}
              </DialogTitle>
            </DialogHeader>
            {!isRecertOn && (
              <div className="space-y-2">
                <label
                  htmlFor="recert-reason"
                  className="font-body text-caption text-ink-700"
                >
                  Reason (optional)
                </label>
                <Textarea
                  id="recert-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Major protocol revision; updated parameter envelopes"
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            <p className="font-body text-caption text-ink-500">
              {isRecertOn
                ? "Cleared once the practice re-completes the curriculum. Audit-logged."
                : "Surfaces a banner in the practice's portal but doesn't revoke the existing certification. Audit-logged."}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setRecert(!isRecertOn)}
                disabled={busy}
              >
                {busy
                  ? "Saving…"
                  : isRecertOn
                    ? "Clear flag"
                    : "Require re-cert"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
