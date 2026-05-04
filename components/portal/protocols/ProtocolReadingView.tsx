import { AlertCircle } from "lucide-react";

import { ProtocolReadingHeader } from "./ProtocolReadingHeader";
import { FitzpatrickChipRow } from "./FitzpatrickChipRow";
import { ParameterEnvelopeTable } from "./ParameterEnvelopeTable";
import { BiologicControlSummary } from "./BiologicControlSummary";
import { ProtocolReferences } from "./ProtocolReferences";
import { ClinicalPortableText } from "./ClinicalPortableText";
import type { Protocol } from "@/lib/sanity/types";

interface ProtocolReadingViewProps {
  protocol: {
    title: string;
    slug: string;
    short_description: string | null;
    current_version: string | null;
    last_published_at: string | null;
    indication_category: { id: string; title: string; slug: string } | null;
    fitzpatrick_types: string[];
    indication_tags: string[];
  };
  sanityDoc: Protocol | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Section header used throughout the reading view. Sober, no §,
// no Fig — clinical document register.
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display text-ink-900 mb-6"
      style={{
        fontSize: "1.5rem",
        letterSpacing: "-0.01em",
        lineHeight: 1.15,
        fontWeight: 400,
      }}
    >
      {children}
    </h2>
  );
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="my-12 flex justify-center md:my-16">
      <span className="block h-px w-[60px] bg-brand-500/30 print:bg-ink-900" />
    </div>
  );
}

function FieldBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </p>
      <div className="mt-2 font-body text-ink-900" style={{ fontSize: "1rem" }}>
        {value}
      </div>
    </div>
  );
}

// The full protocol reading view. Single scrollable document, max
// 720px content width for readable line lengths. Every section
// hides cleanly when its source content is missing, except identity
// and the biologic control status block which always render.
//
// Sections render in clinical sequence (per spec section order):
//   1. Header (title, version, print)
//   2. Identity (indication, fitzpatrick, version)
//   3. Clinical overview (Sanity rich text)
//   4. Parameter envelope
//   5. Session guidance
//   6. Biologic control
//   7. Contraindications
//   8. Expected outcomes (if present)
//   9. Complications (if present)
//  10. References
export function ProtocolReadingView({
  protocol,
  sanityDoc,
}: ProtocolReadingViewProps) {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-12 md:px-0 md:py-16 print:max-w-none print:px-0 print:py-0">
      <ProtocolReadingHeader
        title={protocol.title}
        shortDescription={protocol.short_description}
        indicationCategoryTitle={protocol.indication_category?.title ?? null}
        currentVersion={protocol.current_version}
        lastPublishedAt={protocol.last_published_at}
      />

      <SectionDivider />

      {/* Identity */}
      <section>
        <SectionHeader>Identity.</SectionHeader>
        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          <FieldBlock
            label="Indication category"
            value={protocol.indication_category?.title ?? "Uncategorized"}
          />
          {protocol.indication_tags.length > 0 && (
            <FieldBlock
              label="Specific indications"
              value={
                <span className="capitalize">
                  {protocol.indication_tags
                    .map((t) => formatIndicationTag(t))
                    .join(", ")}
                </span>
              }
            />
          )}
          <div className="sm:col-span-2 print:col-span-2">
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Applicable Fitzpatrick types
            </p>
            <div className="mt-3">
              <FitzpatrickChipRow applicable={protocol.fitzpatrick_types} />
            </div>
          </div>
          {protocol.last_published_at && (
            <FieldBlock
              label="Last published"
              value={formatDate(protocol.last_published_at)}
            />
          )}
          {protocol.current_version && (
            <FieldBlock
              label="Version"
              value={
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {protocol.current_version}
                </span>
              }
            />
          )}
        </div>
      </section>

      {/* Clinical overview */}
      {sanityDoc?.overview && sanityDoc.overview.length > 0 && (
        <>
          <SectionDivider />
          <section>
            <SectionHeader>Clinical overview.</SectionHeader>
            <div className="max-w-[64ch]">
              <ClinicalPortableText value={sanityDoc.overview} />
            </div>
          </section>
        </>
      )}

      {/* Parameter envelope */}
      <SectionDivider />
      <section>
        <SectionHeader>Parameter envelope.</SectionHeader>
        <ParameterEnvelopeTable rows={sanityDoc?.parameterEnvelope ?? []} />
      </section>

      {/* Session guidance */}
      {sanityDoc?.sessionGuidance &&
        (sanityDoc.sessionGuidance.expectedSessions ||
          sanityDoc.sessionGuidance.spacingWeeks ||
          (sanityDoc.sessionGuidance.notes &&
            sanityDoc.sessionGuidance.notes.length > 0)) && (
          <>
            <SectionDivider />
            <section>
              <SectionHeader>Session guidance.</SectionHeader>
              <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
                {sanityDoc.sessionGuidance.expectedSessions && (
                  <FieldBlock
                    label="Expected sessions"
                    value={sanityDoc.sessionGuidance.expectedSessions}
                  />
                )}
                {sanityDoc.sessionGuidance.spacingWeeks && (
                  <FieldBlock
                    label="Recommended spacing"
                    value={sanityDoc.sessionGuidance.spacingWeeks}
                  />
                )}
              </div>
              {sanityDoc.sessionGuidance.notes &&
                sanityDoc.sessionGuidance.notes.length > 0 && (
                  <div className="mt-6 max-w-[64ch]">
                    <ClinicalPortableText
                      value={sanityDoc.sessionGuidance.notes}
                    />
                  </div>
                )}
            </section>
          </>
        )}

      {/* Biologic control */}
      <SectionDivider />
      <section>
        <SectionHeader>Biologic control.</SectionHeader>
        <BiologicControlSummary
          prepKitRequired={sanityDoc?.prepKitRequired}
          recoveryKitRequired={sanityDoc?.recoveryKitRequired}
          maintenanceKitRecommended={sanityDoc?.maintenanceKitRecommended}
        />
        {sanityDoc?.biologicControlNotes &&
          sanityDoc.biologicControlNotes.length > 0 && (
            <div className="mt-6 max-w-[64ch]">
              <ClinicalPortableText value={sanityDoc.biologicControlNotes} />
            </div>
          )}
      </section>

      {/* Contraindications */}
      {sanityDoc?.contraindications &&
        sanityDoc.contraindications.length > 0 && (
          <>
            <SectionDivider />
            <section>
              <h2
                className="mb-6 flex items-center gap-3 font-display text-ink-900"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                  fontWeight: 400,
                }}
              >
                <AlertCircle
                  className="size-5 text-brand-700"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                Contraindications.
              </h2>
              <div className="max-w-[64ch]">
                <ClinicalPortableText value={sanityDoc.contraindications} />
              </div>
            </section>
          </>
        )}

      {/* Expected outcomes */}
      {sanityDoc?.expectedOutcomes &&
        sanityDoc.expectedOutcomes.length > 0 && (
          <>
            <SectionDivider />
            <section>
              <SectionHeader>Expected outcomes.</SectionHeader>
              <div className="max-w-[64ch]">
                <ClinicalPortableText value={sanityDoc.expectedOutcomes} />
              </div>
            </section>
          </>
        )}

      {/* Complications */}
      {sanityDoc?.complications && sanityDoc.complications.length > 0 && (
        <>
          <SectionDivider />
          <section>
            <SectionHeader>Complications.</SectionHeader>
            <div className="max-w-[64ch]">
              <ClinicalPortableText value={sanityDoc.complications} />
            </div>
          </section>
        </>
      )}

      {/* References */}
      {sanityDoc?.references && sanityDoc.references.length > 0 && (
        <>
          <SectionDivider />
          <section>
            <SectionHeader>References.</SectionHeader>
            <ProtocolReferences references={sanityDoc.references} />
          </section>
        </>
      )}

      {/* Sanity content unavailable fallback */}
      {!sanityDoc && (
        <>
          <SectionDivider />
          <p className="font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
            Content currently unavailable. Try refreshing — or contact us if
            the issue persists.
          </p>
        </>
      )}
    </article>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// Pretty-print Sanity slug-style indication tags (e.g. "pih" → "PIH",
// "tattoo_black" → "Tattoo black"). Conservative — first letter of
// each underscore-separated word.
function formatIndicationTag(slug: string): string {
  // Special-case the common acronyms
  const map: Record<string, string> = {
    pih: "PIH",
    tattoo_black: "Tattoo (black)",
    tattoo_color: "Tattoo (colored)",
    cafe_au_lait: "Café-au-lait",
    nevus_ota: "Nevus of Ota",
    hori: "Hori's nevus",
    becker: "Becker's nevus",
    acne_scars: "Acne scars",
    rhytids: "Rhytids",
    rejuvenation: "Skin rejuvenation",
    pigment_general: "General pigment",
  };
  if (map[slug]) return map[slug];
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
