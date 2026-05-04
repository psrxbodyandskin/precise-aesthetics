import Link from "next/link";
import { FitzpatrickChipRow } from "./FitzpatrickChipRow";

interface ProtocolCardProps {
  protocol: {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    indication_tags: string[];
    fitzpatrick_types: string[];
    current_version: string | null;
    last_published_at: string | null;
    indication_category: { id: string; title: string; slug: string } | null;
  };
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;
const RECENT_DAYS = 14;

// One protocol summarized for the library list. Card is the link target —
// entire surface clickable. Information density tuned for chair-side
// scanning, not editorial browsing.
//
// Recently-updated dot: subtle filled brand-300 dot left of the version
// chip. Triggered when last_published_at is within 14 days. Per spec
// callout B — must NOT feel "new!"-energy. Brand-300 is the lowest-
// saturation positive accent.
export function ProtocolCard({ protocol }: ProtocolCardProps) {
  const recentlyUpdated = isRecentlyUpdated(protocol.last_published_at);

  return (
    <Link
      href={`/portal/protocols/${protocol.slug}`}
      className="group relative block rounded-md border border-ink-700/15 bg-bone-50 p-6 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] md:p-6"
    >
      {/* Top row: status dot + version chip */}
      <div className="mb-4 flex items-center gap-2">
        {recentlyUpdated && (
          <span
            aria-hidden="true"
            className="inline-block size-2 rounded-full bg-brand-300"
            title="Updated recently"
          />
        )}
        {protocol.current_version && (
          <span
            className="inline-flex items-center rounded-sm border border-ink-700/15 bg-bone-100 px-1.5 py-0.5 font-body text-caption font-medium text-ink-700"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            v{protocol.current_version}
          </span>
        )}
      </div>

      <h2 className="font-display text-ink-900 leading-heading" style={{ fontSize: "1.375rem", letterSpacing: "-0.01em" }}>
        {protocol.title}
      </h2>

      {protocol.indication_category && (
        <p
          className="mt-2 font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          {protocol.indication_category.title}
        </p>
      )}

      <div className="mt-4">
        <FitzpatrickChipRow
          applicable={protocol.fitzpatrick_types}
          compact
        />
      </div>

      {protocol.short_description && (
        <p
          className="mt-4 font-body text-ink-700 line-clamp-2"
          style={{ fontSize: "0.9375rem", lineHeight: 1.55 }}
        >
          {protocol.short_description}
        </p>
      )}

      {protocol.last_published_at && (
        <p
          className="mt-5 border-t border-ink-700/10 pt-3 font-body text-caption text-ink-500"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          Updated {formatDate(protocol.last_published_at)}
        </p>
      )}
    </Link>
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

function isRecentlyUpdated(iso: string | null): boolean {
  if (!iso) return false;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return false;
  const ageMs = Date.now() - then;
  return ageMs <= RECENT_DAYS * 24 * 60 * 60 * 1000;
}
