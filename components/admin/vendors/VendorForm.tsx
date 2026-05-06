"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VENDOR_CATEGORIES, VENDOR_STATUSES } from "@/lib/schemas/vendor";
import type {
  VendorCategory,
  VendorStatus,
  VendorCreateInput,
} from "@/lib/schemas/vendor";

const CATEGORY_LABEL: Record<VendorCategory, string> = {
  manufacturer: "Manufacturer",
  software_vendor: "Software vendor",
  service_provider: "Service provider",
  logistics: "Logistics",
  professional_services: "Professional services",
  other: "Other",
};

interface VendorFormProps {
  /** When set, form is in edit mode; submit PATCHes that id. */
  vendorId?: string;
  /** Pre-fill values for edit mode. */
  initial?: Partial<VendorCreateInput>;
  /** Override the redirect after save. Default: /admin/vendors/<id>. */
  redirectTo?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function VendorForm({
  vendorId,
  initial,
  redirectTo,
  onSaved,
  onCancel,
}: VendorFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<VendorCategory>(
    (initial?.category as VendorCategory) ?? "software_vendor",
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [contactName, setContactName] = useState(initial?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? "");
  const [telegram, setTelegram] = useState(initial?.telegram ?? "");
  const [signal, setSignal] = useState(initial?.signal ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [accountId, setAccountId] = useState(initial?.account_id ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<VendorStatus>(
    (initial?.status as VendorStatus) ?? "active",
  );

  function submit() {
    if (name.trim().length < 1) {
      toast.error("Name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      description: description.trim() || null,
      contact_name: contactName.trim() || null,
      contact_email: contactEmail.trim() || null,
      contact_phone: contactPhone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      telegram: telegram.trim() || null,
      signal: signal.trim() || null,
      website: website.trim() || null,
      account_id: accountId.trim() || null,
      notes: notes.trim() || null,
      status,
    };

    startTransition(async () => {
      const url = vendorId
        ? `/api/admin/vendors/${vendorId}`
        : "/api/admin/vendors";
      const method = vendorId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success(vendorId ? "Updated." : "Vendor created.");
      onSaved?.();
      const target = redirectTo
        ?? (vendorId ? `/admin/vendors/${vendorId}` : `/admin/vendors/${data.id}`);
      router.push(target);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-8"
    >
      <Section heading="Identity">
        <Field label="Name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quanta System"
            maxLength={200}
            required
          />
        </Field>
        <Field label="Category" required>
          <Select value={category} onValueChange={(v) => setCategory(v as VendorCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description" fullWidth>
          <Textarea
            value={description ?? ""}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do they provide?"
            rows={3}
            maxLength={2000}
          />
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as VendorStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VENDOR_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section heading="Primary contact">
        <Field label="Contact name">
          <Input value={contactName ?? ""} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Contact email">
          <Input
            type="email"
            value={contactEmail ?? ""}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </Field>
        <Field label="Contact phone">
          <Input value={contactPhone ?? ""} onChange={(e) => setContactPhone(e.target.value)} />
        </Field>
      </Section>

      <Section heading="Messaging handles">
        <Field label="WhatsApp">
          <Input value={whatsapp ?? ""} onChange={(e) => setWhatsapp(e.target.value)} />
        </Field>
        <Field label="Telegram">
          <Input value={telegram ?? ""} onChange={(e) => setTelegram(e.target.value)} />
        </Field>
        <Field label="Signal">
          <Input value={signal ?? ""} onChange={(e) => setSignal(e.target.value)} />
        </Field>
      </Section>

      <Section heading="Web + account">
        <Field label="Website">
          <Input
            type="url"
            value={website ?? ""}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="Account / customer ID">
          <Input value={accountId ?? ""} onChange={(e) => setAccountId(e.target.value)} />
        </Field>
      </Section>

      <Section heading="Internal">
        <Field label="Notes" fullWidth>
          <Textarea
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal-only. No PHI."
            rows={4}
            maxLength={8000}
          />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-700/10 pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : vendorId ? "Save changes" : "Create vendor"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <p
        className="mb-4 font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {heading}
      </p>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  fullWidth,
  children,
}: {
  label: string;
  required?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <Label className="mb-2 block">
        {label}
        {required && <span className="ml-1 text-[#8A2C2C]">*</span>}
      </Label>
      {children}
    </div>
  );
}
