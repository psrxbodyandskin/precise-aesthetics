import "server-only";
import { getServiceClient } from "./server";
import type { ContactMessageValues } from "@/lib/schemas/contact-message";

export type InsertContactMessageResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

export async function insertContactMessage(
  values: ContactMessageValues,
): Promise<InsertContactMessageResult> {
  const supabase = getServiceClient();

  const organization =
    values.organization && values.organization.length > 0
      ? values.organization
      : null;

  const utmSource = values.utm?.source ?? null;
  const utmMedium = values.utm?.medium ?? null;
  const utmCampaign = values.utm?.campaign ?? null;

  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      full_name: values.fullName,
      email: values.email,
      organization,
      subject: values.subject,
      message: values.message,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Insert failed" };
  }
  return { status: "ok", id: data.id };
}
