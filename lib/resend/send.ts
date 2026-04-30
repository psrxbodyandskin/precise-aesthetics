import "server-only";
import {
  resend,
  RESEND_FROM_EMAIL,
  RESEND_INTERNAL_NOTIFY_EMAIL,
} from "./client";
import { LeadWelcomeEmail } from "@/emails/LeadWelcome";
import { InternalLeadNotificationEmail } from "@/emails/InternalLeadNotification";
import { SITE } from "@/lib/constants";
import type { LeadFormValues } from "@/lib/schemas/lead-form";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

// Stubs retained for future sessions; not yet wired.
export async function sendDemoConfirmation(_args: { to: string }): Promise<void> {
  void _args;
}
export async function sendRSVPConfirmation(_args: { to: string }): Promise<void> {
  void _args;
}
export async function sendInternalDemoNotification(_args: {
  payload: Record<string, unknown>;
}): Promise<void> {
  void _args;
}

interface SendLeadWelcomeArgs {
  to: string;
  firstName: string;
  interest: LeadFormValues["interest"];
}

export async function sendLeadWelcome({
  to,
  firstName,
  interest,
}: SendLeadWelcomeArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to,
      subject: "You are on the Precise Aesthetics list",
      react: LeadWelcomeEmail({ firstName, interest, siteUrl: SITE.url }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendInternalLeadNotificationArgs {
  values: LeadFormValues;
  status: "created" | "updated";
  submittedAt?: string;
}

export async function sendInternalLeadNotification({
  values,
  status,
  submittedAt,
}: SendInternalLeadNotificationArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }

  try {
    const subject =
      status === "updated"
        ? `Returning lead: ${values.firstName} ${values.lastName} (${values.practiceName})`
        : `New lead: ${values.firstName} ${values.lastName} (${values.practiceName})`;

    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to: RESEND_INTERNAL_NOTIFY_EMAIL,
      replyTo: values.email,
      subject,
      react: InternalLeadNotificationEmail({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        practiceName: values.practiceName,
        role: values.role,
        interest: values.interest,
        source: values.source,
        status,
        utm: values.utm,
        submittedAt,
      }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
