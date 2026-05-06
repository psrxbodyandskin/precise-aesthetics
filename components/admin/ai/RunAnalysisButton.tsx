"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AgentRunResult } from "./AgentRunResult";

interface RunAnalysisButtonProps {
  endpoint: string;
  body: Record<string, unknown>;
  /** Button label — e.g. "Analyze outcomes for this period". */
  label: string;
  /** Heading shown above the result panel. */
  resultHeading?: string;
}

interface RunResponse {
  ok: boolean;
  runId?: string;
  output?: string;
  parsedOutput?: unknown;
  cost?: number;
  latencyMs?: number;
  error?: string;
}

// Inline trigger button + result panel. Used on /admin/dashboard
// next to chart sections and anywhere else an agent should fire
// "in place." Shows a spinner during the call (10-30s typical).
export function RunAnalysisButton({
  endpoint,
  body,
  label,
  resultHeading,
}: RunAnalysisButtonProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RunResponse | null>(null);

  function run() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => ({}))) as RunResponse;
        if (!res.ok || !data.ok) {
          toast.error(data.error ?? "Agent run failed.");
          setResult(data);
          return;
        }
        setResult(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Network error.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <Button type="button" variant="secondary" onClick={run} disabled={pending}>
        {pending ? (
          <>
            <Loader2
              className="mr-2 size-3.5 animate-spin"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Generating analysis…
          </>
        ) : (
          <>
            <Sparkles
              className="mr-2 size-3.5"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {label}
          </>
        )}
      </Button>

      {pending && (
        <p className="font-body text-caption text-ink-500">
          This may take 30 seconds.
        </p>
      )}

      {result && result.ok && result.output && (
        <div className="space-y-3">
          {resultHeading && (
            <h3 className="font-display text-ink-900" style={{ fontSize: "1.125rem" }}>
              {resultHeading}
            </h3>
          )}
          <AgentRunResult
            output={result.output}
            parsedOutput={result.parsedOutput}
            cost={result.cost}
            latencyMs={result.latencyMs}
          />
        </div>
      )}

      {result && !result.ok && result.error && (
        <div className="rounded-md border border-[#B23B3B]/30 bg-[#FBEAEA]/40 p-4">
          <p className="font-body text-caption text-[#8A2C2C]">
            {result.error}
          </p>
        </div>
      )}
    </div>
  );
}
