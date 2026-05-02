"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  contactMessageSchema,
  type ContactMessageValues,
} from "@/lib/schemas/contact-message";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

function readUtm(): ContactMessageValues["utm"] {
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

export function ContactForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactMessageValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      fullName: "",
      email: "",
      organization: "",
      subject: "",
      message: "",
      utm: undefined,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.setValue("utm", readUtm(), { shouldDirty: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: ContactMessageValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
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
          Sent
        </p>
        <p className="font-display text-h2 leading-heading text-ink-900">
          Message sent.
        </p>
        <p className="mt-4 font-body text-body leading-body text-ink-700 max-w-[44ch] mx-auto">
          We&rsquo;ll respond as appropriate.
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
  const helperClass = "mt-1 text-caption text-ink-500";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Your name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="name"
                  className={inputClass}
                />
              </FormControl>
              <FormMessage className={messageClass} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Email</FormLabel>
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
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                Practice or organization
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="organization"
                  className={inputClass}
                />
              </FormControl>
              <p className={helperClass}>Optional</p>
              <FormMessage className={messageClass} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Subject</FormLabel>
              <FormControl>
                <Input {...field} className={inputClass} />
              </FormControl>
              <FormMessage className={messageClass} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Your message</FormLabel>
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

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Sending" : "Send message"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default ContactForm;
