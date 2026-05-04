import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import {
  getDistinctIndicationsForPractice,
  getDistinctProtocolsForPractice,
  listFilteredTreatmentsForPractice,
} from "@/lib/portal/treatments";
import {
  hasActiveTreatmentFilters,
  parseTreatmentFiltersFromSearchParams,
} from "@/lib/portal/filters";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";
import { TreatmentsFilterBar } from "@/components/portal/treatments/TreatmentsFilterBar";
import { TreatmentsTable } from "@/components/portal/treatments/TreatmentsTable";
import { TreatmentsCardList } from "@/components/portal/treatments/TreatmentsCardList";
import { EmptyTreatmentsState } from "@/components/portal/treatments/EmptyTreatmentsState";
import { TreatmentsPagination } from "@/components/portal/treatments/TreatmentsPagination";

export const metadata: Metadata = {
  title: "Treatments — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface TreatmentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TreatmentsPage({
  searchParams,
}: TreatmentsPageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived")
    redirect("/portal/login?error=account_inactive");

  const sp = await searchParams;
  const filters = parseTreatmentFiltersFromSearchParams(sp);

  const [{ treatments, total, page, pageSize }, protocolOptions, indicationOptions] =
    await Promise.all([
      listFilteredTreatmentsForPractice(filters),
      getDistinctProtocolsForPractice(),
      getDistinctIndicationsForPractice(),
    ]);

  const filtersActive = hasActiveTreatmentFilters(filters);
  const showEmpty = treatments.length === 0;
  const emptyVariant: "no-treatments-yet" | "no-filter-matches" =
    !filtersActive && total === 0 ? "no-treatments-yet" : "no-filter-matches";

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[1200px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Treatments
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
              Treatments.
            </h1>
            <p
              className="mt-4 max-w-[58ch] font-body text-ink-700"
              style={{ fontSize: "1rem", lineHeight: 1.65 }}
            >
              All treatments logged by your practice. Filter by date,
              protocol, or indication.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="primary" size="md">
              <Link href="/portal/treatments/new">+ Log treatment</Link>
            </Button>
          </div>
        </header>

        <div className="sticky top-0 z-20 -mx-6 mt-10 border-y border-ink-700/15 bg-bone-100/95 px-6 py-4 backdrop-blur md:-mx-12 md:px-12">
          <TreatmentsFilterBar
            protocols={protocolOptions}
            indications={indicationOptions}
          />
        </div>

        <section className="mt-10">
          {showEmpty ? (
            <EmptyTreatmentsState variant={emptyVariant} />
          ) : (
            <>
              <TreatmentsTable rows={treatments} />
              <TreatmentsCardList rows={treatments} />
              <TreatmentsPagination
                page={page}
                pageSize={pageSize}
                total={total}
              />
            </>
          )}
        </section>

        {!showEmpty && (
          <p
            className="mt-6 font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            Showing {(page - 1) * pageSize + 1}–
            {(page - 1) * pageSize + treatments.length} of {total} treatment
            {total === 1 ? "" : "s"}.
          </p>
        )}
      </article>
    </PortalShell>
  );
}
