import "server-only";
import {
  resend,
  RESEND_FROM_EMAIL,
  RESEND_INTERNAL_NOTIFY_EMAIL,
} from "@/lib/resend/client";
import { NotificationGenericEmail } from "@/emails/NotificationGeneric";
import { AdverseEventNotificationEmail } from "@/emails/AdverseEventNotification";
import { NotificationProtocolUpdatedEmail } from "@/emails/NotificationProtocolUpdated";
import { NotificationAdverseEventStatusUpdateEmail } from "@/emails/NotificationAdverseEventStatusUpdate";
import { NotificationCertificationExpiringEmail } from "@/emails/NotificationCertificationExpiring";
import { NotificationInboxDemoRequestEmail } from "@/emails/NotificationInboxDemoRequest";
import { NotificationInboxContactMessageEmail } from "@/emails/NotificationInboxContactMessage";
import type { Database } from "@/lib/supabase/types";
import type { NotificationCategory } from "@/lib/schemas/notifications";

// P10 — Email rendering + send.
//
// Per-category templates inherit the brand register from
// LeadWelcome.tsx (Bone-100 background, navy logo, Fraunces
// headline, Inter body, brand CTA button, footer with
// trademark + unsubscribe link).
//
// Generic fallback handles categories without a custom template
// (e.g. inbox.new_lead, training.* if a real template isn't
// authored). Generic still goes through the same brand register.

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type EmailSendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

interface SendArgs {
  to: string;
  notification: NotificationRow;
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://preciseaesthetics.com";

export async function sendNotificationEmail(
  args: SendArgs,
): Promise<EmailSendResult> {
  if (!resend) {
    // Dev mode (no RESEND_API_KEY) — log + return failure so
    // dispatch_log captures the skip without blocking.
    console.info(
      `[notifications.email] dev mode — would send to ${args.to}: ${args.notification.title}`,
    );
    return { ok: false, error: "Resend not configured (dev)" };
  }

  const { notification } = args;
  const category = notification.category as NotificationCategory;

  // Absolute link path resolution
  const ctaUrl = notification.link_path
    ? `${SITE_URL}${notification.link_path.startsWith("/") ? "" : "/"}${notification.link_path}`
    : SITE_URL;
  // Unsubscribe — links to the relevant settings page.
  const unsubscribePath =
    notification.recipient_type === "practice"
      ? "/portal/settings/notifications"
      : "/admin/settings/notifications";
  const unsubscribeUrl = `${SITE_URL}${unsubscribePath}`;

  const subject = subjectFor(category, notification);

  // Pick the right template. Defaults to NotificationGeneric.
  const reactNode = (() => {
    const meta = (notification.metadata ?? {}) as Record<string, unknown>;
    const common = {
      title: notification.title,
      body: notification.body ?? "",
      ctaUrl,
      ctaLabel: ctaLabelFor(category),
      unsubscribeUrl,
    };
    switch (category) {
      case "adverse_event.new":
        // Preserves the legacy template signature — caller fills
        // metadata with the same fields that
        // sendAdverseEventNotification() used pre-refactor.
        return AdverseEventNotificationEmail({
          adverseEventId: (meta.adverse_event_id as string) ?? "",
          practiceName: (meta.practice_name as string) ?? "",
          treatmentDate: (meta.treatment_date as string) ?? "",
          protocolTitle: (meta.protocol_title as string) ?? "",
          protocolVersionLabel:
            (meta.protocol_version_label as string) ?? "",
          indication: (meta.indication as string) ?? "",
          patientFitzpatrick: (meta.patient_fitzpatrick as string) ?? "",
          enteredByName: (meta.entered_by_name as string) ?? "",
          description:
            (meta.description as string) ?? notification.body ?? "",
        });
      case "protocol.updated_for_used_protocol":
        return NotificationProtocolUpdatedEmail(common);
      case "adverse_event.status_updated":
        return NotificationAdverseEventStatusUpdateEmail(common);
      case "training.certification_expiring":
        return NotificationCertificationExpiringEmail(common);
      case "inbox.new_demo_request":
        return NotificationInboxDemoRequestEmail(common);
      case "inbox.new_contact_message":
        return NotificationInboxContactMessageEmail(common);
      default:
        return NotificationGenericEmail(common);
    }
  })();

  // Admin-side internal notifications historically routed to the
  // ops mailbox (RESEND_INTERNAL_NOTIFY_EMAIL); for adverse_event.new
  // we keep that legacy address as a safety relay even when fanning
  // to individual admins.
  const sendTo =
    category === "adverse_event.new"
      ? [args.to, RESEND_INTERNAL_NOTIFY_EMAIL].filter(Boolean)
      : args.to;

  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to: sendTo,
      subject,
      react: reactNode,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}

// ------------------------------------------------------------
// Subject + CTA per category
// ------------------------------------------------------------
function subjectFor(
  category: NotificationCategory,
  notif: NotificationRow,
): string {
  switch (category) {
    case "protocol.updated_for_used_protocol":
      return `Protocol updated — review before logging`;
    case "adverse_event.status_updated":
      return `Adverse event review update`;
    case "training.certification_expiring":
      return `Certification expiring — re-train soon`;
    case "adverse_event.new":
      return `Adverse event reported`;
    case "inbox.new_demo_request":
      return `New demo request`;
    case "inbox.new_contact_message":
      return `New contact message`;
    default:
      return notif.title;
  }
}

function ctaLabelFor(category: NotificationCategory): string {
  switch (category) {
    case "protocol.updated_for_used_protocol":
    case "protocol.new_for_owned_device":
      return "Review protocol";
    case "adverse_event.status_updated":
      return "View status";
    case "adverse_event.new":
      return "Review in admin";
    case "training.new_module_added":
    case "training.certification_expiring":
      return "Open training";
    case "inbox.new_demo_request":
    case "inbox.new_lead":
    case "inbox.new_contact_message":
      return "Open inbox";
    case "training.certification_completed":
      return "View practice";
    default:
      return "Open notification";
  }
}
