"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  practiceProvisioningSchema,
  US_STATES,
  type PracticeProvisioningValues,
} from "@/lib/schemas/practice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { DevicePicker, type DeviceOption } from "./DevicePicker";

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
    <p
      className="font-body text-overline font-medium uppercase text-brand-700"
      style={{ letterSpacing: "0.18em" }}
    >
      {label}
    </p>
  </div>
);

interface PracticeProvisioningFormProps {
  devices: DeviceOption[];
}

// New-practice provisioning form. Posts to POST /api/admin/practices.
// On success, redirects to /admin/practices/[id] with a success toast.
export function PracticeProvisioningForm({ devices }: PracticeProvisioningFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PracticeProvisioningValues>({
    resolver: zodResolver(practiceProvisioningSchema),
    defaultValues: {
      name: "",
      primaryEmail: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: undefined,
      postalCode: "",
      country: "US",
      devices: [],
      internalNotes: "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: PracticeProvisioningValues) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/practices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
        field?: string;
        emailSent?: boolean;
      };

      if (!res.ok || !data.ok) {
        if (data.field === "primaryEmail" && data.error) {
          form.setError("primaryEmail", {
            type: "manual",
            message: data.error,
          });
        }
        toast.error(data.error ?? "Could not provision practice.");
        setSubmitting(false);
        return;
      }

      toast.success(
        data.emailSent
          ? "Practice provisioned. Invite email sent."
          : "Practice provisioned. Invite email failed — review the record.",
      );
      router.push(`/admin/practices/${data.id}`);
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-10"
        noValidate
      >
        {/* Section 1 — Practice identity */}
        {sectionHeader("Practice identity")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Practice name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    autoComplete="organization"
                    className={inputClass}
                    suppressHydrationWarning
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="primaryEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>
                    Primary contact email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      className={inputClass}
                      suppressHydrationWarning
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
                  <FormLabel className={labelClass}>
                    Phone (optional)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClass}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 2 — Address */}
        {sectionHeader("Address")}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="addressLine1"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Street address
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    autoComplete="address-line1"
                    className={inputClass}
                    suppressHydrationWarning
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressLine2"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>
                  Suite, unit, etc. (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    autoComplete="address-line2"
                    className={inputClass}
                    suppressHydrationWarning
                  />
                </FormControl>
                <FormMessage className={messageClass} />
              </FormItem>
            )}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel className={labelClass}>
                    City
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      autoComplete="address-level2"
                      className={inputClass}
                      suppressHydrationWarning
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
                <FormItem className="sm:col-span-1">
                  <FormLabel className={labelClass}>
                    State
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {US_STATES.map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className={selectItemClass}
                        >
                          {s}
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
              name="postalCode"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel className={labelClass}>
                    Postal code
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      className={inputClass}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section 3 — Devices owned */}
        {sectionHeader("Devices owned")}
        <Controller
          control={form.control}
          name="devices"
          render={({ field }) => (
            <DevicePicker
              options={devices}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />

        {/* Section 4 — Internal notes (admin-only) */}
        {sectionHeader("Internal notes")}
        <FormField
          control={form.control}
          name="internalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>
                Internal notes (admin-only)
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={4}
                  className={textareaClass}
                />
              </FormControl>
              <p className="mt-1 text-caption text-ink-500">
                Visible only to the admin team. Not shown to the
                practice.
              </p>
              <FormMessage className={messageClass} />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
            suppressHydrationWarning
          >
            {submitting
              ? "Provisioning"
              : "Provision practice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
