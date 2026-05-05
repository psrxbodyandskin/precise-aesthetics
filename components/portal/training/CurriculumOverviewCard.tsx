import Link from "next/link";
import { ArrowRight, Award, GraduationCap, ScrollText } from "lucide-react";

import { CertificationStatusBadge } from "@/components/admin/training/CertificationStatusBadge";
import type { PortalCurriculumOverview } from "@/lib/portal/training";

interface CurriculumOverviewCardProps {
  overview: PortalCurriculumOverview;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function CurriculumOverviewCard({
  overview,
}: CurriculumOverviewCardProps) {
  const { curriculum, certification, modules_completed, modules_required } =
    overview;

  if (!curriculum) {
    return (
      <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-6">
        <div className="flex items-center gap-3">
          <GraduationCap
            className="size-5 text-ink-500"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {overview.device_display_name}
          </p>
        </div>
        <p className="mt-3 font-body text-ink-700">
          Training curriculum coming soon.
        </p>
      </div>
    );
  }

  const isCertified =
    certification?.status === "certified" &&
    (!certification.expires_at ||
      new Date(certification.expires_at).getTime() > Date.now());

  const recertFlagged = certification?.recert_required ?? false;

  const progressPercent = modules_required
    ? Math.round((modules_completed / modules_required) * 100)
    : 0;

  return (
    <div className="rounded-md border border-ink-700/15 bg-bone-50 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <GraduationCap
            className="size-5 text-ink-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            {overview.device_display_name}
          </p>
        </div>
        <CertificationStatusBadge
          status={
            certification?.status ?? "not_started"
          }
        />
      </div>

      <h3
        className="mt-3 font-display text-ink-900"
        style={{
          fontSize: "1.5rem",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        {curriculum.title}
      </h3>
      {curriculum.description && (
        <p
          className="mt-2 font-body text-small text-ink-700"
          style={{ lineHeight: 1.55 }}
        >
          {curriculum.description}
        </p>
      )}

      {/* Progress bar */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between font-body text-caption text-ink-500">
          <span>Progress</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {modules_completed} of {modules_required} required modules
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
          <div
            className="h-full bg-brand-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {recertFlagged && (
        <p
          className="mt-4 rounded-sm border-l-2 border-[#B23B3B]/40 bg-[#FBEAEA]/40 px-3 py-2 font-body text-caption text-[#8A2C2C]"
        >
          Re-certification requested.
          {certification?.recert_reason
            ? ` Reason: ${certification.recert_reason}`
            : ""}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/portal/training/${curriculum.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-midnight-800 px-3 font-body text-small font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
        >
          {isCertified
            ? "Review training"
            : modules_completed > 0
              ? "Continue training"
              : "Start training"}
          <ArrowRight
            className="size-3.5"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </Link>

        {isCertified && (
          <Link
            href={`/portal/certificates/${overview.device_id}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-small font-medium text-ink-700 transition-colors duration-[150ms] hover:border-ink-700/35 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          >
            <Award className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            View certificate
          </Link>
        )}
      </div>

      {certification?.certified_at && (
        <p
          className="mt-3 font-body text-caption text-ink-500"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <ScrollText
            className="mr-1 inline-block size-3"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          Certified {new Date(certification.certified_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
