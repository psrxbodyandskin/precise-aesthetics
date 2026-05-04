import { BackToLibraryLink } from "./BackToLibraryLink";
import { PrintButton } from "./PrintButton";

interface ProtocolReadingHeaderProps {
  title: string;
  shortDescription: string | null;
  indicationCategoryTitle: string | null;
  currentVersion: string | null;
  lastPublishedAt: string | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ProtocolReadingHeader({
  title,
  shortDescription,
  indicationCategoryTitle,
  currentVersion,
  lastPublishedAt,
}: ProtocolReadingHeaderProps) {
  return (
    <header>
      <div className="flex items-center justify-between gap-4 print-hide">
        <BackToLibraryLink />
        <PrintButton />
      </div>

      <p
        className="mt-8 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {indicationCategoryTitle ?? "Uncategorized"}
        {currentVersion ? ` · v${currentVersion}` : ""}
      </p>

      <h1
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "clamp(1.75rem, 2.5vw + 1rem, 2.75rem)",
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          fontWeight: 400,
        }}
      >
        {title}
      </h1>

      {shortDescription && (
        <p
          className="mt-5 max-w-[64ch] font-body text-ink-700"
          style={{ fontSize: "1.0625rem", lineHeight: 1.6 }}
        >
          {shortDescription}
        </p>
      )}

      <p
        className="mt-5 font-body text-caption text-ink-500"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {lastPublishedAt && <>Last published {formatDate(lastPublishedAt)}</>}
        {lastPublishedAt && currentVersion && " · "}
        {currentVersion && <>Version {currentVersion}</>}
      </p>
    </header>
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
