import type { InboxItemAuditRow, LeadRow } from "@/lib/admin/inbox";
import { StatusWorkflowControl } from "./StatusWorkflowControl";
import { AdminNotesField } from "./AdminNotesField";
import { EnrichmentSection } from "@/components/admin/ai/EnrichmentSection";
import { DraftEmailModal } from "@/components/admin/ai/DraftEmailModal";
import { InboxAuditLog } from "./InboxAuditLog";
import { InboxStatusChip } from "./InboxStatusChip";

interface LeadDetailViewProps {
  lead: LeadRow;
  audit: InboxItemAuditRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function LeadDetailView({ lead, audit }: LeadDetailViewProps) {
  const fullName =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() ||
    "Anonymous lead";

  return (
    <div className="space-y-12">
      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Lead capture
        </p>
        <h1
          className="mt-3 break-all font-display text-ink-900"
          style={{
            fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 400,
          }}
        >
          {lead.email}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <InboxStatusChip status={lead.status} />
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={new Date(lead.created_at).toLocaleString()}
          >
            Captured {new Date(lead.created_at).toLocaleString()}
          </span>
          <a
            href={`mailto:${lead.email}`}
            className="font-body text-caption text-brand-700 underline-offset-2 hover:underline"
          >
            Email {lead.email}
          </a>
        </div>
        <div className="mt-4">
          <DraftEmailModal
            recipientContext={[
              `Lead: ${fullName} (${lead.email}).`,
              lead.role ? `Role: ${lead.role}.` : null,
              lead.practice_name ? `Practice: ${lead.practice_name}.` : null,
              lead.interest && lead.interest.length > 0
                ? `Interest: ${lead.interest.join(", ")}.`
                : null,
              lead.source ? `Source: ${lead.source}.` : null,
            ]
              .filter(Boolean)
              .join(" ")}
            recipientEmail={lead.email}
          />
        </div>
      </header>

      <Section heading="Status workflow.">
        <StatusWorkflowControl
          type="lead"
          id={lead.id}
          status={lead.status}
          statusChangedAt={lead.status_changed_at}
        />
      </Section>

      <Section heading="Contact.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" value={fullName} />
          <Field label="Email" value={lead.email} />
          {lead.practice_name && (
            <Field label="Practice" value={lead.practice_name} />
          )}
          {lead.role && <Field label="Role" value={lead.role} />}
          <Field
            label="Captured at"
            value={new Date(lead.created_at).toLocaleString()}
            mono
          />
        </dl>
      </Section>

      <Section heading="Source context.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Source" value={lead.source ?? "Direct"} />
          <Field label="UTM source" value={lead.utm_source ?? "—"} />
          <Field label="UTM medium" value={lead.utm_medium ?? "—"} />
          <Field label="UTM campaign" value={lead.utm_campaign ?? "—"} />
          {lead.interest && lead.interest.length > 0 && (
            <Field
              label="Interest"
              value={lead.interest.join(", ")}
              fullWidth
            />
          )}
        </dl>
      </Section>

      <Section heading="Enrichment.">
        <EnrichmentSection
          leadType="lead"
          leadId={lead.id}
          data={lead.enrichment_data}
          enrichedAt={lead.enriched_at}
        />
      </Section>

      <Section heading="Admin notes.">
        <AdminNotesField
          type="lead"
          id={lead.id}
          initialNotes={lead.admin_notes ?? ""}
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
