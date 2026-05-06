"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReplayButton } from "./ReplayButton";

interface ResponseShape {
  ok: boolean;
  runId?: string;
  output?: string;
  sql?: string;
  queryResult?: unknown[];
  cost?: number;
  latencyMs?: number;
  error?: string;
}

const EXAMPLES = [
  "What's the PIH rate trend for Fitzpatrick V melasma over the last 90 days?",
  "Which protocols have the highest adverse event rates?",
  "How many treatments were logged each month this year?",
  "Which practices haven't logged a treatment in the last 30 days?",
];

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function QueryAssistantInterface() {
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ResponseShape | null>(null);

  function ask() {
    const q = question.trim();
    if (q.length < 3) {
      toast.error("Question is too short.");
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/ai/query-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = (await res.json().catch(() => ({}))) as ResponseShape;
      if (!res.ok) {
        toast.error(data.error ?? "Query failed.");
      }
      setResult(data);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={EXAMPLES[0]}
          rows={4}
          className="font-body text-small"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" onClick={ask} disabled={pending}>
            {pending ? (
              <>
                <Loader2
                  className="mr-2 size-3.5 animate-spin"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Asking…
              </>
            ) : (
              <>
                <Sparkles
                  className="mr-2 size-3.5"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Ask
              </>
            )}
          </Button>
          {pending && (
            <p className="font-body text-caption text-ink-500">
              Generating SQL, executing, and explaining the result. This may
              take 30 seconds.
            </p>
          )}
        </div>

        <div>
          <p
            className="mb-2 font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Examples
          </p>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  onClick={() => setQuestion(ex)}
                  className="rounded-sm border border-ink-700/15 bg-bone-50 px-3 py-1.5 font-body text-caption text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {result && !result.ok && result.error && (
        <div className="rounded-md border border-[#B23B3B]/30 bg-[#FBEAEA]/40 p-5">
          <p
            className="font-body text-overline font-medium uppercase text-[#8A2C2C]"
            style={EYEBROW_TRACKING}
          >
            Query failed
          </p>
          <p className="mt-2 font-body text-small text-[#8A2C2C]">
            {result.error}
          </p>
          {result.sql && (
            <details className="mt-3">
              <summary className="cursor-pointer font-body text-caption text-[#8A2C2C]">
                Show generated SQL
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-sm bg-bone-100 p-3 font-mono text-caption text-ink-900">
                {result.sql}
              </pre>
            </details>
          )}
        </div>
      )}

      {result?.ok && (
        <div className="space-y-6">
          {result.output && (
            <section>
              <p
                className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Answer
              </p>
              <div
                className="rounded-md border border-ink-700/15 bg-bone-50 p-5 font-body text-ink-900"
                style={{ lineHeight: 1.65, whiteSpace: "pre-wrap" }}
              >
                {result.output}
              </div>
            </section>
          )}

          {result.sql && (
            <details className="rounded-md border border-ink-700/15 bg-bone-50">
              <summary
                className="cursor-pointer px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Generated SQL
              </summary>
              <pre className="overflow-x-auto rounded-b-md bg-bone-100 p-4 font-mono text-caption text-ink-900">
                {result.sql}
              </pre>
            </details>
          )}

          {result.queryResult && Array.isArray(result.queryResult) && (
            <section>
              <p
                className="mb-3 font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Result rows ({result.queryResult.length})
              </p>
              <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
                <ResultsTable rows={result.queryResult as Record<string, unknown>[]} />
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-ink-700/10 pt-4">
            {result.cost !== undefined && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Cost ${result.cost.toFixed(4)}
              </span>
            )}
            {result.latencyMs !== undefined && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                · {(result.latencyMs / 1000).toFixed(1)}s
              </span>
            )}
            {result.runId && <ReplayButton runId={result.runId} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-6 text-center font-body text-caption text-ink-500">
        Empty result.
      </p>
    );
  }
  const columns = Object.keys(rows[0] ?? {});
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-ink-700/10 text-left">
          {columns.map((col) => (
            <th
              key={col}
              scope="col"
              className="px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
              style={{ letterSpacing: "0.18em" }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-ink-700/5 last:border-b-0">
            {columns.map((col) => (
              <td
                key={col}
                className="px-4 py-3 align-top font-body text-small text-ink-900"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatCell(row[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
