"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  practiceUpdateSchema,
  US_STATES,
  type PracticeUpdateValues,
  type USState,
} from "@/lib/schemas/practice";

function isUSState(v: string | null | undefined): v is USState {
  return typeof v === "string" && (US_STATES as readonly string[]).includes(v);
}
import type { Database } from "@/lib/supabase/types";
import { StatusChip } from "./StatusChip";
import { AuditLogTable } from "./AuditLogTable";

type Practice = Database["public"]["Tables"]["practices"]["Row"];
type PracticeUser = Database["public"]["Tables"]["practice_users"]["Row"];
type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];

interface PracticeDeviceWithDevice {
  id: string;
  serial_number: string | null;
  acquired_at: string | null;
  notes: string | null;
  devices: {
    slug: string;
    display_name: string;
    short_description: string | null;
  } | null;
}

interface PracticeDetailViewProps {
  practice: Practice;
  devices: PracticeDeviceWithDevice[];
  users: PracticeUser[];
  auditLog: AuditRow[];
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

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Modal = null | "identity" | "address" | "confirm-suspend" | "confirm-archive";

export function PracticeDetailView({
  practice,
  devices,
  users,
  auditLog,
}: PracticeDetailViewProps) {
  const router = useRouter();
  const [modal, setModal] = useState<Modal>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState(
    practice.internal_notes ?? "",
  );

  async function postAction(path: string, label: string) {
    setActionPending(label);
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Action failed.");
      } else {
        toast.success(`Done.`);
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setActionPending(null);
    }
  }

  async function deleteAction() {
    setActionPending("archive");
    try {
      const res = await fetch(`/api/admin/practices/${practice.id}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not archive.");
      } else {
        toast.success("Practice archived.");
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setActionPending(null);
      setModal(null);
    }
  }

  async function saveInternalNotes() {
    if ((internalNotes || "") === (practice.internal_notes ?? "")) return;
    try {
      const res = await fetch(`/api/admin/practices/${practice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internalNotes }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast.error("Could not save notes.");
      } else {
        toast.success("Notes saved.");
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    }
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § {practice.name}
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontWeight: 400,
            }}
          >
            {practice.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-caption text-ink-500">
            <StatusChip status={practice.status} />
            <span>·</span>
            <span>
              Provisioned {formatDate(practice.provisioned_at)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {practice.status === "pending" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                postAction(
                  `/api/admin/practices/${practice.id}/resend-invite`,
                  "resend-invite",
                )
              }
              disabled={actionPending === "resend-invite"}
              suppressHydrationWarning
            >
              {actionPending === "resend-invite"
                ? "Resending…"
                : "Resend invite"}
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              postAction(
                `/api/admin/practices/${practice.id}/force-password-reset`,
                "reset",
              )
            }
            disabled={actionPending === "reset"}
            suppressHydrationWarning
          >
            {actionPending === "reset"
              ? "Sending…"
              : "Force password reset"}
          </Button>
          {practice.status !== "suspended" && practice.status !== "archived" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModal("confirm-suspend")}
              suppressHydrationWarning
            >
              Suspend
            </Button>
          )}
          {practice.status !== "archived" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModal("confirm-archive")}
              suppressHydrationWarning
            >
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* A. Identity */}
      <section>
        <SectionHeader
          label="Identity"
          actionLabel="Edit"
          onAction={() => setModal("identity")}
        />
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Practice name" value={practice.name} />
          <Field label="Primary email" value={practice.primary_email} />
          <Field label="Phone" value={practice.phone ?? "—"} />
        </dl>
      </section>

      {/* B. Address */}
      <section>
        <SectionHeader
          label="Address"
          actionLabel="Edit"
          onAction={() => setModal("address")}
        />
        <div className="mt-6 font-body text-body leading-body text-ink-700">
          {practice.address_line1 ? (
            <address className="not-italic">
              {practice.address_line1}
              {practice.address_line2 && (
                <>
                  <br />
                  {practice.address_line2}
                </>
              )}
              <br />
              {[practice.city, practice.state, practice.postal_code]
                .filter(Boolean)
                .join(", ")}
              {practice.country && practice.country !== "US" ? (
                <>
                  <br />
                  {practice.country}
                </>
              ) : null}
            </address>
          ) : (
            <p className="text-ink-500">No address on file.</p>
          )}
        </div>
      </section>

      {/* C. Devices owned */}
      <section>
        <SectionHeader label="Devices owned" />
        <div className="mt-6">
          {devices.length === 0 ? (
            <p className="font-body text-caption text-ink-500">
              No devices assigned.
            </p>
          ) : (
            <ul className="space-y-3">
              {devices.map((d) => (
                <li
                  key={d.id}
                  className="rounded-md border border-ink-700/15 bg-bone-50 p-4"
                >
                  <p className="font-body text-body font-medium text-ink-900">
                    {d.devices?.display_name ?? d.devices?.slug ?? "Device"}
                  </p>
                  <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-body text-caption text-ink-500">
                    <div className="flex gap-2">
                      <dt>Serial:</dt>
                      <dd className="text-ink-700">
                        {d.serial_number ?? "—"}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt>Acquired:</dt>
                      <dd className="text-ink-700">
                        {d.acquired_at ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* D. Authorized users (read-only here) */}
      <section>
        <SectionHeader label="Authorized users" />
        <p className="mt-2 font-body text-caption text-ink-500">
          Authorized users are managed by the practice from
          their portal settings.
        </p>
        <div className="mt-4">
          {users.length === 0 ? (
            <p className="font-body text-caption text-ink-500">
              No users yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between border-b border-ink-700/10 py-2 last:border-b-0"
                >
                  <span className="font-body text-body text-ink-900">
                    {u.full_name}
                  </span>
                  <span className="font-body text-caption text-ink-500">
                    {u.role_at_practice ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* E. Internal notes (admin-only, save on blur) */}
      <section>
        <SectionHeader label="Internal notes" />
        <p className="mt-2 font-body text-caption text-ink-500">
          Admin-only. Not shown to the practice.
        </p>
        <Textarea
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          onBlur={saveInternalNotes}
          rows={5}
          className={cn(textareaClass, "mt-3")}
        />
      </section>

      {/* F. Activity log */}
      <section>
        <SectionHeader label="Activity" />
        <div className="mt-6">
          <AuditLogTable entries={auditLog} />
          {auditLog.length >= 50 && (
            <p className="mt-4 font-body text-caption text-ink-500">
              Showing the most recent 50 entries. The full
              audit explorer ships in a later release.
            </p>
          )}
        </div>
      </section>

      {/* G. Account auth info */}
      <section>
        <SectionHeader label="Account" />
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Auth user ID" value={practice.auth_user_id ?? "—"} mono />
          <Field
            label="Status changed at"
            value={formatDate(practice.status_changed_at)}
          />
          <Field
            label="Created"
            value={formatDate(practice.created_at)}
          />
          <Field
            label="Updated"
            value={formatDate(practice.updated_at)}
          />
        </dl>
      </section>

      {/* Modals */}
      <IdentityModal
        open={modal === "identity"}
        onClose={() => setModal(null)}
        practiceId={practice.id}
        defaults={{
          name: practice.name,
          phone: practice.phone ?? "",
        }}
      />
      <AddressModal
        open={modal === "address"}
        onClose={() => setModal(null)}
        practiceId={practice.id}
        defaults={{
          addressLine1: practice.address_line1 ?? "",
          addressLine2: practice.address_line2 ?? "",
          city: practice.city ?? "",
          state: isUSState(practice.state) ? practice.state : null,
          postalCode: practice.postal_code ?? "",
        }}
      />

      {/* Confirmation dialogs */}
      <Dialog
        open={modal === "confirm-suspend"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Suspend this practice?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-body text-ink-700">
            They&rsquo;ll lose access immediately and won&rsquo;t be able to
            sign in until the account is reactivated. This action is logged.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                postAction(
                  `/api/admin/practices/${practice.id}/suspend`,
                  "suspend",
                );
                setModal(null);
              }}
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modal === "confirm-archive"}
        onOpenChange={(o) => !o && setModal(null)}
      >
        <DialogContent className="bg-bone-50 border-ink-700/35">
          <DialogHeader>
            <DialogTitle className="font-display text-ink-900">
              Archive this practice?
            </DialogTitle>
          </DialogHeader>
          <p className="font-body text-body text-ink-700">
            The record stays in the database but is hidden from
            default lists. This action is logged.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={deleteAction}
              disabled={actionPending === "archive"}
            >
              {actionPending === "archive"
                ? "Archiving…"
                : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------- helpers

function SectionHeader({
  label,
  actionLabel,
  onAction,
}: {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink-700/10 pb-3">
      <h2
        className="font-body text-overline font-medium uppercase text-brand-700"
        style={EYEBROW_TRACKING}
      >
        {label}
      </h2>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="font-body text-caption text-brand-700 underline-offset-[3px] decoration-1 transition-colors duration-[150ms] hover:text-ink-900 hover:underline outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-body text-ink-900",
          mono && "font-mono text-small",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------- modals

function IdentityModal({
  open,
  onClose,
  practiceId,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  practiceId: string;
  defaults: { name: string; phone: string };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PracticeUpdateValues>({
    resolver: zodResolver(practiceUpdateSchema),
    defaultValues: {
      name: defaults.name,
      phone: defaults.phone,
    },
  });

  async function onSubmit(values: PracticeUpdateValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/practices/${practiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save.");
        setSubmitting(false);
        return;
      }
      toast.success("Saved.");
      onClose();
      router.refresh();
    } catch {
      toast.error("Network error.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bone-50 border-ink-700/35">
        <DialogHeader>
          <DialogTitle className="font-display text-ink-900">
            Edit identity
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Practice name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
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
                  <FormLabel className={labelClass}>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                  <FormMessage className={messageClass} />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddressModal({
  open,
  onClose,
  practiceId,
  defaults,
}: {
  open: boolean;
  onClose: () => void;
  practiceId: string;
  defaults: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: PracticeUpdateValues["state"];
    postalCode: string;
  };
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PracticeUpdateValues>({
    resolver: zodResolver(practiceUpdateSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: PracticeUpdateValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/practices/${practiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save.");
        setSubmitting(false);
        return;
      }
      toast.success("Saved.");
      onClose();
      router.refresh();
    } catch {
      toast.error("Network error.");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bone-50 border-ink-700/35">
        <DialogHeader>
          <DialogTitle className="font-display text-ink-900">
            Edit address
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="addressLine1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Street address</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="addressLine2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Suite, unit, etc.</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ""} className={inputClass} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>City</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} className={inputClass} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>State</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className={selectTriggerClass}>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={selectContentClass}>
                        {US_STATES.map((s) => (
                          <SelectItem key={s} value={s} className={selectItemClass}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Postal code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} className={inputClass} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
