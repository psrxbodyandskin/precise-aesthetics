import type { ContactMessageRow, InboxItemAuditRow } from "@/lib/admin/inbox";
import { StatusWorkflowControl } from "./StatusWorkflowControl";
import { AdminNotesField } from "./AdminNotesField";
import { EnrichmentSection } from "@/components/admin/ai/EnrichmentSection";
import { DraftEmailModal } from "@/components/admin/ai/DraftEmailModal";
import { InboxAuditLog } from "./InboxAuditLog";
import { InboxStatusChip } from "./InboxStatusChip";

interface ContactMessageDetailViewProps {
  message: ContactMessageRow;
  audit: InboxItemAuditRow[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ContactMessageDetailView({
  message,
  audit,
}: ContactMessageDetailViewProps) {
  const subject = encodeURIComponent(`Re: ${message.subject}`);
  const mailto = `mailto:${message.email}?subject=${subject}`;

  return (
    <div className="space-y-12">
      <header>
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          § Contact message
        </p>
        <h1
          className="mt-3 font-display text-ink-900"
          style={{
            fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.015em",
            fontWeight: 400,
          }}
        >
          {message.subject}
        </h1>
        <p className="mt-2 font-body text-ink-700">
          {message.full_name} · {message.email}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <InboxStatusChip status={message.status} />
          <span
            className="font-body text-caption text-ink-500"
            style={{ fontVariantNumeric: "tabular-nums" }}
            title={new Date(message.created_at).toLocaleString()}
          >
            Sent {new Date(message.created_at).toLocaleString()}
          </span>
          <a
            href={mailto}
            className="font-body text-caption text-brand-700 underline-offset-2 hover:underline"
          >
            Reply via email
          </a>
        </div>
        <div className="mt-4">
          <DraftEmailModal
            recipientContext={[
              `Contact message from ${message.full_name} (${message.email}).`,
              message.organization
                ? `Organization: ${message.organization}.`
                : null,
              `Subject: ${message.subject}.`,
              `Message: ${message.message}`,
            ]
              .filter(Boolean)
              .join(" ")}
            recipientEmail={message.email}
            triggerLabel="Draft reply"
          />
        </div>
      </header>

      <Section heading="Status workflow.">
        <StatusWorkflowControl
          type="contact"
          id={message.id}
          status={message.status}
          statusChangedAt={message.status_changed_at}
        />
      </Section>

      <Section heading="Sender.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field label="Name" value={message.full_name} />
          <Field label="Email" value={message.email} />
          {message.organization && (
            <Field label="Organization" value={message.organization} />
          )}
        </dl>
      </Section>

      <Section heading="Message.">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Subject
          </p>
          <p className="mt-1 font-body text-ink-900">{message.subject}</p>
          <p
            className="mt-5 font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Body
          </p>
          <p
            className="mt-2 whitespace-pre-wrap rounded-md border border-ink-700/15 bg-bone-50 p-5 font-body text-ink-900"
            style={{ lineHeight: 1.65 }}
          >
            {message.message}
          </p>
        </div>
      </Section>

      <Section heading="Source.">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Submitted at"
            value={new Date(message.created_at).toLocaleString()}
            mono
          />
          <Field label="UTM source" value={message.utm_source ?? "—"} />
          <Field label="UTM medium" value={message.utm_medium ?? "—"} />
          <Field label="UTM campaign" value={message.utm_campaign ?? "—"} />
        </dl>
      </Section>

      <Section heading="Enrichment.">
        <EnrichmentSection
          leadType="contact"
          leadId={message.id}
          data={message.enrichment_data}
          enrichedAt={message.enriched_at}
        />
      </Section>

      <Section heading="Admin notes.">
        <AdminNotesField
          type="contact"
          id={message.id}
          initialNotes={message.admin_notes ?? ""}
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
        className="mt-1 font-body text-ink-900"
        style={mono ? { fontVariantNumeric: "tabular-nums" } : undefined}
      >
        {value}
      </dd>
    </div>
  );
}
