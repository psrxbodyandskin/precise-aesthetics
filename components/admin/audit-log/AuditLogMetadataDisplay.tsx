import type { Json } from "@/lib/supabase/types";
import { CopyToClipboardButton } from "@/components/admin/ai/CopyToClipboardButton";

// P14 — pretty-printed metadata block with copy-to-clipboard.
// Renders "No metadata recorded" when empty/null per ambiguity #10.

interface AuditLogMetadataDisplayProps {
  metadata: Json | null;
}

export function AuditLogMetadataDisplay({
  metadata,
}: AuditLogMetadataDisplayProps) {
  if (!metadata || isEmptyJson(metadata)) {
    return (
      <p
        className="rounded-md border border-dashed border-ink-700/15 bg-bone-50 px-4 py-3 font-body text-caption text-ink-500"
        style={{ lineHeight: 1.55 }}
      >
        No metadata recorded.
      </p>
    );
  }

  const pretty = JSON.stringify(metadata, null, 2);

  return (
    <div className="space-y-2">
      <pre className="overflow-x-auto rounded-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
        {pretty}
      </pre>
      <CopyToClipboardButton text={pretty} label="Copy JSON" />
    </div>
  );
}

function isEmptyJson(j: Json): boolean {
  if (j === null) return true;
  if (typeof j !== "object" || Array.isArray(j)) return false;
  return Object.keys(j as Record<string, unknown>).length === 0;
}
