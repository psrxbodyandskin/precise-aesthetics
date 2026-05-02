"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  leadFormSchema,
  LEAD_INTERESTS,
  LEAD_ROLES,
  type LeadFormValues,
  type LeadInterest,
  type LeadRole,
} from "@/lib/schemas/lead-form";
import { capture, identify } from "@/lib/analytics/posthog";
import { EVENTS } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const INTEREST_LABEL: Record<LeadInterest, string> = {
  demo: "A clinical demonstration",
  launch_event: "Launch event invitation",
  press: "Press materials",
};

interface LeadFormProps {
  /** Forced tone for label/input contrast. */
  tone?: "light" | "dark";
}

function readUtm(): LeadFormValues["utm"] {
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

function readDefaultInterests(): LeadInterest[] {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("interest");
  const flagged = new Set<LeadInterest>();
  if (fromQuery === "launch_event") flagged.add("launch_event");
  if (fromQuery === "press") flagged.add("press");
  if (fromQuery === "demo") flagged.add("demo");
  return Array.from(flagged);
}

export function LeadForm({ tone = "light" }: LeadFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      practiceName: "",
      role: "physician",
      interest: [],
      source: "teaser",
      utm: undefined,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.setValue("interest", readDefaultInterests(), { shouldDirty: false });
    form.setValue("utm", readUtm(), { shouldDirty: false });
    capture(EVENTS.LEAD_FORM_VIEWED, { source: "teaser" });
  // Mount-only initialization — form ref is stable across renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDark = tone === "dark";

  async function onSubmit(values: LeadFormValues) {
    setSubmitting(true);
    capture(EVENTS.LEAD_FORM_SUBMITTED, {
      source: values.source,
      role: values.role,
      interest: values.interest,
    });
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        capture(EVENTS.LEAD_FORM_FAILED, {
          status: res.status,
          error: data.error ?? "Unknown error",
        });
        toast.error(data.error ?? "Submission failed. Please try again.");
        setSubmitting(false);
        return;
      }

      identify(values.email, {
        firstName: values.firstName,
        lastName: values.lastName,
        practiceName: values.practiceName,
        role: values.role,
      });
      capture(EVENTS.LEAD_FORM_SUCCEEDED, {
        interest: values.interest,
        source: values.source,
      });
      setSubmitted(true);
      toast.success("Thanks. You'll hear from us as the launch approaches.");
      router.refresh();
    } catch (err) {
      capture(EVENTS.LEAD_FORM_FAILED, {
        error: err instanceof Error ? err.message : "Network error",
      });
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={cn(
          "rounded-md border p-8 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-[2000ms]",
          isDark
            ? "border-cream-100/30 bg-midnight-700/40 text-cream-50"
            : "border-bone-300 bg-bone-100 text-ink-900",
        )}
        role="status"
        aria-live="polite"
      >
        <p
          className={cn(
            "mb-3 font-body text-overline uppercase tracking-overline",
            isDark ? "text-champagne-200" : "text-ink-500",
          )}
        >
          Confirmed
        </p>
        <p className="font-display text-h3">Thanks.</p>
        <p
          className={cn(
            "mt-3 text-body",
            isDark ? "text-cream-100" : "text-ink-700",
          )}
        >
          You&rsquo;ll hear from us as the launch approaches.
        </p>
      </div>
    );
  }

  const labelClass = cn(
    "text-small font-medium",
    isDark ? "text-cream-50" : "text-ink-900",
  );
  const messageClass = cn(isDark ? "text-champagne-200" : "text-red-700");
  const inputClass = cn(
    "h-11",
    isDark
      ? "bg-midnight-700/40 border-cream-100/30 text-cream-50 placeholder:text-cream-100/60"
      : "bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500",
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
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

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Role</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger
                    className={cn(
                      "w-full !h-11 text-body data-[size=default]:h-11",
                      isDark
                        ? "bg-midnight-700/40 border-cream-100/30 text-cream-50 data-[placeholder]:text-cream-100/60"
                        : "bg-bone-50 border-ink-700/35 text-ink-900 data-[placeholder]:text-ink-500",
                    )}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent
                  className={cn(
                    "border shadow-lg",
                    isDark
                      ? "bg-midnight-700 border-cream-100/30 text-cream-50"
                      : "bg-bone-50 border-ink-700/35 text-ink-900",
                  )}
                >
                  {LEAD_ROLES.map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      className={cn(
                        "text-body",
                        isDark
                          ? "text-cream-50 focus:bg-midnight-600 focus:text-cream-50"
                          : "text-ink-900 focus:bg-bone-200 focus:text-ink-900",
                      )}
                    >
                      {ROLE_LABEL[r]}
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
          name="interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>I am interested in</FormLabel>
              <p
                className={cn(
                  "mt-1 text-caption",
                  isDark ? "text-cream-100/70" : "text-ink-500",
                )}
              >
                Select all that apply (optional).
              </p>
              <div className="space-y-3 pt-2">
                {LEAD_INTERESTS.map((item) => {
                  const checked = field.value?.includes(item);
                  return (
                    <label
                      key={item}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 text-body",
                        isDark ? "text-cream-100" : "text-ink-700",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = new Set(field.value ?? []);
                          if (value) next.add(item);
                          else next.delete(item);
                          field.onChange(Array.from(next));
                        }}
                        className={cn(
                          "mt-1",
                          isDark
                            ? "border-cream-100/40 data-[state=checked]:bg-cream-50 data-[state=checked]:text-midnight-800"
                            : "border-ink-700/40 data-[state=checked]:bg-ink-900 data-[state=checked]:border-ink-900",
                        )}
                      />
                      <span>{INTEREST_LABEL[item]}</span>
                    </label>
                  );
                })}
              </div>
              <FormMessage className={messageClass} />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant={isDark ? "primary-on-dark" : "primary"}
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Submitting" : "Join the list"}
          </Button>
          <p
            className={cn(
              "mt-4 text-caption",
              isDark ? "text-cream-100/70" : "text-ink-500",
            )}
          >
            By submitting, you agree to receive updates from Precise Aesthetics.
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </form>
    </Form>
  );
}

export default LeadForm;
