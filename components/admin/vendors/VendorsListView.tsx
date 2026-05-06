import Link from "next/link";

import type { VendorRow } from "@/lib/admin/vendors";
import { VendorCategoryChip } from "./VendorCategoryChip";
import { VendorStatusChip } from "./VendorStatusChip";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface VendorsListViewProps {
  items: VendorRow[];
}

export function VendorsListView({ items }: VendorsListViewProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-12 text-center">
        <p className="font-body text-small text-ink-700">No vendors match.</p>
        <p
          className="mt-2 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Adjust filters or click &ldquo;New vendor&rdquo; to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
      <table className="w-full font-body text-small">
        <thead>
          <tr className="border-b border-ink-700/10">
            <th
              className="px-4 py-3 text-left text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Name
            </th>
            <th
              className="px-4 py-3 text-left text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Category
            </th>
            <th
              className="px-4 py-3 text-left text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Contact
            </th>
            <th
              className="px-4 py-3 text-left text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Status
            </th>
            <th
              className="px-4 py-3 text-right text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Updated
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr
              key={v.id}
              className="border-b border-ink-700/5 transition-colors duration-[150ms] last:border-0 hover:bg-bone-100/40"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/vendors/${v.id}`}
                  className="font-medium text-ink-900 underline-offset-[3px] decoration-1 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] hover:underline"
                >
                  {v.name}
                </Link>
                {v.description && (
                  <p
                    className="mt-1 font-body text-caption text-ink-500"
                    style={{ lineHeight: 1.5 }}
                  >
                    {truncate(v.description, 80)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                <VendorCategoryChip category={v.category} />
              </td>
              <td className="px-4 py-3 text-ink-700">
                {v.contact_name ? (
                  <span>
                    {v.contact_name}
                    {v.contact_email && (
                      <span className="block font-body text-caption text-ink-500">
                        {v.contact_email}
                      </span>
                    )}
                  </span>
                ) : v.contact_email ? (
                  <span>{v.contact_email}</span>
                ) : (
                  <span className="text-ink-300">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <VendorStatusChip status={v.status} />
              </td>
              <td
                className="px-4 py-3 text-right text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {new Date(v.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
