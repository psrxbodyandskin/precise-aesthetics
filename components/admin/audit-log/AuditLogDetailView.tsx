import Link from "next/link";
import { ExternalLink } from "lucide-react";

import type { AuditLogEntry } from "@/lib/admin/audit-log";
import { AuditLogActionChip } from "./AuditLogActionChip";
import { AuditLogActorChip } from "./AuditLogActorChip";
import { AuditLogMetadataDisplay } from "./AuditLogMetadataDisplay";
import { AuditLogRelatedEntries } from "./AuditLogRelatedEntries";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface AuditLogDetailViewProps {
  entry: AuditLogEntry;
  related: AuditLogEntry[];
}

// P14 — single audit entry detail.
//
// Sections:
//   A. Event — action verb, timestamp, actor, IP
//   B. Target — type + id, "View target" link if known type
//   C. Metadata — pretty-printed JSON or "No metadata recorded"
//   D. Related entries — same target_id history
//   E. Raw record — collapsed by default
//
// "View target" route mapping (per P14 ambiguity #7). Adding a new
// target type later? Add a row here.

const TARGET_ROUTE: Record<string, (id: string) => string> = {
  practice: (id) => `/admin/practices/${id}`,
  protocol: (id) => `/admin/protocols/${id}`,
  vendor: (id) => `/admin/vendors/${id}`,
  stack_service: (id) => `/admin/settings/stack/${id}`,
  adverse_event: (id) => `/admin/adverse-events/${id}`,
  agent_run: (id) => `/admin/ai/runs/${id}`,
  // auth_user: intentionally NOT mapped — no route exists. Display
  // "User: {actor_email}" inline instead per ambiguity #7.
  // unknown types → no link rendered.
};

function getTargetUrl(targetType: string | null, targetId: string | null): string | null {
  if (!targetType || !targetId) return null;
  const builder = TARGET_ROUTE[targetType];
  return builder ? builder(targetId) : null;
}

export function AuditLogDetailView({
  entry,
  related,
}: AuditLogDetailViewProps) {
  const targetUrl = getTargetUrl(entry.targetType, entry.targetId);
  const isAuthUserTarget = entry.targetType === "auth_user";

  return (
    <div className="space-y-12">
      {/* Header */}
      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Audit entry
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <AuditLogActionChip action={entry.action} className="text-sm" />
        </div>
        <p
          className="mt-3 font-body text-ink-500"
          style={{ fontSize: "0.9375rem", lineHeight: 1.55 }}
        >
          {new Date(entry.createdAt).toLocaleString()}
          {entry.actorEmail && ` · ${entry.actorEmail}`}
        </p>
      </header>

      {/* Section A — Event */}
      <Section heading="Event">
        <DL>
          <DT label="Action">
            <code className="font-mono text-small">{entry.action}</code>
          </DT>
          <DT label="Timestamp">
            <span style={{ fontVariantNumeric: "tabular-nums" }}>
              {new Date(entry.createdAt).toLocaleString()}
            </span>
            <span
              className="block font-mono text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {entry.createdAt}
            </span>
          </DT>
          <DT label="Actor">
            <div className="flex flex-wrap items-center gap-2">
              <AuditLogActorChip actorRole={entry.actorRole} />
              {entry.actorEmail && (
                <span
                  className="font-body text-ink-900"
                  style={{ wordBreak: "break-all" }}
                >
                  {entry.actorEmail}
                </span>
              )}
            </div>
          </DT>
          {entry.ipAddress && (
            <DT label="IP address">
              <code className="font-mono text-caption">{entry.ipAddress}</code>
            </DT>
          )}
        </DL>
      </Section>

      {/* Section B — Target */}
      {entry.targetType && (
        <Section heading="Target">
          <DL>
            <DT label="Type">{entry.targetType}</DT>
            {entry.targetId && (
              <DT label="Target id">
                <Link
                  href={`/admin/audit-log?target_type=${encodeURIComponent(
                    entry.targetType,
                  )}&target_id=${encodeURIComponent(entry.targetId)}`}
                  className="inline-flex items-center font-mono text-caption text-brand-700 underline-offset-2 hover:underline"
                  title="View this target's full audit history"
                >
                  {entry.targetId}
                </Link>
              </DT>
            )}
            {entry.targetPracticeName && (
              <DT label="Practice name">{entry.targetPracticeName}</DT>
            )}
            {isAuthUserTarget && entry.actorEmail && (
              <DT label="User">
                <span style={{ wordBreak: "break-all" }}>
                  {entry.actorEmail}
                </span>
              </DT>
            )}
          </DL>
          {targetUrl && (
            <div className="mt-4">
              <Link
                href={targetUrl}
                className="inline-flex items-center gap-1 font-body text-caption text-brand-700 underline-offset-2 hover:underline"
              >
                View target
                <ExternalLink
                  className="size-3"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </Link>
            </div>
          )}
        </Section>
      )}

      {/* Section C — Metadata */}
      <Section heading="Metadata">
        <AuditLogMetadataDisplay metadata={entry.metadata} />
      </Section>

      {/* Section D — Related entries */}
      {entry.targetType && entry.targetId && (
        <Section heading="Related entries">
          <AuditLogRelatedEntries
            entries={related.filter((e) => e.id !== entry.id).slice(0, 10)}
            targetType={entry.targetType}
            targetId={entry.targetId}
          />
        </Section>
      )}

      {/* Section E — Raw record */}
      <Section heading="Raw record">
        <details className="rounded-md border border-ink-700/15 bg-bone-50">
          <summary className="cursor-pointer px-4 py-3 font-body text-caption text-ink-700">
            Show raw audit_log row
          </summary>
          <pre className="overflow-x-auto rounded-b-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
            {JSON.stringify(
              {
                id: entry.id,
                created_at: entry.createdAt,
                actor_id: entry.actorId,
                actor_role: entry.actorRole,
                action: entry.action,
                target_type: entry.targetType,
                target_id: entry.targetId,
                metadata: entry.metadata,
                ip_address: entry.ipAddress,
              },
              null,
              2,
            )}
          </pre>
        </details>
      </Section>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p
        className="mb-4 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {heading}
      </p>
      {children}
    </section>
  );
}

function DL({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{children}</dl>;
}

function DT({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </dt>
      <dd className="mt-1 font-body text-ink-900">{children}</dd>
    </div>
  );
}
