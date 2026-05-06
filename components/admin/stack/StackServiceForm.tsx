"use client";

import { useEffect, useState, useTransition } from "react";
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
import { STACK_CATEGORIES, STACK_STATUSES } from "@/lib/schemas/stack";
import type {
  StackCategory,
  StackStatus,
  StackServiceCreateInput,
} from "@/lib/schemas/stack";
import { STACK_CATEGORY_LABEL } from "./StackCategoryChip";

interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
}

interface StackServiceFormProps {
  serviceId?: string;
  initial?: Partial<StackServiceCreateInput>;
  onSaved?: () => void;
  onCancel?: () => void;
}

export function StackServiceForm({
  serviceId,
  initial,
  onSaved,
  onCancel,
}: StackServiceFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [admins, setAdmins] = useState<AdminUser[]>([]);

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<StackCategory>(
    (initial?.category as StackCategory) ?? "hosting",
  );
  const [whatItDoes, setWhatItDoes] = useState(initial?.what_it_does ?? "");
  const [planTier, setPlanTier] = useState(initial?.plan_tier ?? "");
  const [costStr, setCostStr] = useState(
    initial?.monthly_cost_estimate_usd !== null &&
      initial?.monthly_cost_estimate_usd !== undefined
      ? String(initial.monthly_cost_estimate_usd)
      : "",
  );
  const [renewalDate, setRenewalDate] = useState(initial?.renewal_date ?? "");
  const [loginUrl, setLoginUrl] = useState(initial?.login_url ?? "");
  const [accountOwner, setAccountOwner] = useState(
    initial?.account_owner_user_id ?? "",
  );
  const [credsLocation, setCredsLocation] = useState(
    initial?.credentials_storage_location ?? "",
  );
  const [supportContact, setSupportContact] = useState(
    initial?.support_contact ?? "",
  );
  const [docsLinks, setDocsLinks] = useState(initial?.documentation_links ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<StackStatus>(
    (initial?.status as StackStatus) ?? "active",
  );

  // Load admin users for the account-owner picker
  useEffect(() => {
    fetch("/api/admin/users?role=admin")
      .then((r) => r.json())
      .then((d: { ok?: boolean; users?: AdminUser[] }) => {
        if (d.ok && d.users) setAdmins(d.users);
      })
      .catch(() => {
        // non-fatal — form still works with the user-id field empty
      });
  }, []);

  function submit() {
    if (name.trim().length < 1) {
      toast.error("Name is required.");
      return;
    }
    if (whatItDoes.trim().length < 1) {
      toast.error("What it does is required.");
      return;
    }

    const cost = costStr.trim() === "" ? null : Number.parseFloat(costStr.trim());
    if (cost !== null && (Number.isNaN(cost) || cost < 0)) {
      toast.error("Monthly cost must be a positive number.");
      return;
    }

    if (renewalDate && !/^\d{4}-\d{2}-\d{2}$/.test(renewalDate)) {
      toast.error("Renewal date must be YYYY-MM-DD.");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      what_it_does: whatItDoes.trim(),
      plan_tier: planTier.trim() || null,
      monthly_cost_estimate_usd: cost,
      renewal_date: renewalDate || null,
      login_url: loginUrl.trim() || null,
      account_owner_user_id: accountOwner || null,
      credentials_storage_location: credsLocation.trim() || null,
      support_contact: supportContact.trim() || null,
      documentation_links: docsLinks.trim() || null,
      notes: notes.trim() || null,
      status,
    };

    startTransition(async () => {
      const url = serviceId
        ? `/api/admin/stack/${serviceId}`
        : "/api/admin/stack";
      const method = serviceId ? "PATCH" : "POST";
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
      toast.success(serviceId ? "Updated." : "Service created.");
      onSaved?.();
      router.push(
        serviceId
          ? `/admin/settings/stack/${serviceId}`
          : `/admin/settings/stack/${data.id}`,
      );
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
            placeholder="e.g. Vercel"
            required
            maxLength={200}
          />
        </Field>
        <Field label="Category" required>
          <Select value={category} onValueChange={(v) => setCategory(v as StackCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STACK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {STACK_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="What it does" required fullWidth>
          <Input
            value={whatItDoes}
            onChange={(e) => setWhatItDoes(e.target.value)}
            placeholder="One-line description"
            required
            maxLength={500}
          />
        </Field>
        <Field label="Status">
          <Select value={status} onValueChange={(v) => setStatus(v as StackStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STACK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      <Section heading="Plan + cost">
        <Field label="Plan / tier">
          <Input
            value={planTier ?? ""}
            onChange={(e) => setPlanTier(e.target.value)}
            placeholder="e.g. Pro"
          />
        </Field>
        <Field label="Monthly cost estimate (USD)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={costStr}
            onChange={(e) => setCostStr(e.target.value)}
            placeholder="e.g. 25.00"
          />
        </Field>
        <Field label="Renewal date">
          <Input
            type="date"
            value={renewalDate ?? ""}
            onChange={(e) => setRenewalDate(e.target.value)}
          />
        </Field>
      </Section>

      <Section heading="Access">
        <Field label="Login URL">
          <Input
            type="url"
            value={loginUrl ?? ""}
            onChange={(e) => setLoginUrl(e.target.value)}
            placeholder="https://"
          />
        </Field>
        <Field label="Account owner">
          <Select
            value={accountOwner || "_none"}
            onValueChange={(v) => setAccountOwner(v === "_none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="(none)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— None —</SelectItem>
              {admins.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.display_name ? `${u.display_name} · ${u.email}` : u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Credentials storage location" fullWidth>
          <Input
            value={credsLocation ?? ""}
            onChange={(e) => setCredsLocation(e.target.value)}
            placeholder="e.g. 1Password: Precise Production vault > Vercel admin"
          />
          <p
            className="mt-1 font-body text-caption text-ink-500"
            style={{ lineHeight: 1.5 }}
          >
            Where the actual secret lives. Never paste the secret itself.
          </p>
        </Field>
      </Section>

      <Section heading="Support + docs">
        <Field label="Support contact" fullWidth>
          <Input
            value={supportContact ?? ""}
            onChange={(e) => setSupportContact(e.target.value)}
            placeholder="email or URL"
          />
        </Field>
        <Field label="Documentation links" fullWidth>
          <Textarea
            value={docsLinks ?? ""}
            onChange={(e) => setDocsLinks(e.target.value)}
            placeholder='Use Markdown — [label](https://...) per line.'
            rows={3}
            maxLength={8000}
          />
        </Field>
      </Section>

      <Section heading="Internal">
        <Field label="Notes" fullWidth>
          <Textarea
            value={notes ?? ""}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Internal-only."
            rows={4}
            maxLength={8000}
          />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-700/10 pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : serviceId ? "Save changes" : "Create service"}
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
