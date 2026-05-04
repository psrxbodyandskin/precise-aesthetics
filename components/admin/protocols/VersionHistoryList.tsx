interface VersionRow {
  id: string;
  version: string;
  title: string;
  short_description: string | null;
  published_at: string;
  published_by: string | null;
}

interface VersionHistoryListProps {
  versions: VersionRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function VersionHistoryList({ versions }: VersionHistoryListProps) {
  if (versions.length === 0) {
    return (
      <p className="font-body text-caption text-ink-500">
        No published versions yet. The first publish from Sanity Studio
        will create version 1.0.
      </p>
    );
  }

  return (
    <ol className="space-y-5">
      {versions.map((v) => (
        <li
          key={v.id}
          className="flex gap-5 border-l border-ink-700/15 pl-5"
        >
          <span
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={{ ...EYEBROW_TRACKING, fontVariantNumeric: "tabular-nums" }}
          >
            v{v.version}
          </span>
          <div>
            <p className="font-body text-small font-medium text-ink-900">
              {v.title}
            </p>
            {v.short_description && (
              <p
                className="mt-1 font-body text-caption text-ink-500"
                style={{ lineHeight: 1.55 }}
              >
                {v.short_description}
              </p>
            )}
            <p className="mt-1 font-body text-caption text-ink-500">
              Published {formatDate(v.published_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
