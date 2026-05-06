import Link from "next/link";

import type { AuditLogEntry } from "@/lib/admin/audit-log";
import { AuditLogActionChip } from "./AuditLogActionChip";

// P14 — list other audit_log entries with the same target as the
// current entry. Helps Roni walk a target's full history while on
// the detail page. "View all entries for this target" link below
// drops the operator into the list view filtered to that target.

interface AuditLogRelatedEntriesProps {
  entries: AuditLogEntry[];
  targetType: string;
  targetId: string;
}

export function AuditLogRelatedEntries({
  entries,
  targetType,
  targetId,
}: AuditLogRelatedEntriesProps) {
  if (entries.length === 0) {
    return (
      <p
        className="font-body text-caption text-ink-500"
        style={{ lineHeight: 1.55 }}
      >
        No other entries found for this target.
      </p>
    );
  }

  const allHistoryUrl = `/admin/audit-log?target_type=${encodeURIComponent(
    targetType,
  )}&target_id=${encodeURIComponent(targetId)}`;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-ink-700/10 rounded-md border border-ink-700/15 bg-bone-50">
        {entries.map((e) => (
          <li key={e.id}>
            <Link
              href={`/admin/audit-log/${e.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors duration-[150ms] hover:bg-bone-100/40 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <AuditLogActionChip action={e.action} />
                <span
                  className="font-body text-caption text-ink-500"
                  style={{ wordBreak: "break-all" }}
                >
                  {e.actorEmail ?? "system"}
                </span>
              </div>
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
                title={e.createdAt}
              >
                {new Date(e.createdAt).toLocaleString()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={allHistoryUrl}
        className="inline-flex items-center font-body text-caption text-brand-700 underline-offset-2 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
      >
        View all entries for this target →
      </Link>
    </div>
  );
}
