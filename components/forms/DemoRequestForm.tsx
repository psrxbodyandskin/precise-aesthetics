"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  demoRequestSchema,
  CONFIDENCE_LEVELS,
  DEMO_TIMELINES,
  PRACTICE_TYPES,
  PROVIDER_COUNTS,
  TREATMENT_CONDITIONS,
  TREATMENT_VOLUMES,
  YEARS_IN_OPERATION,
  YES_NO,
  type ConfidenceLevel,
  type DemoRequestValues,
  type DemoTimeline,
  type PracticeType,
  type ProviderCount,
  type TreatmentCondition,
  type TreatmentVolume,
  type YearsInOperation,
  type YesNo,
} from "@/lib/schemas/demo-request";
import { LEAD_ROLES, type LeadRole } from "@/lib/schemas/lead-form";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_LABEL: Record<LeadRole, string> = {
  physician: "Physician",
  aprn: "APRN",
  pa: "PA",
  rn: "RN",
  owner: "Practice owner",
  other: "Other",
};

const PRACTICE_TYPE_LABEL: Record<PracticeType, string> = {
  dermatology: "Dermatology",
  plastic_surgery: "Plastic surgery",
  medspa: "Med spa",
  aesthetic_clinic: "Aesthetic clinic",
  other: "Other",
};

const YEARS_LABEL: Record<YearsInOperation, string> = {
  less_than_1: "Less than 1 year",
  "1_3": "1–3 years",
  "3_5": "3–5 years",
  "5_10": "5–10 years",
  "10_20": "10–20 years",
  "20_plus": "20+ years",
};

const PROVIDER_LABEL: Record<ProviderCount, string> = {
  "1": "1",
  "2_3": "2–3",
  "4_5": "4–5",
  "6_10": "6–10",
  "10_plus": "10+",
};

const VOLUME_LABEL: Record<TreatmentVolume, string> = {
  "0-10": "0–10 / month",
  "11-50": "11–50 / month",
  "51-150": "51–150 / month",
  "151-300": "151–300 / month",
  "300+": "300+ / month",
};

const CONDITION_LABEL: Record<TreatmentCondition, string> = {
  pigment: "Pigment",
  melasma: "Melasma",
  acne: "Acne",
  acne_scarring: "Acne scarring",
  tattoo_removal: "Tattoo removal",
  hair_removal: "Hair removal",
  other: "Other",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  "1": "1 — Not confident",
  "2": "2",
  "3": "3 — Somewhat confident",
  "4": "4",
  "5": "5 — Very confident",
};

const YESNO_LABEL: Record<YesNo, string> = {
  yes: "Yes",
  no: "No",
};

const TIMELINE_LABEL: Record<DemoTimeline, string> = {
  now: "Ready now",
  "30_days": "Within 30 days",
  "60_90_days": "60–90 days",
  exploring: "Exploring",
};

function readUtm(): DemoRequestValues["utm"] {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  const out = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
  };
  if (!out.source && !out.medium && !out.campaign) return undefined;
  return out;
}

export function DemoRequestForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<DemoRequestValues>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      practiceName: "",
      role: "physician",
      practiceType: undefined,
      city: "",
      state: "",
      yearsInOperation: undefined,
      providerCount: undefined,
      currentDevices: "",
      treatmentConditions: [],
      biggestChallenges: "",
      fitzpatrickConfidence: undefined,
      pihExperience: "",
      patientPctI_III: "",
      patientPctIV_VI: "",
      monthlyTreatmentVolume: undefined,
      topServices: "",
      nextYearGoals: "",
      whyPrecisePico: "",
      willStandardize: undefined,
      willDataCollection: undefined,
      willTraining: undefined,
      earlyAdopterPitch: "",
      timeline: undefined,
      notes: "",
      utm: undefined,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.setValue("utm", readUtm(), { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: DemoRequestValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      toast.success(
        "Application received. A team member will be in touch within one business day.",
      );
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="rounded-md border border-ink-700/35 bg-bone-50 p-10 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[2000ms]"
        role="status"
        aria-live="polite"
      >
        <p className="mb-3 font-body text-overline tracking-overline font-medium uppercase text-ink-500">
          Confirmed
        </p>
        <p className="font-display text-h2 leading-heading text-ink-900">
          Your application is in.
        </p>
        <p className="mt-4 font-body text-body leading-body text-ink-700 max-w-[44ch] mx-auto">
          A member of the Precise Aesthetics team will be in touch within one
          business day.
        </p>
      </div>
    );
  }

  const labelClass = "text-small font-medium text-ink-900";
  const messageClass = "text-red-700";
  const inputClass =
    "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";
  const textareaClass =
    "bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";
  const selectTriggerClass = cn(
    "w-full !h-11 text-body data-[size=default]:h-11",
    "bg-bone-50 border-ink-700/35 text-ink-900 data-[placeholder]:text-ink-500",
  );
  const selectContentClass =
    "border bg-bone-50 border-ink-700/35 text-ink-900 shadow-lg";
  const selectItemClass =
    "text-body text-ink-900 focus:bg-bone-200 focus:text-ink-900";

  const sectionHeader = (label: string) => (
    <div className="flex items-center gap-3 pt-4">
      <span className="block h-px w-[40px] bg-brand-500" aria-hidden="true" />
      <p className="font-body text-overline tracking-overline font-medium uppercase text-brand-700">
        {label}
      </p>
    </div>
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-10"
        noValidate
      >
        {/* — Contact — */}
        {sectionHeader("Contact")}
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>First name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="given-name"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Last name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Work email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Role</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {LEAD_ROLES.map((r) => (
                      <SelectItem key={r} value={r} className={selectItemClass}>
                        {ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* — Practice information — */}
        {sectionHeader("Practice information")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="practiceName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Practice name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="organization"
                    className={inputClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>City</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="address-level2"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>State</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="address-level1"
                      placeholder="e.g. Illinois"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="practiceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Type of practice</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select practice type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {PRACTICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t} className={selectItemClass}>
                        {PRACTICE_TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="yearsInOperation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Years in operation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {YEARS_IN_OPERATION.map((y) => (
                        <SelectItem key={y} value={y} className={selectItemClass}>
                          {YEARS_LABEL[y]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="providerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Providers performing treatments
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {PROVIDER_COUNTS.map((p) => (
                        <SelectItem key={p} value={p} className={selectItemClass}>
                          {PROVIDER_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* — Current practice & laser experience — */}
        {sectionHeader("Current practice & laser experience")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="currentDevices"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  What laser technologies are currently used in your practice?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    placeholder="e.g. PicoSure, FRAXEL, alexandrite, IPL"
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="treatmentConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Which conditions do you most commonly treat?
                </FormLabel>
                <p className="mt-1 text-caption text-ink-500">
                  Select all that apply.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {TREATMENT_CONDITIONS.map((item) => {
                    const checked = field.value?.includes(item);
                    return (
                      <label
                        key={item}
                        className="flex cursor-pointer items-start gap-3 text-body text-ink-700"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            const next = new Set(field.value ?? []);
                            if (value) next.add(item);
                            else next.delete(item);
                            field.onChange(Array.from(next));
                          }}
                          className="mt-1 border-ink-700/40 data-[state=checked]:bg-ink-900 data-[state=checked]:border-ink-900"
                        />
                        <span>{CONDITION_LABEL[item]}</span>
                      </label>
                    );
                  })}
                </div>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="biggestChallenges"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  What are your biggest challenges with current laser treatments?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fitzpatrickConfidence"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  How confident are you treating Fitzpatrick IV–VI patients?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Not confident → Very confident" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {CONFIDENCE_LEVELS.map((c) => (
                      <SelectItem key={c} value={c} className={selectItemClass}>
                        {CONFIDENCE_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pihExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Have you experienced complications such as PIH in your
                  treatments? If so, how do you currently manage them?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* — Patient population — */}
        {sectionHeader("Patient population")}
        <div className="space-y-6">
          <p className="font-body text-small text-ink-700">
            What percentage of your patient population falls into each
            Fitzpatrick range?
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="patientPctI_III"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Fitzpatrick I–III (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="0–100"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="patientPctIV_VI"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Fitzpatrick IV–VI (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      inputMode="numeric"
                      placeholder="0–100"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="monthlyTreatmentVolume"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Monthly treatment volume
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {TREATMENT_VOLUMES.map((v) => (
                      <SelectItem key={v} value={v} className={selectItemClass}>
                        {VOLUME_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* — Practice goals — */}
        {sectionHeader("Practice goals")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="topServices"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  What are your top 3 revenue-generating services?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextYearGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  What are you looking to improve or expand in your practice
                  over the next 12 months?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* — Interest in Precise Pico — */}
        {sectionHeader("Interest in Precise Pico™")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="whyPrecisePico"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Why are you interested in Precise Pico™ specifically?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="willStandardize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Our system requires strict adherence to protocols, including
                  pre- and post-treatment care. Are you willing to implement a
                  standardized treatment approach?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Yes / No" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {YES_NO.map((v) => (
                      <SelectItem key={v} value={v} className={selectItemClass}>
                        {YESNO_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="willDataCollection"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Are you willing to participate in clinical data collection
                  and outcome tracking?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Yes / No" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {YES_NO.map((v) => (
                      <SelectItem key={v} value={v} className={selectItemClass}>
                        {YESNO_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="willTraining"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  This is a limited early access program with direct clinical
                  support and accountability. Are you prepared to actively
                  engage in training and implementation?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Yes / No" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {YES_NO.map((v) => (
                      <SelectItem key={v} value={v} className={selectItemClass}>
                        {YESNO_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="earlyAdopterPitch"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Why should your clinic be selected as an early adopter
                  Precise partner?
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* — Timeline + notes — */}
        {sectionHeader("Timeline")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="timeline"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  When are you looking to move forward?
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {DEMO_TIMELINES.map((t) => (
                      <SelectItem key={t} value={t} className={selectItemClass}>
                        {TIMELINE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Anything else (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    className={textareaClass}
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Submitting" : "Submit application"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default DemoRequestForm;
