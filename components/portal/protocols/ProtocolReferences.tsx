import type { ProtocolReference } from "@/lib/sanity/types";

interface ProtocolReferencesProps {
  references: ProtocolReference[];
}

// Numbered citation list. Uses a CSS counter on a manual <ol> so print
// preserves numbering (browser print can lose decimal-list-style on
// some prints; counters are bullet-proof).
export function ProtocolReferences({ references }: ProtocolReferencesProps) {
  if (references.length === 0) return null;

  return (
    <ol className="space-y-5 [counter-reset:ref] list-none p-0">
      {references.map((r) => (
        <li
          key={r._key}
          className="flex gap-4 [counter-increment:ref]"
        >
          <span
            aria-hidden="true"
            className="flex-shrink-0 font-body text-overline font-medium uppercase text-ink-500"
            style={{
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.18em",
            }}
          >
            {/* CSS counter — renders as 01., 02., etc. */}
            <span
              style={{ display: "inline-block", minWidth: "2ch" }}
              className="before:content-[counter(ref,decimal-leading-zero)]"
            />
          </span>
          <div className="flex-1">
            <p
              className="font-body text-ink-700"
              style={{ fontSize: "0.9375rem", lineHeight: 1.65 }}
            >
              {r.citation}
            </p>
            {r.url && (
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-body text-caption text-brand-700 underline-offset-[3px] decoration-1 hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm print:text-ink-700 print:underline"
              >
                {r.url}
              </a>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
