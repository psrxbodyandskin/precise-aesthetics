"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ModuleCompletionPanelProps {
  moduleId: string;
  practiceUserId: string | null;
  watchPercentage: number;
  requiredWatchPercentage: number;
  isComplete: boolean;
  watchUnlocked: boolean;
  /** Parent curriculum id — back-link target. */
  curriculumId: string | null;
  /** Next module in the curriculum sort order, if any. */
  nextModuleId: string | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModuleCompletionPanel({
  moduleId,
  practiceUserId,
  watchPercentage,
  requiredWatchPercentage,
  isComplete,
  watchUnlocked,
  curriculumId,
  nextModuleId,
}: ModuleCompletionPanelProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, startTransition] = useTransition();

  function complete() {
    if (!practiceUserId) {
      toast.error("Pick who's training above to complete this module.");
      return;
    }
    if (!acknowledged) {
      toast.error("Acknowledge the completion checkbox.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/portal/training/modules/${moduleId}/acknowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ practiceUserId }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not mark complete.");
        return;
      }
      toast.success("Module complete.");
      router.refresh();
    });
  }

  // ----- Already complete: show next-step navigation -----
  if (isComplete) {
    return (
      <div className="rounded-md border border-brand-500/40 bg-brand-300/10 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-500 text-cream-50">
            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p
              className="font-body text-overline font-medium uppercase text-brand-700"
              style={EYEBROW_TRACKING}
            >
              Complete
            </p>
            <p className="mt-1 font-body text-small text-ink-900">
              You&apos;ve finished this module.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {nextModuleId && (
            <Link
              href={`/portal/training/modules/${nextModuleId}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-sm bg-midnight-800 px-4 font-body text-small font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              Next module
              <ArrowRight
                className="size-3.5"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          )}
          {curriculumId && (
            <Link
              href={`/portal/training/${curriculumId}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-sm border border-ink-700/20 bg-bone-50 px-4 font-body text-small font-medium text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              <ArrowLeft
                className="size-3.5"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Back to curriculum
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ----- Not yet at required watch percentage -----
  if (!watchUnlocked) {
    const progressTowardUnlock = Math.min(
      100,
      Math.round((watchPercentage / requiredWatchPercentage) * 100),
    );
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Completion
          </p>
          <p
            className="font-body text-caption text-ink-700"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {watchPercentage}% watched · unlocks at {requiredWatchPercentage}%
          </p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progressTowardUnlock}%` }}
          />
        </div>
      </div>
    );
  }

  // ----- Watch threshold met, awaiting acknowledgment -----
  return (
    <div className="rounded-md border border-brand-500/30 bg-bone-50 p-5">
      <p
        className="font-body text-overline font-medium uppercase text-brand-700"
        style={EYEBROW_TRACKING}
      >
        Ready to complete
      </p>
      <label className="mt-3 flex items-start gap-3 font-body text-small text-ink-900">
        <Checkbox
          checked={acknowledged}
          onCheckedChange={(v) => setAcknowledged(Boolean(v))}
          className="mt-0.5"
        />
        <span style={{ lineHeight: 1.55 }}>
          I have completed this module and understood the material.
        </span>
      </label>
      <div className="mt-4">
        <Button
          type="button"
          onClick={complete}
          disabled={!acknowledged || pending || !practiceUserId}
        >
          {pending ? "Saving…" : "Mark module complete"}
        </Button>
      </div>
    </div>
  );
}
