"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Json } from "@/lib/supabase/types";

interface EnrichmentSectionProps {
  leadType: "lead" | "demo" | "contact";
  leadId: string;
  data: Json | null;
  enrichedAt: string | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// P11 — replaces the P8 placeholder. Renders Lead Enricher
// output OR a manual re-run button. After re-run completes,
// router.refresh() pulls the updated row.
export function EnrichmentSection({
  leadType,
  leadId,
  data,
  enrichedAt,
}: EnrichmentSectionProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasData = data !== null && enrichedAt !== null;

  function runEnrichment() {
    startTransition(async () => {
      const res = await fetch("/api/admin/ai/lead-enricher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadType, leadId }),
      });
      const result = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !result.ok) {
        toast.error(result.error ?? "Enrichment failed.");
        return;
      }
      toast.success("Enrichment complete.");
      router.refresh();
    });
  }

  if (!hasData) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-6">
        <div className="flex items-center gap-2">
          <Sparkles
            className="size-4 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Enrichment
          </p>
        </div>
        <p
          className="mt-3 font-body text-small text-ink-700"
          style={{ lineHeight: 1.55 }}
        >
          AI enrichment hasn&apos;t run for this lead yet, or the auto-trigger
          failed.
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={runEnrichment}
          disabled={pending}
          className="mt-4"
        >
          {pending ? (
            <>
              <Loader2
                className="mr-2 size-3.5 animate-spin"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Enriching…
            </>
          ) : (
            "Run enrichment"
          )}
        </Button>
      </div>
    );
  }

  // Pretty render for known shape
  const enrichment = data as Record<string, unknown>;
  const practice = enrichment.practice_inferred as
    | Record<string, unknown>
    | undefined;
  const practitioner = enrichment.practitioner_inferred as
    | Record<string, unknown>
    | undefined;

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Enrichment
        </p>
        <span
          className="font-body text-caption text-ink-500"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          Enriched {new Date(enrichedAt!).toLocaleDateString()}
        </span>
      </div>

      {practice && (
        <div className="mt-4">
          <p className="font-body text-caption font-medium text-ink-700">
            Practice
          </p>
          <dl className="mt-1 grid gap-1 sm:grid-cols-2">
            <KV label="Type" value={practice.type as string | undefined} />
            <KV label="Size" value={practice.size_hint as string | undefined} />
            <KV
              label="Specialty"
              value={
                Array.isArray(practice.specialty_focus)
                  ? (practice.specialty_focus as string[]).join(", ")
                  : undefined
              }
            />
            <KV
              label="Market"
              value={practice.geographic_market as string | undefined}
            />
          </dl>
        </div>
      )}

      {practitioner && (
        <div className="mt-4">
          <p className="font-body text-caption font-medium text-ink-700">
            Practitioner
          </p>
          <dl className="mt-1 grid gap-1 sm:grid-cols-2">
            <KV
              label="Credentials"
              value={
                Array.isArray(practitioner.credentials_likely)
                  ? (practitioner.credentials_likely as string[]).join(", ")
                  : undefined
              }
            />
            <KV
              label="Tenure"
              value={practitioner.years_in_practice_hint as string | undefined}
            />
          </dl>
        </div>
      )}

      {Boolean(enrichment.outreach_notes) && (
        <div className="mt-4">
          <p className="font-body text-caption font-medium text-ink-700">
            Outreach notes
          </p>
          <p
            className="mt-1 font-body text-small text-ink-900"
            style={{ lineHeight: 1.55 }}
          >
            {String(enrichment.outreach_notes)}
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink-700/10 pt-4">
        <span
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Confidence:{" "}
          <span className="font-medium text-ink-700">
            {(enrichment.confidence as string | undefined) ?? "unknown"}
          </span>
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={runEnrichment}
          disabled={pending}
        >
          {pending ? "Re-running…" : "Re-run enrichment"}
        </Button>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="font-body text-caption text-ink-500">{label}</dt>
      <dd className="font-body text-small text-ink-900">{value}</dd>
    </div>
  );
}
