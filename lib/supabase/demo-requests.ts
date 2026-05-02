import "server-only";
import { getServiceClient } from "./server";
import type { DemoRequestValues } from "@/lib/schemas/demo-request";

export type InsertDemoRequestResult =
  | { status: "ok"; id: string }
  | { status: "error"; message: string };

const YEARS_LABEL: Record<string, string> = {
  less_than_1: "Less than 1 year",
  "1_3": "1–3 years",
  "3_5": "3–5 years",
  "5_10": "5–10 years",
  "10_20": "10–20 years",
  "20_plus": "20+ years",
};

const PROVIDER_LABEL: Record<string, string> = {
  "1": "1",
  "2_3": "2–3",
  "4_5": "4–5",
  "6_10": "6–10",
  "10_plus": "10+",
};

const CONDITION_LABEL: Record<string, string> = {
  pigment: "Pigment",
  melasma: "Melasma",
  acne: "Acne",
  acne_scarring: "Acne scarring",
  tattoo_removal: "Tattoo removal",
  hair_removal: "Hair removal",
  other: "Other",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  "1": "1 — Not confident",
  "2": "2",
  "3": "3 — Somewhat confident",
  "4": "4",
  "5": "5 — Very confident",
};

const YESNO_LABEL: Record<string, string> = {
  yes: "Yes",
  no: "No",
};

// Build a human-readable structured block from the extended application
// fields (the ones that don't have dedicated columns in `demo_requests`).
// This block is appended to whatever the user typed in `notes`. Once a DB
// migration adds an `application_data` JSONB column we can switch to that.
function buildApplicationNotes(values: DemoRequestValues): string {
  const lines: string[] = [];
  const push = (label: string, value: string | undefined | null) => {
    if (value && value.length > 0) lines.push(`${label}: ${value}`);
  };

  push("City", values.city);
  push(
    "Years in operation",
    values.yearsInOperation ? YEARS_LABEL[values.yearsInOperation] : undefined,
  );
  push(
    "Providers performing treatments",
    values.providerCount ? PROVIDER_LABEL[values.providerCount] : undefined,
  );

  if (values.treatmentConditions && values.treatmentConditions.length > 0) {
    push(
      "Conditions most commonly treated",
      values.treatmentConditions.map((c) => CONDITION_LABEL[c] ?? c).join(", "),
    );
  }
  push("Biggest challenges with current laser treatments", values.biggestChallenges);
  push(
    "Confidence treating Fitzpatrick IV–VI",
    values.fitzpatrickConfidence
      ? CONFIDENCE_LABEL[values.fitzpatrickConfidence]
      : undefined,
  );
  push("PIH complications experience", values.pihExperience);

  push("% Patients Fitzpatrick I–III", values.patientPctI_III);
  push("% Patients Fitzpatrick IV–VI", values.patientPctIV_VI);

  push("Top revenue-generating services", values.topServices);
  push("Goals for the next 12 months", values.nextYearGoals);

  push("Why interested in Precise Pico", values.whyPrecisePico);
  push(
    "Willing to implement standardized treatment approach",
    values.willStandardize ? YESNO_LABEL[values.willStandardize] : undefined,
  );
  push(
    "Willing to participate in clinical data collection",
    values.willDataCollection ? YESNO_LABEL[values.willDataCollection] : undefined,
  );
  push(
    "Prepared to engage in training and implementation",
    values.willTraining ? YESNO_LABEL[values.willTraining] : undefined,
  );
  push("Pitch — why select this clinic as early adopter", values.earlyAdopterPitch);

  if (lines.length === 0) return "";
  return ["— APPLICATION DETAILS —", ...lines].join("\n");
}

export async function insertDemoRequest(
  values: DemoRequestValues,
): Promise<InsertDemoRequestResult> {
  const supabase = getServiceClient();

  const phone = values.phone && values.phone.length > 0 ? values.phone : null;
  const state = values.state && values.state.length > 0 ? values.state : null;
  const userNotes =
    values.notes && values.notes.length > 0 ? values.notes : "";
  const appBlock = buildApplicationNotes(values);
  const combinedNotes =
    userNotes && appBlock
      ? `${userNotes}\n\n${appBlock}`
      : appBlock || userNotes || null;

  const currentDevices =
    values.currentDevices && values.currentDevices.length > 0
      ? values.currentDevices
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
      : null;

  const { data, error } = await supabase
    .from("demo_requests")
    .insert({
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      phone,
      practice_name: values.practiceName,
      role: values.role,
      practice_type: values.practiceType ?? null,
      state,
      current_devices: currentDevices,
      monthly_treatment_volume: values.monthlyTreatmentVolume ?? null,
      primary_interest:
        values.treatmentConditions && values.treatmentConditions.length > 0
          ? values.treatmentConditions
          : null,
      timeline: values.timeline ?? null,
      notes: combinedNotes,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", message: error?.message ?? "Insert failed" };
  }
  return { status: "ok", id: data.id };
}
