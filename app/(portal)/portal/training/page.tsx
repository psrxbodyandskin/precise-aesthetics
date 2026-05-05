import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { listCurriculaForPractice } from "@/lib/portal/training";
import { listAuthorizedUsersForPractice } from "@/lib/portal/treatments";
import { PortalShell } from "@/components/portal/PortalShell";
import { CurriculaOverviewClient } from "@/components/portal/training/CurriculaOverviewClient";

export const metadata: Metadata = {
  title: "Training — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function PortalTrainingPage() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const [overviews, authorizedUsers] = await Promise.all([
    listCurriculaForPractice(practice.id),
    listAuthorizedUsersForPractice(),
  ]);

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[1000px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Training
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
            Training.
          </h1>
          <p
            className="mt-4 max-w-[58ch] font-body text-ink-700"
            style={{ fontSize: "1rem", lineHeight: 1.65 }}
          >
            Each practitioner has their own training and certification.
            Complete the modules to unlock treatment logging for your devices.
          </p>
        </header>

        <section className="mt-12">
          <CurriculaOverviewClient
            practiceId={practice.id}
            authorizedUsers={authorizedUsers}
            overviews={overviews}
          />
        </section>
      </article>
    </PortalShell>
  );
}
