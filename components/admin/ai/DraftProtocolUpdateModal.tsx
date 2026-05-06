"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CopyToClipboardButton } from "./CopyToClipboardButton";

interface DraftProtocolUpdateModalProps {
  protocolId: string;
  protocolTitle: string;
  studioUrl: string;
}

interface ProtocolChange {
  section: string;
  before: string;
  after: string;
  rationale: string;
}

interface ParsedDraft {
  version_bump_recommendation?: "minor" | "major";
  version_bump_rationale?: string;
  changes?: ProtocolChange[];
  summary_for_practitioners?: string;
  open_questions?: string[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const SECTION_LABEL: Record<string, string> = {
  parameter_envelope: "Parameter envelope",
  overview: "Overview",
  biologic_control: "Biologic control",
  contraindications: "Contraindications",
  session_guidance: "Session guidance",
};

// P11 — Protocol Drafter UI. Roni opens this from the protocol
// detail page, types her clinical direction (and optional
// supporting data), and the agent returns a structured update
// proposal she can copy into Sanity Studio. After applying, she
// hits "Mark applied" which records the action against the
// agent_runs row for audit.
export function DraftProtocolUpdateModal({
  protocolId,
  protocolTitle,
  studioUrl,
}: DraftProtocolUpdateModalProps) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("");
  const [supporting, setSupporting] = useState("");
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<ParsedDraft | null>(null);
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [applyPending, startApplyTransition] = useTransition();
  const [appliedAt, setAppliedAt] = useState<string | null>(null);

  function reset() {
    setDirection("");
    setSupporting("");
    setDraft(null);
    setRawOutput(null);
    setRunId(null);
    setAppliedAt(null);
  }

  function generate() {
    const trimmed = direction.trim();
    if (trimmed.length < 5) {
      toast.error("Direction must be at least 5 characters.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/ai/protocol-drafter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolId,
          direction: trimmed,
          supportingDataSummary: supporting.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        runId?: string;
        output?: string;
        parsedOutput?: ParsedDraft;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not draft update.");
        return;
      }
      setRawOutput(data.output ?? null);
      setDraft(data.parsedOutput ?? null);
      setRunId(data.runId ?? null);
    });
  }

  function markApplied() {
    if (!runId) return;
    startApplyTransition(async () => {
      const res = await fetch(`/api/admin/ai/runs/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliedAction: `Applied to Sanity Studio (${protocolTitle})`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not record application.");
        return;
      }
      setAppliedAt(new Date().toISOString());
      toast.success("Marked as applied.");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Sparkles
            className="mr-1 size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Draft update
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Draft protocol update — {protocolTitle}</DialogTitle>
        </DialogHeader>

        {!draft && (
          <div className="space-y-4">
            <p
              className="font-body text-caption text-ink-500"
              style={{ lineHeight: 1.55 }}
            >
              Describe the clinical direction — what should change and why.
              The agent will draft structured edits for you to apply in Sanity
              Studio.
            </p>
            <div>
              <Label htmlFor="pd-direction">
                Clinical direction <span className="text-[#8A2C2C]">*</span>
              </Label>
              <Textarea
                id="pd-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                placeholder='e.g., "Tighten the parameter envelope for Fitzpatrick V — recent treatments show PIH risk above 1.6 J/cm². Lower the upper bound to 1.4."'
                rows={5}
                className="mt-1"
                maxLength={4000}
              />
              <p className="mt-1 font-body text-caption text-ink-500">
                {direction.length} / 4000
              </p>
            </div>
            <div>
              <Label htmlFor="pd-supporting">
                Supporting data (optional)
              </Label>
              <Textarea
                id="pd-supporting"
                value={supporting}
                onChange={(e) => setSupporting(e.target.value)}
                placeholder="Paste outcome data, parameter logs, or excerpted Sanity content the agent should reference."
                rows={4}
                className="mt-1"
                maxLength={8000}
              />
              <p className="mt-1 font-body text-caption text-ink-500">
                {supporting.length} / 8000
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" onClick={generate} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2
                      className="mr-2 size-3.5 animate-spin"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    Drafting…
                  </>
                ) : (
                  "Generate draft"
                )}
              </Button>
              {pending && (
                <p className="font-body text-caption text-ink-500">
                  This may take 30 seconds.
                </p>
              )}
            </div>
          </div>
        )}

        {draft && (
          <div className="space-y-6">
            {/* Version bump */}
            {draft.version_bump_recommendation && (
              <div className="rounded-md border border-ink-700/15 bg-bone-50 p-4">
                <p
                  className="font-body text-overline font-medium uppercase text-ink-500"
                  style={EYEBROW_TRACKING}
                >
                  Version bump
                </p>
                <p className="mt-2 font-display text-ink-900 text-h4">
                  {draft.version_bump_recommendation.toUpperCase()}
                </p>
                {draft.version_bump_rationale && (
                  <p
                    className="mt-2 font-body text-small text-ink-700"
                    style={{ lineHeight: 1.55 }}
                  >
                    {draft.version_bump_rationale}
                  </p>
                )}
              </div>
            )}

            {/* Summary for practitioners */}
            {draft.summary_for_practitioners && (
              <div>
                <p
                  className="font-body text-overline font-medium uppercase text-ink-500"
                  style={EYEBROW_TRACKING}
                >
                  Summary for practitioners
                </p>
                <p
                  className="mt-2 font-body text-ink-900"
                  style={{ lineHeight: 1.65 }}
                >
                  {draft.summary_for_practitioners}
                </p>
              </div>
            )}

            {/* Changes */}
            {draft.changes && draft.changes.length > 0 && (
              <div className="space-y-4">
                <p
                  className="font-body text-overline font-medium uppercase text-ink-500"
                  style={EYEBROW_TRACKING}
                >
                  Proposed changes ({draft.changes.length})
                </p>
                {draft.changes.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-ink-700/15 bg-bone-50 p-4"
                  >
                    <p
                      className="font-body text-overline font-medium uppercase text-ink-700"
                      style={EYEBROW_TRACKING}
                    >
                      {SECTION_LABEL[c.section] ?? c.section}
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p
                          className="font-body text-caption text-ink-500"
                          style={{ letterSpacing: "0.04em" }}
                        >
                          Before
                        </p>
                        <p
                          className="mt-1 whitespace-pre-wrap font-body text-small text-ink-900"
                          style={{ lineHeight: 1.55 }}
                        >
                          {c.before}
                        </p>
                      </div>
                      <div>
                        <p
                          className="font-body text-caption text-ink-500"
                          style={{ letterSpacing: "0.04em" }}
                        >
                          After
                        </p>
                        <p
                          className="mt-1 whitespace-pre-wrap font-body text-small text-ink-900"
                          style={{ lineHeight: 1.55 }}
                        >
                          {c.after}
                        </p>
                      </div>
                    </div>
                    {c.rationale && (
                      <div className="mt-3 border-t border-ink-700/10 pt-3">
                        <p
                          className="font-body text-caption text-ink-500"
                          style={{ letterSpacing: "0.04em" }}
                        >
                          Rationale
                        </p>
                        <p
                          className="mt-1 font-body text-small text-ink-700"
                          style={{ lineHeight: 1.55 }}
                        >
                          {c.rationale}
                        </p>
                      </div>
                    )}
                    <div className="mt-3">
                      <CopyToClipboardButton
                        text={c.after}
                        label="Copy 'after'"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Open questions */}
            {draft.open_questions && draft.open_questions.length > 0 && (
              <div className="rounded-md border border-[#B8862B]/30 bg-[#FBF4E3]/50 p-4">
                <p
                  className="font-body text-overline font-medium uppercase text-ink-700"
                  style={EYEBROW_TRACKING}
                >
                  Open questions
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {draft.open_questions.map((q, i) => (
                    <li
                      key={i}
                      className="font-body text-small text-ink-900"
                      style={{ lineHeight: 1.55 }}
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action footer */}
            <div className="flex flex-wrap items-center gap-2 border-t border-ink-700/10 pt-4">
              <Button asChild variant="primary" size="sm">
                <a href={studioUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink
                    className="mr-1 size-3.5"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Open in Sanity Studio
                </a>
              </Button>
              {!appliedAt ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={markApplied}
                  disabled={applyPending || !runId}
                >
                  {applyPending ? "Recording…" : "Mark applied"}
                </Button>
              ) : (
                <span
                  className="font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Applied {new Date(appliedAt).toLocaleTimeString()}
                </span>
              )}
              {rawOutput && (
                <CopyToClipboardButton
                  text={rawOutput}
                  label="Copy raw output"
                />
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={reset}
              >
                Start over
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
