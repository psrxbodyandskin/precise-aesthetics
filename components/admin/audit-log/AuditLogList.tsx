import Link from "next/link";

import type { AuditLogEntry } from "@/lib/admin/audit-log";
import { AuditLogActionChip } from "./AuditLogActionChip";
import { AuditLogActorChip } from "./AuditLogActorChip";
import { AuditLogMetadataPreview } from "./AuditLogMetadataPreview";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface AuditLogListProps {
  entries: AuditLogEntry[];
}

// P14 — desktop table + mobile cards in one component.
// Tailwind handles the responsive switch via `md:hidden` / `hidden md:table`.

export function AuditLogList({ entries }: AuditLogListProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-12 text-center">
        <p className="font-body text-small text-ink-700">
          No audit log entries match these filters.
        </p>
        <p
          className="mt-2 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Try clearing one or more filters.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50 md:block">
        <table className="w-full font-body text-small">
          <thead>
            <tr className="border-b border-ink-700/10">
              <Th className="w-[170px]">Time</Th>
              <Th className="w-[220px]">Actor</Th>
              <Th>Action</Th>
              <Th>Target</Th>
              <Th>Metadata</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.id}
                className="border-b border-ink-700/5 transition-colors duration-[150ms] last:border-0 hover:bg-bone-100/40"
              >
                <td className="px-4 py-3 align-top">
                  <Link
                    href={`/admin/audit-log/${e.id}`}
                    className="font-body text-caption text-ink-500 underline-offset-[3px] decoration-1 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] hover:underline"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                    title={e.createdAt}
                  >
                    {formatRelative(e.createdAt)}
                  </Link>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <AuditLogActorChip actorRole={e.actorRole} />
                    <span
                      className="font-body text-caption text-ink-700"
                      style={{ wordBreak: "break-all" }}
                    >
                      {e.actorEmail ?? (e.actorRole ?? null) === null
                        ? "—"
                        : e.actorEmail}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <AuditLogActionChip action={e.action} />
                </td>
                <td className="px-4 py-3 align-top">
                  {e.targetType ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-body text-caption text-ink-500">
                        {e.targetType}
                      </span>
                      {e.targetPracticeName && (
                        <span className="font-body text-small text-ink-900">
                          {e.targetPracticeName}
                        </span>
                      )}
                      {e.targetId && !e.targetPracticeName && (
                        <span
                          className="font-mono text-[11px] text-ink-700"
                          title={e.targetId}
                        >
                          {e.targetId.slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-ink-300">—</span>
                  )}
                </td>
                <td className="max-w-[320px] px-4 py-3 align-top">
                  <AuditLogMetadataPreview metadata={e.metadata} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {entries.map((e) => (
          <li key={e.id}>
            <Link
              href={`/admin/audit-log/${e.id}`}
              className="block rounded-md border border-ink-700/15 bg-bone-50 p-4 transition-colors duration-[150ms] hover:bg-bone-100/40 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              <div className="flex items-start justify-between gap-3">
                <AuditLogActionChip action={e.action} />
                <span
                  className="shrink-0 font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatRelative(e.createdAt)}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AuditLogActorChip actorRole={e.actorRole} />
                {e.actorEmail && (
                  <span
                    className="font-body text-caption text-ink-700"
                    style={{ wordBreak: "break-all" }}
                  >
                    {e.actorEmail}
                  </span>
                )}
              </div>
              {e.targetType && (
                <p
                  className="mt-2 font-body text-caption text-ink-500"
                  style={{ lineHeight: 1.55 }}
                >
                  Target: <span className="text-ink-700">{e.targetType}</span>
                  {e.targetPracticeName && ` · ${e.targetPracticeName}`}
                </p>
              )}
              <div className="mt-2">
                <AuditLogMetadataPreview metadata={e.metadata} maxChars={120} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-overline font-medium uppercase text-ink-500 ${className ?? ""}`}
      style={EYEBROW_TRACKING}
    >
      {children}
    </th>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}
