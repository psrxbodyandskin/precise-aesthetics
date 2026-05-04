import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { listTreatmentsForPractice } from "@/lib/portal/treatments";
import { PortalShell } from "@/components/portal/PortalShell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Treatments — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function TreatmentsPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived")
    redirect("/portal/login?error=account_inactive");

  const treatments = await listTreatmentsForPractice({ limit: 100 });

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
              Recent treatments logged by your practice.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="primary" size="md">
              <Link href="/portal/treatments/new">+ New treatment</Link>
            </Button>
          </div>
        </header>

        <section className="mt-10">
          {treatments.length > 0 ? (
            <ul className="space-y-3">
              {treatments.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/portal/treatments/${t.id}`}
                    className="block rounded-md border border-ink-700/15 bg-bone-50 p-5 transition-colors duration-[150ms] hover:border-ink-700/30 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="font-display text-h5 leading-heading text-ink-900">
                        {t.protocol?.title ?? "Protocol"}
                      </p>
                      <p
                        className="font-body text-caption text-ink-500"
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {formatDate(t.treatment_date)}
                        {" · v"}
                        {t.protocol_version_label}
                      </p>
                    </div>
                    <p
                      className="mt-2 font-body text-caption text-ink-500"
                      style={{ lineHeight: 1.55 }}
                    >
                      {t.indication} · Fitz {t.patient_fitzpatrick} · Session {t.session_number} · Entered by {t.entered_by_name}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-md border border-ink-700/15 bg-bone-50 px-8 py-16 text-center">
              <p
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                No treatments yet
              </p>
              <h2 className="mt-3 font-display text-h4 leading-heading text-ink-900">
                Log your first treatment.
              </h2>
              <p
                className="mx-auto mt-3 max-w-[44ch] font-body text-ink-700"
                style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}
              >
                Each log contributes to system-wide pattern recognition and
                helps refine the protocols you rely on.
              </p>
              <div className="mt-5">
                <Button asChild variant="primary" size="md">
                  <Link href="/portal/treatments/new">Log a treatment</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        {treatments.length > 0 && (
          <p className="mt-8 font-body text-caption text-ink-500">
            Showing {treatments.length} treatment{treatments.length === 1 ? "" : "s"}.
          </p>
        )}
      </article>
    </PortalShell>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
