import Link from "next/link";

import type { InboxListItem } from "@/lib/admin/inbox";
import { InboxStatusChip } from "./InboxStatusChip";
import { InboxTypeChip } from "./InboxTypeChip";

interface InboxListProps {
  items: InboxListItem[];
}

const HEADER_TRACKING = { letterSpacing: "0.18em" } as const;

export function InboxList({ items }: InboxListProps) {
  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50">
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-ink-700/10 text-left">
              <Th>Type</Th>
              <Th>Name / Email</Th>
              <Th>Context</Th>
              <Th>Status</Th>
              <Th>Received</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={`${item.type}-${item.id}`}
                className="border-b border-ink-700/5 last:border-b-0 transition-colors duration-[150ms] hover:bg-bone-100"
              >
                <Td>
                  <InboxTypeChip type={item.type} />
                </Td>
                <Td>
                  <Link
                    href={`/admin/inbox/${item.type}/${item.id}`}
                    className="block hover:text-brand-700"
                  >
                    <span className="block font-body text-small font-medium text-ink-900">
                      {item.displayName}
                    </span>
                    <span className="block font-body text-caption text-ink-500">
                      {item.displayEmail}
                    </span>
                  </Link>
                </Td>
                <Td>
                  <span className="block max-w-[28ch] truncate font-body text-small text-ink-700">
                    {item.displayContext || "—"}
                  </span>
                </Td>
                <Td>
                  <InboxStatusChip status={item.status} />
                </Td>
                <Td title={new Date(item.receivedAt).toLocaleString()}>
                  <span
                    className="font-body text-caption text-ink-700"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {formatRelative(item.receivedAt)}
                  </span>
                </Td>
                <Td>
                  {item.statusChangedAt &&
                  item.statusChangedAt !== item.receivedAt ? (
                    <span
                      className="font-body text-caption text-ink-700"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                      title={new Date(item.statusChangedAt).toLocaleString()}
                    >
                      {formatRelative(item.statusChangedAt)}
                    </span>
                  ) : (
                    <span className="font-body text-caption text-ink-300">—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-ink-700/10 md:hidden">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={`/admin/inbox/${item.type}/${item.id}`}
              className="block px-4 py-4 transition-colors duration-[150ms] hover:bg-bone-100"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <InboxTypeChip type={item.type} />
                  <InboxStatusChip status={item.status} />
                </div>
                <span
                  className="shrink-0 font-body text-caption text-ink-500"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                  title={new Date(item.receivedAt).toLocaleString()}
                >
                  {formatRelative(item.receivedAt)}
                </span>
              </div>
              <p className="font-body text-small font-medium text-ink-900">
                {item.displayName}
              </p>
              <p className="font-body text-caption text-ink-500">
                {item.displayEmail}
              </p>
              {item.displayContext && (
                <p className="mt-1 font-body text-caption text-ink-700 line-clamp-1">
                  {item.displayContext}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      scope="col"
      className="px-4 py-3 font-body text-overline font-medium uppercase text-ink-500"
      style={HEADER_TRACKING}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <td className="px-4 py-3 align-top" title={title}>
      {children}
    </td>
  );
}

// Relative time without pulling a dep — minutes/hours/days/months.
function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.round(mo / 12);
  return `${yr}y ago`;
}
