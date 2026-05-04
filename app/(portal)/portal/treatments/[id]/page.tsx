import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getTreatmentByIdForPractice } from "@/lib/portal/treatments";
import { getServiceClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/PortalShell";
import {
  PATIENT_AGE_RANGE_LABELS,
  PATIENT_SEX_LABELS,
  type PatientAgeRange,
  type PatientSex,
} from "@/lib/schemas/treatment";

export const metadata: Metadata = {
  title: "Treatment — Precise Aesthetics",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);

  if (!practice) redirect("/portal/login?error=no_practice");
  if (practice.status === "pending") redirect("/portal/setup");
  if (practice.status === "suspended" || practice.status === "archived")
    redirect("/portal/login?error=account_inactive");

  const { id } = await params;
  const result = await getTreatmentByIdForPractice(id);
  if (!result) notFound();
  const { treatment, photos } = result;

  // Generate signed URLs for photos (storage is private)
  const supabase = getServiceClient();
  const photoUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from("treatment-photos")
        .createSignedUrl(p.storage_path, 60 * 60); // 1 hour
      return { ...p, signedUrl: data?.signedUrl ?? null };
    }),
  );

  // Protocol relational join may be array
  const protoRaw = (treatment as unknown as { protocol: unknown }).protocol;
  const protocol = Array.isArray(protoRaw)
    ? (protoRaw[0] ?? null)
    : (protoRaw as { title: string; slug: string } | null);

  return (
    <PortalShell practiceName={practice.name}>
      <article className="mx-auto max-w-[720px] px-6 pt-12 pb-24 md:px-12 md:pt-16 md:pb-32">
        <div className="mb-6">
          <Link
            href="/portal/treatments"
            className="font-body text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
          >
            ← Back to treatments
          </Link>
        </div>

        <div aria-hidden="true" className="mb-8 flex">
          <span className="block h-px w-[60px] bg-brand-500/50" />
        </div>

        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Treatment
            {treatment.protocol_version_label && (
              <>
                {" · v"}
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {treatment.protocol_version_label}
                </span>
              </>
            )}
          </p>
          <h1
            className="mt-4 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            {protocol?.title ?? "Treatment"}
          </h1>
          <p
            className="mt-4 font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatDate(treatment.treatment_date)} · Session{" "}
            {treatment.session_number} · Entered by{" "}
            {treatment.entered_by_name}
          </p>
        </header>

        <SectionDivider />

        {/* Identity */}
        <section>
          <Heading>Identity.</Heading>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Indication" value={treatment.indication} />
            <Field
              label="Treatment site"
              value={treatment.treatment_site ?? "—"}
            />
            <Field
              label="Patient Fitzpatrick"
              value={`Type ${treatment.patient_fitzpatrick}`}
            />
            <Field
              label="Age range"
              value={
                PATIENT_AGE_RANGE_LABELS[
                  treatment.patient_age_range as PatientAgeRange
                ] ?? treatment.patient_age_range
              }
            />
            {treatment.patient_sex && (
              <Field
                label="Sex"
                value={
                  PATIENT_SEX_LABELS[treatment.patient_sex as PatientSex] ??
                  treatment.patient_sex
                }
              />
            )}
            {treatment.patient_anon_id && (
              <Field
                label="Anonymous patient ID"
                value={treatment.patient_anon_id}
                mono
              />
            )}
          </dl>
        </section>

        <SectionDivider />

        {/* Parameters */}
        <section>
          <Heading>Parameters delivered.</Heading>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Wavelength"
              value={treatment.wavelength_nm ? `${treatment.wavelength_nm} nm` : "—"}
              mono
            />
            <Field
              label="Fluence"
              value={
                treatment.fluence_j_per_cm2 !== null
                  ? `${treatment.fluence_j_per_cm2} J/cm²`
                  : "—"
              }
              mono
            />
            <Field
              label="Pulse duration"
              value={
                treatment.pulse_duration_ps !== null
                  ? `${treatment.pulse_duration_ps} ps`
                  : "—"
              }
              mono
            />
            <Field
              label="Spot size"
              value={
                treatment.spot_size_mm !== null
                  ? `${treatment.spot_size_mm} mm`
                  : "—"
              }
              mono
            />
            {treatment.total_pulses !== null && (
              <Field
                label="Total pulses"
                value={String(treatment.total_pulses)}
                mono
              />
            )}
            {treatment.treatment_duration_minutes !== null && (
              <Field
                label="Duration"
                value={`${treatment.treatment_duration_minutes} min`}
                mono
              />
            )}
          </dl>
        </section>

        {treatment.protocol_deviation && treatment.protocol_deviation_reason && (
          <>
            <SectionDivider />
            <section>
              <Heading>Protocol deviation.</Heading>
              <p className="font-body text-ink-700" style={{ lineHeight: 1.65 }}>
                {treatment.protocol_deviation_reason}
              </p>
            </section>
          </>
        )}

        <SectionDivider />

        {/* Biologic control */}
        <section>
          <Heading>Biologic control.</Heading>
          <ul className="space-y-2">
            <li className="font-body text-small text-ink-700">
              Prep kit:{" "}
              <span className="text-ink-900">
                {treatment.prep_kit_used ? "Used" : "Not used"}
              </span>
            </li>
            <li className="font-body text-small text-ink-700">
              Recovery kit:{" "}
              <span className="text-ink-900">
                {treatment.recovery_kit_dispensed ? "Dispensed" : "Not dispensed"}
              </span>
            </li>
            <li className="font-body text-small text-ink-700">
              Maintenance kit:{" "}
              <span className="text-ink-900">
                {treatment.maintenance_kit_recommended ? "Recommended" : "Not recommended"}
              </span>
            </li>
          </ul>
        </section>

        {treatment.notes && (
          <>
            <SectionDivider />
            <section>
              <Heading>Notes.</Heading>
              <p className="font-body text-ink-700 whitespace-pre-wrap" style={{ lineHeight: 1.65 }}>
                {treatment.notes}
              </p>
            </section>
          </>
        )}

        {photoUrls.length > 0 && (
          <>
            <SectionDivider />
            <section>
              <Heading>Photos.</Heading>
              <ul className="grid gap-3 sm:grid-cols-2">
                {photoUrls.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-md border border-ink-700/15 bg-bone-50 overflow-hidden"
                  >
                    {p.signedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.signedUrl}
                        alt={p.caption ?? p.filename}
                        className="block w-full h-auto"
                      />
                    ) : (
                      <p className="p-4 font-body text-caption text-ink-500">
                        Photo unavailable.
                      </p>
                    )}
                    <div className="p-3">
                      {p.capture_phase && (
                        <p
                          className="font-body text-overline font-medium uppercase text-ink-500"
                          style={EYEBROW_TRACKING}
                        >
                          {p.capture_phase}
                        </p>
                      )}
                      {p.caption && (
                        <p
                          className="mt-1 font-body text-caption text-ink-700"
                          style={{ lineHeight: 1.55 }}
                        >
                          {p.caption}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </article>
    </PortalShell>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display text-ink-900 mb-5"
      style={{
        fontSize: "1.5rem",
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
        fontWeight: 400,
      }}
    >
      {children}
    </h2>
  );
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="my-12 flex justify-center">
      <span className="block h-px w-[60px] bg-brand-500/30" />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </dt>
      <dd
        className="mt-2 font-body text-small text-ink-900"
        style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
      >
        {value}
      </dd>
    </div>
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
