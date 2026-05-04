import type { InboxItemAuditRow } from "@/lib/admin/inbox";

interface InboxAuditLogProps {
  entries: InboxItemAuditRow[];
}

export function InboxAuditLog({ entries }: InboxAuditLogProps) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-caption text-ink-500">
        No activity yet. Status changes and admin notes will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start gap-3 border-l-2 border-ink-700/15 pl-3"
        >
          <div className="flex-1">
            <p className="font-body text-small text-ink-900">
              {describeAction(entry.action, entry.metadata)}
            </p>
            <p
              className="font-body text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
              title={new Date(entry.created_at).toLocaleString()}
            >
              {new Date(entry.created_at).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function describeAction(action: string, metadata: unknown): string {
  if (action.endsWith(".status_changed")) {
    const m = (metadata ?? {}) as { from?: string; to?: string };
    if (m.from && m.to) {
      return `Status changed from ${capitalize(m.from)} to ${capitalize(m.to)}.`;
    }
    return "Status changed.";
  }
  if (action.endsWith(".notes_updated")) {
    return "Admin notes updated.";
  }
  return action;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
