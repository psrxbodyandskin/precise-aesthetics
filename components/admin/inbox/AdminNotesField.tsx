"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import type { InboxItemTypeValue } from "@/lib/schemas/inbox";

interface AdminNotesFieldProps {
  type: InboxItemTypeValue;
  id: string;
  initialNotes: string;
}

// Inline-editable textarea, saves on blur (per spec). Shows a subtle
// "Saving…" hint while the request is in flight.
export function AdminNotesField({ type, id, initialNotes }: AdminNotesFieldProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [pending, startTransition] = useTransition();

  function save() {
    if (notes === initialNotes) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/inbox/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save notes.");
        return;
      }
      toast.success("Notes saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={save}
        placeholder="Internal-only context, e.g. 'Met at AAD; high intent.'"
        rows={4}
        className="resize-y"
        maxLength={4000}
      />
      <p className="font-body text-caption text-ink-500">
        {pending
          ? "Saving…"
          : "Saved automatically when you click outside the field. Internal-only — never shown to the sender."}
      </p>
    </div>
  );
}
