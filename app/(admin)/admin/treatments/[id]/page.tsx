import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getSignedUrlsForAdminPhotos,
  getTreatmentByIdForAdmin,
} from "@/lib/admin/treatments";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AuditLogTable } from "@/components/admin/practices/AuditLogTable";
import { PracticeIdHash } from "@/components/admin/dashboard/PracticeIdHash";
import {
  PATIENT_AGE_RANGE_LABELS,
  PATIENT_SEX_LABELS,
  type PatientAgeRange,
  type PatientSex,
} from "@/lib/schemas/treatment";

export const metadata: Metadata = {
  title: "Treatment — Admin",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface AdminTreatmentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTreatmentDetailPage({
  params,
}: AdminTreatmentDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const result = await getTreatmentByIdForAdmin(id);
  if (!result) notFound();

  const { treatment, photos, adverseEvent, practice, auditLog } = result;
  const signedUrls = await getSignedUrlsForAdminPhotos(
    photos.map((p) => p.storage_path),
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          {
            label: practice
              ? `Treatment · ${practice.name}`
              : `Treatment · ${formatDate(treatment.treatment_date)}`,
          },
        ]}
      />

      {/* Header */}
      <header className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
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
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            {treatment.protocol?.title ?? "Treatment"}
          </h1>
          <p
            className="mt-3 font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatDate(treatment.treatment_date)} · Session{" "}
            {treatment.session_number} · Entered by {treatment.entered_by_name}
          </p>
        </div>
        {adverseEvent && (
          <Link
            href={`/admin/adverse-events/${adverseEvent.id}`}
            className="inline-flex items-center gap-2 rounded-md border border-[#B23B3B]/30 bg-[#FBEAEA] px-4 py-2 font-body text-small font-medium text-[#8A2C2C] transition-colors duration-[150ms] hover:bg-[#FBE0E0] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          >
            View adverse event report →
          </Link>
        )}
      </header>

      <SectionDivider />

      {/* Practice context — admin sees this; portal version hides it */}
      {practice && (
        <section>
          <Heading>Practice.</Heading>
          <dl className="grid gap-5 sm:grid-cols-3">
            <Field
              label="Practice"
              value={
                <>
                  {practice.name}
                  <span className="ml-2 inline-block align-middle">
                    <PracticeIdHash practiceId={practice.id} />
                  </span>
                </>
              }
            />
            <Field label="Primary contact" value={practice.primary_email} mono />
            <Field
              label="Logged at"
              value={formatDateTime(treatment.created_at)}
              mono
            />
          </dl>
        </section>
      )}

      <SectionDivider />

      {/* Identity */}
      <section>
        <Heading>Patient context.</Heading>
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
        <dl className="grid gap-5 sm:grid-cols-3">
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
              {treatment.maintenance_kit_recommended
                ? "Recommended"
                : "Not recommended"}
            </span>
          </li>
        </ul>
      </section>

      {treatment.notes && (
        <>
          <SectionDivider />
          <section>
            <Heading>Practitioner notes.</Heading>
            <p
              className="font-body text-ink-700 whitespace-pre-wrap"
              style={{ lineHeight: 1.65 }}
            >
              {treatment.notes}
            </p>
          </section>
        </>
      )}

      {photos.length > 0 && (
        <>
          <SectionDivider />
          <section>
            <Heading>Photos.</Heading>
            <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((p) => {
                const url = signedUrls.get(p.storage_path);
                return (
                  <li
                    key={p.id}
                    className="rounded-md border border-ink-700/15 bg-bone-50 overflow-hidden"
                  >
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={url}
                        alt={p.caption ?? p.filename}
                        className="block w-full h-auto"
                      />
                    ) : (
                      <p className="p-4 font-body text-caption text-ink-500">
                        Photo unavailable.
                      </p>
                    )}
                    {(p.capture_phase || p.caption) && (
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
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      <SectionDivider />

      {/* Audit log */}
      <section>
        <Heading>Audit log.</Heading>
        <AuditLogTable
          entries={
            auditLog as unknown as Parameters<typeof AuditLogTable>[0]["entries"]
          }
          emptyMessage="No actions recorded against this treatment."
        />
      </section>
    </div>
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
  value: React.ReactNode;
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

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
