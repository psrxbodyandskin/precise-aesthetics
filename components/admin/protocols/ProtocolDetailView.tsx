"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AuditLogTable } from "@/components/admin/practices/AuditLogTable";
import { DraftProtocolUpdateModal } from "@/components/admin/ai/DraftProtocolUpdateModal";
import { ProtocolStatusChip } from "./ProtocolStatusChip";
import { ProtocolContentPreview } from "./ProtocolContentPreview";
import { DeviceTagPicker } from "./DeviceTagPicker";
import { VersionHistoryList } from "./VersionHistoryList";
import type { Protocol } from "@/lib/sanity/types";
import type { ProtocolStatus } from "@/lib/schemas/protocol";
import type { Database } from "@/lib/supabase/types";

type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface ProtocolRow {
  id: string;
  sanity_id: string;
  title: string;
  slug: string;
  short_description: string | null;
  status: ProtocolStatus;
  current_version: string | null;
  pending_major_bump: boolean;
  last_published_at: string | null;
  last_synced_at: string | null;
  sanity_rev: string | null;
  indication_categories: { id: string; title: string; slug: string } | null;
}

interface DeviceJoin {
  device_id: string;
  devices: {
    id: string;
    slug: string;
    display_name: string;
    short_description: string | null;
  } | null;
}

interface AvailableDevice {
  id: string;
  displayName: string;
  shortDescription: string | null;
}

interface VersionRow {
  id: string;
  version: string;
  title: string;
  short_description: string | null;
  published_at: string;
  published_by: string | null;
}

interface ProtocolDetailViewProps {
  protocol: ProtocolRow;
  taggedDevices: DeviceJoin[];
  availableDevices: AvailableDevice[];
  versions: VersionRow[];
  auditLog: AuditRow[];
  sanityDoc: Protocol | null;
  studioBaseUrl: string;
}

type Modal =
  | null
  | "confirm-publish"
  | "confirm-unpublish"
  | "confirm-archive"
  | "confirm-destroy";

export function ProtocolDetailView({
  protocol,
  taggedDevices,
  availableDevices,
  versions,
  auditLog,
  sanityDoc,
  studioBaseUrl,
}: ProtocolDetailViewProps) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [majorPending, startMajorTransition] = useTransition();
  const [pendingMajor, setPendingMajor] = useState(protocol.pending_major_bump);

  const initialTaggedIds = taggedDevices
    .map((d) => d.device_id)
    .filter(Boolean);

  const studioUrl = `${studioBaseUrl}/structure/protocol;${protocol.sanity_id}`;

  async function postAction(path: string, label: string) {
    setActionPending(label);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Action failed.");
      } else {
        toast.success("Done.");
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setActionPending(null);
      setModal(null);
    }
  }

  async function destroyAction() {
    setActionPending("destroy");
    try {
      const res = await fetch(
        `/api/admin/protocols/${protocol.id}/destroy`,
        { method: "DELETE" },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not delete.", {
          duration: data.code === "has_references" ? 12000 : 6000,
        });
      } else {
        toast.success("Protocol deleted permanently.");
        router.push("/admin/protocols");
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setActionPending(null);
      setModal(null);
    }
  }

  function toggleMajorBump() {
    const next = !pendingMajor;
    startMajorTransition(async () => {
      const res = await fetch(
        `/api/admin/protocols/${protocol.id}/major-bump`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pendingMajorBump: next }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        pendingMajorBump?: boolean;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not update flag.");
        return;
      }
      setPendingMajor(Boolean(data.pendingMajorBump));
      toast.success(
        data.pendingMajorBump
          ? "Next publish will be a major version bump."
          : "Cleared major-bump flag.",
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      <AdminBreadcrumb
        items={[
          { label: "Protocols", href: "/admin/protocols" },
          { label: protocol.title },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § {protocol.indication_categories?.title ?? "Uncategorized"}
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {protocol.title}
          </h1>
          <div
            className="mt-4 flex flex-wrap items-center gap-3 text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <ProtocolStatusChip status={protocol.status} />
            <span>·</span>
            <span>v{protocol.current_version ?? "unpublished"}</span>
            {protocol.last_published_at && (
              <>
                <span>·</span>
                <span>
                  Published {formatDate(protocol.last_published_at)}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DraftProtocolUpdateModal
            protocolId={protocol.id}
            protocolTitle={protocol.title}
            studioUrl={studioUrl}
          />
          <Button asChild variant="primary" size="sm">
            <a href={studioUrl} target="_blank" rel="noopener noreferrer">
              Edit in Sanity Studio
            </a>
          </Button>
          {protocol.status === "draft" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModal("confirm-publish")}
              suppressHydrationWarning
            >
              Publish
            </Button>
          )}
          {protocol.status === "published" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModal("confirm-unpublish")}
              suppressHydrationWarning
            >
              Unpublish
            </Button>
          )}
          {protocol.status !== "archived" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModal("confirm-archive")}
              suppressHydrationWarning
            >
              Archive
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              postAction(
                `/api/admin/protocols/${protocol.id}/resync`,
                "resync",
              )
            }
            disabled={actionPending === "resync"}
            suppressHydrationWarning
          >
            {actionPending === "resync" ? "Resyncing…" : "Force resync"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModal("confirm-destroy")}
            className="text-red-700 hover:text-red-900"
            suppressHydrationWarning
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Pending major bump banner */}
      {pendingMajor && (
        <div
          role="status"
          className="rounded-md border border-[#A8801F]/40 bg-[#FFF6D6] px-5 py-3 flex items-start justify-between gap-4"
        >
          <div>
            <p
              className="font-body text-overline font-medium uppercase text-[#7A5A00]"
              style={EYEBROW_TRACKING}
            >
              § Major bump armed
            </p>
            <p className="mt-1 font-body text-caption text-[#5A4500]">
              Next publish from Sanity Studio bumps the version major
              (v{protocol.current_version ?? "1.0"} → v
              {bumpMajorPreview(protocol.current_version)}).
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={toggleMajorBump}
            disabled={majorPending}
          >
            {majorPending ? "Clearing…" : "Cancel"}
          </Button>
        </div>
      )}

      {/* Section A — Sanity content preview */}
      <section>
        <SectionHeader
          label="Content"
          actionLabel="Edit in Studio"
          actionHref={studioUrl}
        />
        <div className="mt-6">
          {sanityDoc ? (
            <ProtocolContentPreview doc={sanityDoc} />
          ) : (
            <p className="font-body text-caption text-ink-500">
              Content not loadable from Sanity. Try Force resync.
            </p>
          )}
        </div>
      </section>

      {/* Section B — Device tagging */}
      <section>
        <SectionHeader
          label="Devices"
          subtitle="Practitioners only see this protocol if at least one of their owned devices is tagged here."
        />
        <div className="mt-6">
          <DeviceTagPicker
            protocolId={protocol.id}
            allDevices={availableDevices}
            initialTaggedDeviceIds={initialTaggedIds}
          />
        </div>
      </section>

      {/* Section C — Major-bump toggle (when not already armed) */}
      {!pendingMajor && (
        <section>
          <SectionHeader label="Versioning" />
          <div className="mt-6 rounded-md border border-ink-700/15 bg-bone-50 p-5">
            <p className="font-body text-small font-medium text-ink-900">
              Mark next publish as a major version bump
            </p>
            <p className="mt-1 font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
              By default, every Sanity publish increments the minor version.
              Toggle this on for breaking parameter changes that warrant a
              major bump. The flag clears automatically when the next publish
              syncs.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={toggleMajorBump}
                disabled={majorPending}
                suppressHydrationWarning
              >
                {majorPending ? "Saving…" : "Mark next publish as major"}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Section D — Version history */}
      <section>
        <SectionHeader label="Version history" />
        <div className="mt-6">
          <VersionHistoryList versions={versions} />
        </div>
      </section>

      {/* Section E — Sync status */}
      <section>
        <SectionHeader label="Sync status" />
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="font-body text-caption text-ink-500">Last synced</dt>
            <dd className="font-body text-small text-ink-900">
              {formatDate(protocol.last_synced_at) ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-body text-caption text-ink-500">
              Last synced rev
            </dt>
            <dd
              className="font-body text-small text-ink-900"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {protocol.sanity_rev ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-body text-caption text-ink-500">Sanity ID</dt>
            <dd
              className="font-body text-caption text-ink-700 break-all"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {protocol.sanity_id}
            </dd>
          </div>
        </dl>
      </section>

      {/* Section F — Audit log */}
      <section>
        <SectionHeader label="Audit log" />
        <div className="mt-6">
          <AuditLogTable entries={auditLog} />
        </div>
      </section>

      {/* Confirmation modals */}
      <Dialog
        open={modal === "confirm-publish"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Force publish?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-body text-ink-700">
            This flips the Supabase status to <strong>published</strong>{" "}
            without creating a new version snapshot. Use this only when the
            Sanity status is already published but the mirror got out of
            sync. To create a new version, publish in Sanity Studio.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                postAction(
                  `/api/admin/protocols/${protocol.id}/publish`,
                  "publish",
                )
              }
              disabled={actionPending === "publish"}
            >
              {actionPending === "publish" ? "Publishing…" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "confirm-unpublish"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Unpublish?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-body text-ink-700">
            Practitioners will no longer see this protocol. Existing version
            snapshots stay intact, so treatment logs that reference them keep
            working. You can republish at any time.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                postAction(
                  `/api/admin/protocols/${protocol.id}/unpublish`,
                  "unpublish",
                )
              }
              disabled={actionPending === "unpublish"}
            >
              {actionPending === "unpublish" ? "Unpublishing…" : "Unpublish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "confirm-archive"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Archive this protocol?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-body text-ink-700">
            Status flips to <strong>archived</strong>. Hidden from default
            lists; practitioners cannot see it. Version snapshots stay intact
            so treatment logs that reference them keep working.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                postAction(
                  `/api/admin/protocols/${protocol.id}/archive`,
                  "archive",
                )
              }
              disabled={actionPending === "archive"}
            >
              {actionPending === "archive" ? "Archiving…" : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "confirm-destroy"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Delete this protocol permanently?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 font-body text-body text-ink-700">
            <p>
              Drops the protocol row, all device tags, and every version
              snapshot. The Sanity document is NOT touched — delete it in
              Studio separately if you want the content gone too.
            </p>
            <p className="text-red-700">
              This cannot be undone. If any treatment log references a
              version of this protocol, the request fails with a 409 and
              you&rsquo;ll need to archive instead.
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={destroyAction}
              disabled={actionPending === "destroy"}
              className="bg-red-700 hover:bg-red-800"
            >
              {actionPending === "destroy"
                ? "Deleting…"
                : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionHeader({
  label,
  subtitle,
  actionLabel,
  actionHref,
}: {
  label: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="border-b border-ink-700/10 pb-3 flex items-baseline justify-between gap-4">
      <div>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § {label}
        </p>
        {subtitle && (
          <p
            className="mt-1 font-body text-caption text-ink-500 max-w-[64ch]"
            style={{ lineHeight: 1.55 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          target="_blank"
          rel="noopener noreferrer"
          className="font-body text-caption text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function bumpMajorPreview(currentVersion: string | null): string {
  if (!currentVersion) return "2.0";
  const m = /^(\d+)\.(\d+)$/.exec(currentVersion);
  if (!m) return "2.0";
  return `${Number(m[1]) + 1}.0`;
}
