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
import type { DeviceCertSummary } from "@/lib/admin/training";

interface PracticeCertificationsPanelProps {
  practiceId: string;
  rows: DeviceCertSummary[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// P9.1 — per-user certifications. Each device renders a section
// listing every certified user on the practice, plus their recert
// status + a per-user recert toggle.
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
    <div className="space-y-6">
      {rows.map((device) => (
        <DeviceSection key={device.device_id} device={device} practiceId={practiceId} />
      ))}
    </div>
  );
}

function DeviceSection({
  device,
  practiceId,
}: {
  device: DeviceCertSummary;
  practiceId: string;
}) {
  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50">
      <div className="border-b border-ink-700/10 px-5 py-4">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {device.device_display_name}
        </p>
        <p className="mt-1 font-body text-caption text-ink-500">
          {device.certifications.length === 0
            ? "No certifications yet."
            : `${device.certifications.length} certified ${
                device.certifications.length === 1 ? "user" : "users"
              }`}
        </p>
      </div>

      {device.certifications.length === 0 ? (
        <p className="px-5 py-4 font-body text-caption text-ink-500">
          No one on this practice is certified for this device yet.
        </p>
      ) : (
        <ul className="divide-y divide-ink-700/10">
          {device.certifications.map(({ cert, user }) => (
            <CertRow
              key={cert.id}
              practiceId={practiceId}
              deviceId={device.device_id}
              cert={cert}
              userName={user?.full_name ?? "Unknown user"}
              userRole={user?.role_label ?? null}
              userActive={user?.is_active ?? true}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CertRow({
  practiceId,
  deviceId,
  cert,
  userName,
  userRole,
  userActive,
}: {
  practiceId: string;
  deviceId: string;
  cert: DeviceCertSummary["certifications"][number]["cert"];
  userName: string;
  userRole: string | null;
  userActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const isRecertOn = cert.recert_required;
  const status = cert.status;

  async function setRecert(required: boolean) {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/practices/${practiceId}/certifications/${deviceId}/users/${cert.practice_user_id}/recert`,
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
      toast.success(
        required ? "Re-certification required." : "Re-cert flag cleared.",
      );
      setOpen(false);
      setReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-body text-small font-medium text-ink-900 truncate">
            {userName}
            {!userActive && (
              <span className="ml-2 font-body text-caption italic text-ink-500">
                (inactive)
              </span>
            )}
          </p>
          {userRole && (
            <p className="font-body text-caption text-ink-500 truncate">
              {userRole}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CertificationStatusBadge status={status} />
            {cert.certified_at && (
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
              disabled={busy}
            >
              {isRecertOn ? "Manage recert" : "Require re-certification"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isRecertOn
                  ? "Clear re-cert requirement"
                  : `Require re-certification for ${userName}`}
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
                ? "Cleared once the user re-completes the curriculum. Audit-logged."
                : "Surfaces a banner in the user's portal but doesn't revoke the existing certification. Audit-logged."}
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
    </li>
  );
}
