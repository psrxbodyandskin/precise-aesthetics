import type { Json } from "@/lib/supabase/types";

// P14 — inline preview of metadata JSON (truncated, single line).
// Used in list-row + card cells. Full metadata + pretty-print lives
// on the detail page.

interface AuditLogMetadataPreviewProps {
  metadata: Json | null;
  /** Cap length before ellipsis. */
  maxChars?: number;
}

export function AuditLogMetadataPreview({
  metadata,
  maxChars = 80,
}: AuditLogMetadataPreviewProps) {
  if (!metadata || isEmptyJson(metadata)) {
    return <span className="text-ink-300">—</span>;
  }
  const json = JSON.stringify(metadata);
  const truncated = json.length > maxChars ? `${json.slice(0, maxChars - 1)}…` : json;
  return (
    <code
      className="font-mono text-caption text-ink-700"
      style={{ wordBreak: "break-all" }}
      title={json.length > maxChars ? json : undefined}
    >
      {truncated}
    </code>
  );
}

function isEmptyJson(j: Json): boolean {
  if (j === null) return true;
  if (typeof j !== "object" || Array.isArray(j)) return false;
  return Object.keys(j as Record<string, unknown>).length === 0;
}
