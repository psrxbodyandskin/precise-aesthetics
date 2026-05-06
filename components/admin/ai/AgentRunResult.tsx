import { CopyToClipboardButton } from "./CopyToClipboardButton";

interface AgentRunResultProps {
  output: string;
  parsedOutput?: unknown;
  cost?: number;
  latencyMs?: number;
  /** Optional toolbar — defaults to copy raw output. */
  showToolbar?: boolean;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Renders an agent's output. Markdown-light treatment — preserves
// fenced code blocks (great for SQL, JSON), italic + bold via the
// browser's text rendering. Full markdown parser would be nice
// but ships fine without one for v1; everything important is
// inside fenced blocks.
export function AgentRunResult({
  output,
  parsedOutput,
  cost,
  latencyMs,
  showToolbar = true,
}: AgentRunResultProps) {
  return (
    <div className="space-y-3">
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {cost !== undefined && cost >= 0 && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Cost ${cost.toFixed(4)}
              </span>
            )}
            {latencyMs !== undefined && latencyMs > 0 && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                · {(latencyMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <CopyToClipboardButton text={output} label="Copy output" />
        </div>
      )}

      {/* Pretty render — if we got parsed JSON, show it as a
          collapsible block above the raw text. */}
      {parsedOutput !== undefined && parsedOutput !== null && (
        <details className="rounded-md border border-ink-700/15 bg-bone-50 p-4">
          <summary
            className="cursor-pointer font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Parsed JSON
          </summary>
          <pre className="mt-3 overflow-x-auto rounded-sm bg-bone-100 p-3 font-mono text-caption text-ink-900">
            {JSON.stringify(parsedOutput, null, 2)}
          </pre>
        </details>
      )}

      <div
        className="rounded-md border border-ink-700/15 bg-bone-50 p-5 font-body text-ink-900"
        style={{ lineHeight: 1.65, whiteSpace: "pre-wrap" }}
      >
        {output}
      </div>
    </div>
  );
}
