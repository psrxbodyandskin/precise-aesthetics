import "server-only";
import {
  resend,
  RESEND_FROM_EMAIL,
  RESEND_INTERNAL_NOTIFY_EMAIL,
} from "./client";
import { LeadWelcomeEmail } from "@/emails/LeadWelcome";
import { InternalLeadNotificationEmail } from "@/emails/InternalLeadNotification";
import { DemoRequestConfirmationEmail } from "@/emails/DemoRequestConfirmation";
import { InternalDemoNotificationEmail } from "@/emails/InternalDemoNotification";
import { ContactMessageConfirmationEmail } from "@/emails/ContactMessageConfirmation";
import { InternalContactNotificationEmail } from "@/emails/InternalContactNotification";
import { PracticeInviteEmail } from "@/emails/PracticeInvite";
import { PracticeRecoveryEmail } from "@/emails/PracticeRecovery";
import { AdverseEventNotificationEmail } from "@/emails/AdverseEventNotification";
import { SITE } from "@/lib/constants";
import type { LeadFormValues } from "@/lib/schemas/lead-form";
import type { DemoRequestValues } from "@/lib/schemas/demo-request";
import type { ContactMessageValues } from "@/lib/schemas/contact-message";

export type SendResult = { ok: true; id?: string } | { ok: false; error: string };

// RSVP stub — not yet wired (separate session).
export async function sendRSVPConfirmation(_args: { to: string }): Promise<void> {
  void _args;
}

interface SendDemoConfirmationArgs {
  to: string;
  firstName: string;
}

export async function sendDemoConfirmation({
  to,
  firstName,
}: SendDemoConfirmationArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to,
      subject: "Your demonstration request has been received",
      react: DemoRequestConfirmationEmail({ firstName }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendInternalDemoNotificationArgs {
  values: DemoRequestValues;
  submittedAt?: string;
}

export async function sendInternalDemoNotification({
  values,
  submittedAt,
}: SendInternalDemoNotificationArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to: RESEND_INTERNAL_NOTIFY_EMAIL,
      replyTo: values.email,
      subject: `Demo request: ${values.firstName} ${values.lastName} (${values.practiceName})`,
      react: InternalDemoNotificationEmail({ values, submittedAt }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendPracticeInviteArgs {
  to: string;
  practiceName: string;
  inviteLink: string;
}

export async function sendPracticeInvite({
  to,
  practiceName,
  inviteLink,
}: SendPracticeInviteArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to,
      
      subject: "Welcome to Precise Aesthetics",
      react: PracticeInviteEmail({ practiceName, inviteLink }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendPracticeRecoveryArgs {
  to: string;
  practiceName: string;
  recoveryLink: string;
}

export async function sendPracticeRecovery({
  to,
  practiceName,
  recoveryLink,
}: SendPracticeRecoveryArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to,
      
      subject: "Set a new password for Precise Aesthetics",
      react: PracticeRecoveryEmail({ practiceName, recoveryLink }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendAdverseEventNotificationArgs {
  adverseEventId: string;
  practiceName: string;
  treatmentDate: string;
  protocolTitle: string;
  protocolVersionLabel: string;
  indication: string;
  patientFitzpatrick: string;
  enteredByName: string;
  description: string;
}

export async function sendAdverseEventNotification(
  args: SendAdverseEventNotificationArgs,
): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to: RESEND_INTERNAL_NOTIFY_EMAIL,
      subject: `Adverse event reported — ${args.practiceName}`,
      react: AdverseEventNotificationEmail(args),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

interface SendContactConfirmationArgs {
  to: string;
  fullName: string;
  subject: string;
}

export async function sendContactConfirmation({
  to,
  fullName,
  subject,
}: SendContactConfirmationArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to,
      subject: "Message received",
      react: ContactMessageConfirmationEmail({ fullName, subject }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

interface SendInternalContactNotificationArgs {
  values: ContactMessageValues;
  submittedAt?: string;
}

export async function sendInternalContactNotification({
  values,
  submittedAt,
}: SendInternalContactNotificationArgs): Promise<SendResult> {
  if (!resend) {
    return { ok: false, error: "Resend not configured (missing RESEND_API_KEY)" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: `Precise Aesthetics <${RESEND_FROM_EMAIL}>`,
      to: RESEND_INTERNAL_NOTIFY_EMAIL,
      replyTo: values.email,
      subject: `Contact message: ${values.fullName} — ${values.subject}`,
      react: InternalContactNotificationEmail({ values, submittedAt }),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
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
