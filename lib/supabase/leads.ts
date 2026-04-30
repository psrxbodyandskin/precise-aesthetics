import "server-only";
import { getServiceClient } from "./server";
import type { LeadFormValues } from "@/lib/schemas/lead-form";

export type UpsertLeadResult =
  | { status: "created"; id: string }
  | { status: "updated"; id: string }
  | { status: "error"; message: string };

/**
 * Insert a teaser lead, or merge into an existing row matched on lower(email).
 * Merging unions the `interest` array and overwrites name/practice/role/utm
 * with the latest submission so the most recent context wins.
 */
export async function upsertLead(values: LeadFormValues): Promise<UpsertLeadResult> {
  const supabase = getServiceClient();
  const email = values.email.toLowerCase();

  const { data: existing, error: selectError } = await supabase
    .from("leads")
    .select("id, interest")
    .eq("email", email)
    .maybeSingle();

  if (selectError) {
    return { status: "error", message: selectError.message };
  }

  const insertPayload = {
    email,
    first_name: values.firstName,
    last_name: values.lastName,
    practice_name: values.practiceName,
    role: values.role,
    source: values.source,
    utm_source: values.utm?.source ?? null,
    utm_medium: values.utm?.medium ?? null,
    utm_campaign: values.utm?.campaign ?? null,
    interest: values.interest,
  };

  if (!existing) {
    const { data, error } = await supabase
      .from("leads")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: error?.message ?? "Insert failed" };
    }
    return { status: "created", id: data.id };
  }

  const merged = Array.from(new Set([...(existing.interest ?? []), ...values.interest]));
  const { error: updateError } = await supabase
    .from("leads")
    .update({ ...insertPayload, interest: merged })
    .eq("id", existing.id);

  if (updateError) {
    return { status: "error", message: updateError.message };
  }
  return { status: "updated", id: existing.id };
}
