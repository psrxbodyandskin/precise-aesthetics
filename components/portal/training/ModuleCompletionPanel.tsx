"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
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
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModuleCompletionPanel({
  moduleId,
  practiceUserId,
  watchPercentage,
  requiredWatchPercentage,
  isComplete,
  watchUnlocked,
}: ModuleCompletionPanelProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const [pending, startTransition] = useTransition();

  function complete() {
    if (!practiceUserId) {
      toast.error("Sign in as a practice user to complete this module.");
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

  if (isComplete) {
    return (
      <div className="rounded-md border border-brand-500/40 bg-brand-300/10 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-500 text-cream-50">
            <Check className="size-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <p
              className="font-body text-overline font-medium uppercase text-brand-700"
              style={EYEBROW_TRACKING}
            >
              Complete
            </p>
            <p className="mt-1 font-body text-small text-ink-900">
              You have completed this module.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!watchUnlocked) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Completion
        </p>
        <p
          className="mt-2 font-body text-small text-ink-700"
          style={{ lineHeight: 1.55 }}
        >
          Watch at least {requiredWatchPercentage}% of the video to enable
          completion. ({watchPercentage}% so far.)
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{
              width: `${Math.min(100, (watchPercentage / requiredWatchPercentage) * 100)}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Completion
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
