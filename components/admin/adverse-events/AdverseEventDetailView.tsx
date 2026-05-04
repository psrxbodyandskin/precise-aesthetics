"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ADVERSE_EVENT_STATUSES,
  PATIENT_AGE_RANGE_LABELS,
  PATIENT_SEX_LABELS,
  type AdverseEventStatus,
  type PatientAgeRange,
  type PatientSex,
} from "@/lib/schemas/treatment";
import { cn } from "@/lib/utils";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

const STATUS_LABEL: Record<AdverseEventStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  addressed: "Addressed",
};
const STATUS_STYLE: Record<AdverseEventStatus, string> = {
  new: "bg-[#FBEAEA] text-[#8A2C2C] ring-1 ring-inset ring-[#B23B3B]/30",
  reviewing: "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/20",
  addressed: "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
};

interface AdverseRow {
  id: string;
  created_at: string;
  status: AdverseEventStatus;
  description: string;
  admin_notes: string | null;
  status_changed_at: string | null;
  treatment_id: string;
  practice: { id: string; name: string; primary_email: string } | null;
  treatment: {
    treatment_date: string;
    indication: string;
    treatment_site: string | null;
    patient_fitzpatrick: string;
    patient_age_range: string;
    patient_sex: string | null;
    session_number: number;
    entered_by_name: string;
    protocol_version_label: string;
    wavelength_nm: number | null;
    fluence_j_per_cm2: number | null;
    pulse_duration_ps: number | null;
    spot_size_mm: number | null;
    total_pulses: number | null;
    treatment_duration_minutes: number | null;
    notes: string | null;
    protocol: { title: string; slug: string } | { title: string; slug: string }[] | null;
  } | null;
}

interface PhotoRow {
  id: string;
  storage_path: string;
  filename: string;
  capture_phase: string | null;
  caption: string | null;
  signedUrl: string | null;
}

interface AdverseEventDetailViewProps {
  adverse: AdverseRow;
  photos: PhotoRow[];
}

export function AdverseEventDetailView({
  adverse,
  photos,
}: AdverseEventDetailViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adminNotes, setAdminNotes] = useState(adverse.admin_notes ?? "");

  const protoRaw = adverse.treatment?.protocol;
  const protocol = Array.isArray(protoRaw) ? protoRaw[0] : protoRaw;

  function setStatus(next: AdverseEventStatus) {
    if (next === adverse.status) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/adverse-events/${adverse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not update status.");
        return;
      }
      toast.success(`Marked ${STATUS_LABEL[next]}.`);
      router.refresh();
    });
  }

  function saveNotes() {
    if ((adverse.admin_notes ?? "") === adminNotes) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/adverse-events/${adverse.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save notes.");
        return;
      }
      toast.success("Notes saved.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Adverse event · {formatDateLong(adverse.created_at)}
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
            {adverse.practice?.name ?? "Practice"}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
                STATUS_STYLE[adverse.status],
              )}
              style={{ letterSpacing: "0.08em" }}
            >
              {STATUS_LABEL[adverse.status]}
            </span>
            {adverse.treatment && (
              <span
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Treatment date {formatDateShort(adverse.treatment.treatment_date)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {ADVERSE_EVENT_STATUSES.filter((s) => s !== adverse.status).map((s) => (
            <Button
              key={s}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStatus(s)}
              disabled={pending}
              suppressHydrationWarning
            >
              {pending ? "Saving…" : `Mark ${STATUS_LABEL[s]}`}
            </Button>
          ))}
        </div>
      </header>

      {/* Description */}
      <section>
        <Heading>Description.</Heading>
        <p
          className="font-body text-ink-900 whitespace-pre-wrap rounded-md border border-ink-700/15 bg-bone-50 p-5"
          style={{ fontSize: "1rem", lineHeight: 1.65 }}
        >
          {adverse.description}
        </p>
      </section>

      {/* Treatment context */}
      {adverse.treatment && (
        <section>
          <Heading>Treatment context.</Heading>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Protocol"
              value={`${protocol?.title ?? "—"}${
                adverse.treatment.protocol_version_label
                  ? ` · v${adverse.treatment.protocol_version_label}`
                  : ""
              }`}
            />
            <Field label="Indication" value={adverse.treatment.indication} />
            <Field
              label="Patient Fitzpatrick"
              value={`Type ${adverse.treatment.patient_fitzpatrick}`}
            />
            <Field
              label="Age range"
              value={
                PATIENT_AGE_RANGE_LABELS[
                  adverse.treatment.patient_age_range as PatientAgeRange
                ] ?? adverse.treatment.patient_age_range
              }
            />
            {adverse.treatment.patient_sex && (
              <Field
                label="Sex"
                value={
                  PATIENT_SEX_LABELS[
                    adverse.treatment.patient_sex as PatientSex
                  ] ?? adverse.treatment.patient_sex
                }
              />
            )}
            <Field
              label="Session"
              value={String(adverse.treatment.session_number)}
              mono
            />
            <Field
              label="Entered by"
              value={adverse.treatment.entered_by_name}
            />
            {adverse.treatment.treatment_site && (
              <Field
                label="Treatment site"
                value={adverse.treatment.treatment_site}
              />
            )}
          </dl>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="Wavelength"
              value={
                adverse.treatment.wavelength_nm
                  ? `${adverse.treatment.wavelength_nm} nm`
                  : "—"
              }
              mono
            />
            <Field
              label="Fluence"
              value={
                adverse.treatment.fluence_j_per_cm2 !== null
                  ? `${adverse.treatment.fluence_j_per_cm2} J/cm²`
                  : "—"
              }
              mono
            />
            <Field
              label="Pulse duration"
              value={
                adverse.treatment.pulse_duration_ps !== null
                  ? `${adverse.treatment.pulse_duration_ps} ps`
                  : "—"
              }
              mono
            />
            <Field
              label="Spot size"
              value={
                adverse.treatment.spot_size_mm !== null
                  ? `${adverse.treatment.spot_size_mm} mm`
                  : "—"
              }
              mono
            />
          </div>

          {adverse.treatment.notes && (
            <div className="mt-6">
              <p
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Practitioner notes
              </p>
              <p
                className="mt-2 font-body text-ink-700 whitespace-pre-wrap"
                style={{ lineHeight: 1.65 }}
              >
                {adverse.treatment.notes}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <section>
          <Heading>Photos.</Heading>
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {photos.map((p) => (
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
            ))}
          </ul>
        </section>
      )}

      {/* Admin notes */}
      <section>
        <Heading>Admin notes.</Heading>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          onBlur={saveNotes}
          rows={5}
          placeholder="Internal review notes — not shown to the practice."
          className="bg-bone-50 border-ink-700/35"
        />
        <p className="mt-2 font-body text-caption text-ink-500">
          Saves on blur. Internal only.
        </p>
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

function formatDateShort(iso: string): string {
  try {
    return new Date(
      iso.length === 10 ? iso + "T00:00:00" : iso,
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateLong(iso: string): string {
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
