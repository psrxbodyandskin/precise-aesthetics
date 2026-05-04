import type { DemoRequestRow, InboxItemAuditRow } from "@/lib/admin/inbox";
import { StatusWorkflowControl } from "./StatusWorkflowControl";
import { AdminNotesField } from "./AdminNotesField";
import { EnrichmentSection } from "./EnrichmentSection";
import { InboxAuditLog } from "./InboxAuditLog";
import { InboxStatusChip } from "./InboxStatusChip";

interface DemoRequestDetailViewProps {
  demo: DemoRequestRow;
  audit: InboxItemAuditRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function DemoRequestDetailView({
  demo,
  audit,
}: DemoRequestDetailViewProps) {
  const fullName = `${demo.first_name} ${demo.last_name}`.trim();
  const subject = encodeURIComponent(`Re: Demo request — ${demo.practice_name}`);
  const mailto = `mailto:${demo.email}?subject=${subject}`;

  return (
    <div className="space-y-12">
      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Demo request
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
          {fullName}
        </h1>
        <p className="mt-2 font-body text-ink-700">
          {demo.practice_name}
          {demo.role ? ` · ${demo.role}` : ""}
          {demo.state ? ` · ${demo.state}` : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <InboxStatusChip status={demo.status} />
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={new Date(demo.created_at).toLocaleString()}
          >
            Received {new Date(demo.created_at).toLocaleString()}
          </span>
          <a
            href={mailto}
            className="font-body text-caption text-brand-700 underline-offset-2 hover:underline"
          >
            Send follow-up email
          </a>
        </div>
      </header>

      <Section heading="Status workflow.">
        <StatusWorkflowControl
          type="demo"
          id={demo.id}
          status={demo.status}
          statusChangedAt={demo.status_changed_at}
        />
      </Section>

      <Section heading="Requester.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" value={fullName} />
          <Field label="Email" value={demo.email} />
          {demo.phone && <Field label="Phone" value={demo.phone} mono />}
          <Field label="Role at practice" value={demo.role} />
        </dl>
      </Section>

      <Section heading="Practice.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Practice name" value={demo.practice_name} />
          {demo.practice_type && (
            <Field label="Practice type" value={demo.practice_type} />
          )}
          {demo.state && <Field label="State" value={demo.state} />}
          {demo.monthly_treatment_volume && (
            <Field
              label="Monthly volume"
              value={demo.monthly_treatment_volume}
            />
          )}
          {demo.current_devices && demo.current_devices.length > 0 && (
            <Field
              label="Current devices"
              value={demo.current_devices.join(", ")}
              fullWidth
            />
          )}
        </dl>
      </Section>

      <Section heading="Demo intent.">
        <dl className="grid gap-5 sm:grid-cols-2">
          {demo.primary_interest && demo.primary_interest.length > 0 && (
            <Field
              label="Primary interest"
              value={demo.primary_interest.join(", ")}
              fullWidth
            />
          )}
          {demo.timeline && <Field label="Timeline" value={demo.timeline} />}
          {demo.cal_booking_id && (
            <Field
              label="Cal booking"
              value={demo.cal_booking_id}
              mono
            />
          )}
          {demo.notes && (
            <div className="sm:col-span-2">
              <p
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={EYEBROW_TRACKING}
              >
                Notes
              </p>
              <p
                className="mt-2 whitespace-pre-wrap rounded-md border border-ink-700/15 bg-bone-50 p-4 font-body text-ink-900"
                style={{ lineHeight: 1.65 }}
              >
                {demo.notes}
              </p>
            </div>
          )}
        </dl>
      </Section>

      <Section heading="Source.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Submitted at"
            value={new Date(demo.created_at).toLocaleString()}
            mono
          />
          <Field
            label="Last updated"
            value={new Date(demo.updated_at).toLocaleString()}
            mono
          />
        </dl>
      </Section>

      <Section heading="Enrichment.">
        <EnrichmentSection
          data={demo.enrichment_data}
          enrichedAt={demo.enriched_at}
        />
      </Section>

      <Section heading="Admin notes.">
        <AdminNotesField
          type="demo"
          id={demo.id}
          initialNotes={demo.admin_notes ?? ""}
        />
      </Section>

      <Section heading="Activity.">
        <InboxAuditLog entries={audit} />
      </Section>
    </div>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="mb-4 font-display text-ink-900"
        style={{
          fontSize: "clamp(1.125rem, 0.5vw + 1rem, 1.375rem)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  mono,
  fullWidth,
}: {
  label: string;
  value: string;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </dt>
      <dd
        className="mt-1 font-body text-ink-900"
        style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
