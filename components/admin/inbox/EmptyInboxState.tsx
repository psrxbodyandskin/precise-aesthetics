import Link from "next/link";

interface EmptyInboxStateProps {
  /** When true, the empty state explains why filters returned nothing.
   *  When false, the inbox is genuinely empty (no submissions yet). */
  filtered: boolean;
}

export function EmptyInboxState({ filtered }: EmptyInboxStateProps) {
  if (filtered) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-6 py-10 text-center">
        <p className="font-body text-ink-700">
          No items match these filters.
        </p>
        <p className="mt-2 font-body text-caption text-ink-500">
          Try clearing one or more filters to widen the view.
        </p>
        <div className="mt-4">
          <Link
            href="/admin/inbox"
            className="font-body text-small font-medium text-brand-700 underline-offset-2 hover:underline"
          >
            Clear filters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 px-6 py-12 text-center">
      <p className="font-body text-ink-700">No inbound yet.</p>
      <p className="mt-2 font-body text-caption text-ink-500">
        Submissions from the marketing site appear here as they arrive.
      </p>
    </div>
  );
}
