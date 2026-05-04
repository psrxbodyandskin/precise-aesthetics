import { Sparkles } from "lucide-react";
import type { Json } from "@/lib/supabase/types";

interface EnrichmentSectionProps {
  data: Json | null;
  enrichedAt: string | null;
}

// P11 reservation. The migration adds enrichment_data + enriched_at
// columns; the AI agent that fills them ships in P11. This component
// renders a placeholder when no data is present, and a structured
// dump when data exists.
export function EnrichmentSection({ data, enrichedAt }: EnrichmentSectionProps) {
  if (!data || enrichedAt === null) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-5 py-6">
        <div className="flex items-center gap-2">
          <Sparkles
            className="size-4 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={{ letterSpacing: "0.18em" }}
          >
            Enrichment · reserved for P11
          </p>
        </div>
        <p className="mt-3 font-body text-small text-ink-700">
          AI enrichment will run here in a future release. The Lead Enricher
          agent will populate practice info, role guesses, and web presence.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-9 cursor-not-allowed items-center rounded-sm border border-ink-700/15 bg-bone-50 px-3 font-body text-caption text-ink-300"
          title="Available after P11 launch"
        >
          Re-run enrichment
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={{ letterSpacing: "0.18em" }}
        >
          Enrichment
        </p>
        <span
          className="font-body text-caption text-ink-500"
          style={{ fontVariantNumeric: "tabular-nums" }}
          title={new Date(enrichedAt).toLocaleString()}
        >
          Enriched {new Date(enrichedAt).toLocaleDateString()}
        </span>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-sm bg-bone-100 p-3 font-mono text-caption text-ink-900">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
