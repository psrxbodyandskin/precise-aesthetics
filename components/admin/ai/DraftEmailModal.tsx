"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CopyToClipboardButton } from "./CopyToClipboardButton";

interface DraftEmailModalProps {
  recipientContext: string;
  /** Pre-fill the To: address for the mailto link. Optional. */
  recipientEmail?: string | null;
  /** Trigger label override. */
  triggerLabel?: string;
}

interface Alternative {
  subject: string;
  body: string;
}

interface ParsedDraft {
  subject?: string;
  body?: string;
  tone_notes?: string;
  alternatives?: Alternative[];
}

const PURPOSES = [
  "Welcome",
  "Follow up",
  "Address concern",
  "Custom",
] as const;

export function DraftEmailModal({
  recipientContext,
  recipientEmail,
  triggerLabel = "Draft email",
}: DraftEmailModalProps) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<string>("Welcome");
  const [customPurpose, setCustomPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);

  function generate() {
    startTransition(async () => {
      const finalPurpose =
        purpose === "Custom" ? customPurpose.trim() || "Custom" : purpose;
      const res = await fetch("/api/admin/ai/communication-drafter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientContext,
          purpose: finalPurpose,
          additionalNotes: notes.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        output?: string;
        parsedOutput?: ParsedDraft;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not draft.");
        return;
      }
      setRawOutput(data.output ?? null);
      setDraft(data.parsedOutput ?? null);
    });
  }

  function buildMailto(subject: string, body: string): string {
    const params = new URLSearchParams();
    params.set("subject", subject);
    params.set("body", body);
    const to = recipientEmail ?? "";
    return `mailto:${to}?${params.toString()}`;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Sparkles
            className="mr-1 size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft email</DialogTitle>
        </DialogHeader>

        {!draft && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Select
                value={purpose}
                onValueChange={(v) => setPurpose(v)}
              >
                <SelectTrigger id="purpose" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {purpose === "Custom" && (
              <div>
                <Label htmlFor="custom-purpose">Custom purpose</Label>
                <Input
                  id="custom-purpose"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="e.g., Re-engagement after silence"
                  className="mt-1"
                />
              </div>
            )}
            <div>
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific points to include, tone preferences, etc."
                rows={3}
                className="mt-1"
                maxLength={2000}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={generate} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2
                      className="mr-2 size-3.5 animate-spin"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
              {pending && (
                <p className="self-center font-body text-caption text-ink-500">
                  This may take 20 seconds.
                </p>
              )}
            </div>
          </div>
        )}

        {draft && (
          <div className="space-y-6">
            {(draft.alternatives ?? []).length > 0 && draft.subject && (
              <DraftCard
                subject={draft.subject ?? ""}
                body={draft.body ?? ""}
                badge="Primary draft"
                mailtoBuilder={buildMailto}
              />
            )}
            {(draft.alternatives ?? []).map((alt, i) => (
              <DraftCard
                key={i}
                subject={alt.subject}
                body={alt.body}
                badge={`Alternative ${i + 1}`}
                mailtoBuilder={buildMailto}
              />
            ))}
            {draft.tone_notes && (
              <p
                className="font-body text-caption italic text-ink-500"
                style={{ lineHeight: 1.55 }}
              >
                {draft.tone_notes}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDraft(null);
                  setRawOutput(null);
                }}
              >
                Generate again
              </Button>
              {rawOutput && (
                <CopyToClipboardButton text={rawOutput} label="Copy raw output" />
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DraftCard({
  subject,
  body,
  badge,
  mailtoBuilder,
}: {
  subject: string;
  body: string;
  badge: string;
  mailtoBuilder: (subject: string, body: string) => string;
}) {
  const [editedBody, setEditedBody] = useState(body);
  const [editedSubject, setEditedSubject] = useState(subject);

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-4">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={{ letterSpacing: "0.18em" }}
      >
        {badge}
      </p>
      <Input
        value={editedSubject}
        onChange={(e) => setEditedSubject(e.target.value)}
        className="mt-3 font-medium"
      />
      <Textarea
        value={editedBody}
        onChange={(e) => setEditedBody(e.target.value)}
        rows={10}
        className="mt-3 font-mono text-small"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={mailtoBuilder(editedSubject, editedBody)}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-midnight-800 px-3 font-body text-small font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          Use this — open mail client
        </a>
        <CopyToClipboardButton
          text={`${editedSubject}\n\n${editedBody}`}
          label="Copy"
        />
      </div>
    </div>
  );
}
