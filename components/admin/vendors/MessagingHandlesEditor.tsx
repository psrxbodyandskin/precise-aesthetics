"use client";

import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MESSAGING_PLATFORMS,
  type MessagingHandle,
  type MessagingPlatform,
} from "@/lib/schemas/vendor";
import { cn } from "@/lib/utils";

interface MessagingHandlesEditorProps {
  value: MessagingHandle[];
  onChange: (next: MessagingHandle[]) => void;
}

// P13 — vendor messaging handles editor.
// Operator picks a platform from the curated dropdown, types the
// handle. Multiple rows allowed; "+ Add" appends a new row. "Other"
// reveals a custom_platform free-text input so niche platforms work
// without expanding the schema enum.
export function MessagingHandlesEditor({
  value,
  onChange,
}: MessagingHandlesEditorProps) {
  function addRow() {
    onChange([...value, { platform: "WhatsApp", handle: "", custom_platform: null }]);
  }

  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, patch: Partial<MessagingHandle>) {
    onChange(value.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-4 py-3 text-center">
          <p className="font-body text-caption text-ink-500">
            No messaging handles yet.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {value.map((row, idx) => {
            const isOther = row.platform === "Other";
            return (
              <li
                key={idx}
                className="grid items-end gap-2 sm:grid-cols-[180px_1fr_auto]"
              >
                <Select
                  value={row.platform}
                  onValueChange={(v) =>
                    updateRow(idx, { platform: v as MessagingPlatform })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGING_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-2">
                  {isOther && (
                    <Input
                      value={row.custom_platform ?? ""}
                      onChange={(e) =>
                        updateRow(idx, { custom_platform: e.target.value })
                      }
                      placeholder="Platform name"
                      maxLength={50}
                    />
                  )}
                  <Input
                    value={row.handle}
                    onChange={(e) => updateRow(idx, { handle: e.target.value })}
                    placeholder={
                      isOther ? "Handle / URL" : `${row.platform} handle`
                    }
                    maxLength={200}
                    aria-label={`${row.platform} handle`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  aria-label={`Remove ${row.platform} handle`}
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-sm text-ink-500",
                    "transition-colors hover:bg-bone-100 hover:text-[#8A2C2C]",
                    "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
                  )}
                >
                  <Trash2
                    className="size-3.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Button type="button" variant="ghost" size="sm" onClick={addRow}>
        <Plus
          className="mr-1 size-3.5"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        Add messaging handle
      </Button>
    </div>
  );
}

// Helper: render a handle row read-only on the detail view.
export function formatMessagingHandle(h: MessagingHandle): string {
  if (h.platform === "Other" && h.custom_platform) {
    return `${h.custom_platform}: ${h.handle}`;
  }
  return `${h.platform}: ${h.handle}`;
}
