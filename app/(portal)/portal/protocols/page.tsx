import type { Metadata } from "next";
import Link from "next/link";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { redirect } from "next/navigation";
import {
  getEmptyStateCounts,
  listProtocolsForPractice,
  listVisibleIndications,
} from "@/lib/portal/protocols";
import { parseFiltersFromSearchParams, hasActiveFilters } from "@/lib/portal/filters";
import { PortalShell } from "@/components/portal/PortalShell";
import { ProtocolCard } from "@/components/portal/protocols/ProtocolCard";
import { ProtocolLibraryFilters } from "@/components/portal/protocols/ProtocolLibraryFilters";

export const metadata: Metadata = {
  title: "Protocols — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface ProtocolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProtocolsPage({
  searchParams,
}: ProtocolsPageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) {
    redirect("/portal/login?error=no_practice");
  }
  if (practice.status === "pending") {
    redirect("/portal/setup");
  }
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const sp = await searchParams;
  const filters = parseFiltersFromSearchParams(sp);

  const [protocols, indications, counts] = await Promise.all([
    listProtocolsForPractice(filters),
    listVisibleIndications(),
    getEmptyStateCounts(),
  ]);

  const filtersActive = hasActiveFilters(filters);

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[1200px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Protocol library
          </p>
          <h1
            className="mt-4 font-display text-ink-900"
            style={{
              fontSize: "clamp(2rem, 2.5vw + 1rem, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            Protocols.
          </h1>
          <p
            className="mt-4 max-w-[58ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            The current protocol library for your practice. Filter by
            indication or skin type to find what you need.
          </p>
        </header>

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-20 -mx-6 mt-10 border-y border-ink-700/15 bg-bone-100/95 px-6 py-4 backdrop-blur md:-mx-12 md:px-12">
          <ProtocolLibraryFilters indications={indications} />
        </div>

        {/* Results */}
        <section className="mt-10">
          {protocols.length > 0 ? (
            <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {protocols.map((p) => (
                <li key={p.id}>
                  <ProtocolCard
                    protocol={{
                      id: p.id,
                      title: p.title,
                      slug: p.slug,
                      short_description: p.short_description,
                      indication_tags: p.indication_tags ?? [],
                      fitzpatrick_types: p.fitzpatrick_types ?? [],
                      current_version: p.current_version,
                      last_published_at: p.last_published_at,
                      indication_category: p.indication_category,
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              filtersActive={filtersActive}
              ownedDeviceCount={counts.ownedDeviceCount}
              visibleProtocolCount={counts.visibleProtocolCount}
            />
          )}
        </section>

        {protocols.length > 0 && (
          <p className="mt-8 font-body text-caption text-ink-500">
            Showing {protocols.length} protocol
            {protocols.length === 1 ? "" : "s"}.
          </p>
        )}
      </article>
    </PortalShell>
  );
}

// Three distinct empty states (per spec callout A):
//   - No devices on file → contact us
//   - Devices owned, no protocols visible → reassurance
//   - Filters exclude all → clear filters
function EmptyState({
  filtersActive,
  ownedDeviceCount,
  visibleProtocolCount,
}: {
  filtersActive: boolean;
  ownedDeviceCount: number;
  visibleProtocolCount: number;
}) {
  if (filtersActive && visibleProtocolCount > 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          No matches
        </p>
        <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
          No protocols match these filters.
        </h2>
        <p
          className="mx-auto mt-3 max-w-[42ch] font-body text-ink-700"
          style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
        >
          Try clearing one or more filters.
        </p>
        <Link
          href="/portal/protocols"
          className="mt-5 inline-block font-body text-small text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  if (ownedDeviceCount === 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          No devices on file
        </p>
        <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
          No devices on file for your practice.
        </h2>
        <p
          className="mx-auto mt-3 max-w-[42ch] font-body text-ink-700"
          style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
        >
          Protocols are tied to the devices your practice owns. Contact us
          to register a device and we&rsquo;ll surface the matching library.
        </p>
        <Link
          href="/contact"
          className="mt-5 inline-block font-body text-small text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          Contact us
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
      <p
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        Library
      </p>
      <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
        No protocols available yet.
      </h2>
      <p
        className="mx-auto mt-3 max-w-[44ch] font-body text-ink-700"
        style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
      >
        New protocols appear here as they&rsquo;re published for your
        devices.
      </p>
    </div>
  );
}
