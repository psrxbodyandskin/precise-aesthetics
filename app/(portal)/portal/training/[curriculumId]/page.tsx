import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getCurriculumForPractice } from "@/lib/portal/training";
import { listAuthorizedUsersForPractice } from "@/lib/portal/treatments";
import { PortalShell } from "@/components/portal/PortalShell";
import { CurriculumModulesClient } from "@/components/portal/training/CurriculumModulesClient";

export const metadata: Metadata = {
  title: "Curriculum — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface CurriculumPageProps {
  params: Promise<{ curriculumId: string }>;
}

export default async function PortalCurriculumPage({
  params,
}: CurriculumPageProps) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived") {
    redirect("/portal/login?error=account_inactive");
  }

  const { curriculumId } = await params;

  const [detail, authorizedUsers] = await Promise.all([
    getCurriculumForPractice({
      curriculumId,
      practiceId: practice.id,
    }),
    listAuthorizedUsersForPractice(),
  ]);
  if (!detail) notFound();

  // Per-user progress (header + module list) is rendered inside the
  // client wrapper so it can follow the picker selection.

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[900px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <p
          className="mb-3 font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          <Link
            href="/portal/training"
            className="hover:text-ink-900 underline-offset-2 hover:underline"
          >
            ← All training
          </Link>
        </p>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {detail.device?.display_name ?? "Curriculum"}
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            {detail.curriculum.title}
          </h1>
          {detail.curriculum.description && (
            <p
              className="mt-3 max-w-[58ch] font-body text-ink-700"
              style={{ lineHeight: 1.65 }}
            >
              {detail.curriculum.description}
            </p>
          )}
        </header>

        <div className="mt-12">
          <CurriculumModulesClient
            detail={detail}
            practiceId={practice.id}
            authorizedUsers={authorizedUsers}
          />
        </div>
      </article>
    </PortalShell>
  );
}
