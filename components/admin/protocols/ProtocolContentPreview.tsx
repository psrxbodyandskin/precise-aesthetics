import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { Protocol } from "@/lib/sanity/types";
import { ProtocolParameterTable } from "./ProtocolParameterTable";

interface ProtocolContentPreviewProps {
  doc: Protocol;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const portableComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p
        className="font-body text-ink-700 mb-4 last:mb-0"
        style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}
      >
        {children}
      </p>
    ),
    h2: ({ children }) => (
      <h3 className="font-display text-h4 leading-heading text-ink-900 mt-8 mb-3 first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="font-display text-h5 leading-heading text-ink-900 mt-6 mb-2 first:mt-0">
        {children}
      </h4>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-1 pl-6 font-body text-ink-700 mb-4">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-6 font-body text-ink-700 mb-4">
        {children}
      </ol>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-medium text-ink-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
  },
};

function ContentSection({
  title,
  blocks,
}: {
  title: string;
  blocks: PortableTextBlock[] | undefined;
}) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <section className="border-l border-ink-700/15 pl-5">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
        style={EYEBROW_TRACKING}
      >
        {title}
      </p>
      <PortableText value={blocks} components={portableComponents} />
    </section>
  );
}

export function ProtocolContentPreview({ doc }: ProtocolContentPreviewProps) {
  return (
    <div className="space-y-10">
      {doc.shortDescription && (
        <p
          className="font-body text-ink-700"
          style={{ fontSize: "1rem", lineHeight: 1.65 }}
        >
          {doc.shortDescription}
        </p>
      )}

      {doc.fitzpatrickTypes && doc.fitzpatrickTypes.length > 0 && (
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500 mb-2"
            style={EYEBROW_TRACKING}
          >
            Applicable Fitzpatrick types
          </p>
          <div className="flex flex-wrap gap-1.5">
            {doc.fitzpatrickTypes.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-ink-700/20 bg-bone-50 px-2 py-0.5 font-body text-caption text-ink-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      <ContentSection title="Clinical overview" blocks={doc.overview} />

      {doc.parameterEnvelope && doc.parameterEnvelope.length > 0 && (
        <section className="border-l border-ink-700/15 pl-5">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
            style={EYEBROW_TRACKING}
          >
            Parameter envelope
          </p>
          <ProtocolParameterTable rows={doc.parameterEnvelope} />
        </section>
      )}

      {doc.sessionGuidance && (
        <section className="border-l border-ink-700/15 pl-5">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
            style={EYEBROW_TRACKING}
          >
            Session guidance
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {doc.sessionGuidance.expectedSessions && (
              <div>
                <dt className="font-body text-caption text-ink-500">
                  Expected sessions
                </dt>
                <dd className="font-body text-small text-ink-900">
                  {doc.sessionGuidance.expectedSessions}
                </dd>
              </div>
            )}
            {doc.sessionGuidance.spacingWeeks && (
              <div>
                <dt className="font-body text-caption text-ink-500">
                  Spacing
                </dt>
                <dd className="font-body text-small text-ink-900">
                  {doc.sessionGuidance.spacingWeeks}
                </dd>
              </div>
            )}
          </dl>
          {doc.sessionGuidance.notes && doc.sessionGuidance.notes.length > 0 && (
            <div className="mt-4">
              <PortableText
                value={doc.sessionGuidance.notes}
                components={portableComponents}
              />
            </div>
          )}
        </section>
      )}

      {(doc.prepKitRequired ||
        doc.recoveryKitRequired ||
        doc.maintenanceKitRecommended ||
        (doc.biologicControlNotes && doc.biologicControlNotes.length > 0)) && (
        <section className="border-l border-ink-700/15 pl-5">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
            style={EYEBROW_TRACKING}
          >
            Biologic control
          </p>
          <ul className="space-y-2 mb-4">
            <li className="font-body text-small text-ink-700">
              Prep kit:{" "}
              <span className="text-ink-900">
                {doc.prepKitRequired ? "Required" : "Not required"}
              </span>
            </li>
            <li className="font-body text-small text-ink-700">
              Recovery kit:{" "}
              <span className="text-ink-900">
                {doc.recoveryKitRequired ? "Required" : "Not required"}
              </span>
            </li>
            <li className="font-body text-small text-ink-700">
              Maintenance kit:{" "}
              <span className="text-ink-900">
                {doc.maintenanceKitRecommended ? "Recommended" : "Optional"}
              </span>
            </li>
          </ul>
          {doc.biologicControlNotes && (
            <PortableText
              value={doc.biologicControlNotes}
              components={portableComponents}
            />
          )}
        </section>
      )}

      <ContentSection
        title="Contraindications"
        blocks={doc.contraindications}
      />
      <ContentSection
        title="Expected outcomes"
        blocks={doc.expectedOutcomes}
      />
      <ContentSection title="Complications" blocks={doc.complications} />

      {doc.references && doc.references.length > 0 && (
        <section className="border-l border-ink-700/15 pl-5">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500 mb-4"
            style={EYEBROW_TRACKING}
          >
            References
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            {doc.references.map((r) => (
              <li
                key={r._key}
                className="font-body text-caption text-ink-700"
                style={{ lineHeight: 1.55 }}
              >
                {r.citation}
                {r.url && (
                  <>
                    {" — "}
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-700 underline-offset-[3px] decoration-1 hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                    >
                      Link
                    </a>
                  </>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
