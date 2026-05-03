import type { Database } from "@/lib/supabase/types";

type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

interface AuditLogTableProps {
  entries: AuditRow[];
  emptyMessage?: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
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

// Append-only audit log list. Generic — accepts a pre-filtered array of
// audit_log rows and renders them. Used on the practice detail page for
// "Activity log". Future admin views can pass differently filtered data.
//
// Limited to the 50 most recent rows by the caller. The full
// admin-wide audit explorer ships in P7.
export function AuditLogTable({
  entries,
  emptyMessage = "No activity recorded yet.",
}: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <p className="font-body text-caption text-ink-500">{emptyMessage}</p>
    );
  }

  return (
    <ol className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-l-2 border-brand-300/40 pl-4"
        >
          <p className="font-body text-small font-medium text-ink-900">
            {entry.action}
          </p>
          <p className="mt-0.5 font-body text-caption text-ink-500">
            {formatDate(entry.created_at)}
            {entry.actor_role ? ` · ${entry.actor_role}` : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
