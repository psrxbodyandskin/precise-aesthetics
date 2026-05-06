"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { StackServiceRow, StackEnvVarRow } from "@/lib/admin/stack";
import { StackCategoryChip } from "./StackCategoryChip";
import { StackSecurityBanner } from "./StackSecurityBanner";
import { StackServiceForm } from "./StackServiceForm";
import { StackEnvVarsTable } from "./StackEnvVarsTable";
import { cn } from "@/lib/utils";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface StackDetailViewProps {
  service: StackServiceRow;
  envVars: StackEnvVarRow[];
  ownerEmail: string | null;
}

export function StackDetailView({
  service,
  envVars,
  ownerEmail,
}: StackDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivePending, startArchive] = useTransition();

  function archive() {
    startArchive(async () => {
      const res = await fetch(`/api/admin/stack/${service.id}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not archive.");
        return;
      }
      toast.success("Service archived.");
      setArchiveOpen(false);
      router.push("/admin/settings/stack");
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="space-y-8">
        <header>
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            § Editing service
          </p>
          <h1
            className="mt-3 font-display text-ink-900"
            style={{
              fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              fontWeight: 400,
            }}
          >
            {service.name}
          </h1>
        </header>
        <StackServiceForm
          serviceId={service.id}
          initial={{
            name: service.name,
            category: service.category,
            what_it_does: service.what_it_does,
            plan_tier: service.plan_tier ?? undefined,
            monthly_cost_estimate_usd: service.monthly_cost_estimate_usd ?? undefined,
            renewal_date: service.renewal_date ?? undefined,
            login_url: service.login_url ?? undefined,
            account_owner_user_id: service.account_owner_user_id ?? undefined,
            credentials_storage_location:
              service.credentials_storage_location ?? undefined,
            support_contact: service.support_contact ?? undefined,
            documentation_links: service.documentation_links ?? undefined,
            status: service.status,
            notes: service.notes ?? undefined,
          }}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Persistent security banner */}
      <StackSecurityBanner />

      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              § Stack service
            </p>
            <h1
              className="mt-3 font-display text-ink-900"
              style={{
                fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2.25rem)",
                lineHeight: 1.1,
                letterSpacing: "-0.015em",
                fontWeight: 400,
              }}
            >
              {service.name}
            </h1>
            <p
              className="mt-2 font-body text-ink-700"
              style={{ lineHeight: 1.55 }}
            >
              {service.what_it_does}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StackCategoryChip category={service.category} />
              <StatusChip status={service.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil
                className="mr-1 size-3.5"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              Edit
            </Button>
            {service.status !== "former" && (
              <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Archive
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Archive {service.name}?</DialogTitle>
                  </DialogHeader>
                  <p
                    className="font-body text-small text-ink-700"
                    style={{ lineHeight: 1.6 }}
                  >
                    This hides the service from active lists. Nothing is
                    permanently deleted — env var entries stay attached and the
                    record can be reactivated by editing the status.
                  </p>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setArchiveOpen(false)}
                      disabled={archivePending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={archive}
                      disabled={archivePending}
                    >
                      {archivePending ? "Archiving…" : "Archive"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <Section heading="Plan + cost">
        <DL>
          <DT label="Plan / tier">{service.plan_tier ?? "—"}</DT>
          <DT label="Monthly cost">
            {service.monthly_cost_estimate_usd !== null
              ? `$${Number(service.monthly_cost_estimate_usd).toFixed(2)}`
              : "—"}
          </DT>
          <DT label="Renewal">
            {service.renewal_date
              ? new Date(service.renewal_date).toLocaleDateString()
              : "—"}
          </DT>
        </DL>
      </Section>

      <Section heading="Access">
        <DL>
          <DT label="Login URL">
            {service.login_url ? (
              <a
                href={service.login_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-700 underline-offset-2 hover:underline"
              >
                {service.login_url}
                <ExternalLink
                  className="size-3"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </a>
            ) : (
              "—"
            )}
          </DT>
          <DT label="Account owner">{ownerEmail ?? "—"}</DT>
          <DT label="Credentials storage location" fullWidth>
            {service.credentials_storage_location ?? (
              <span className="text-ink-300">— not set —</span>
            )}
          </DT>
        </DL>
      </Section>

      <Section heading="Env variables">
        <StackEnvVarsTable serviceId={service.id} envVars={envVars} />
      </Section>

      <Section heading="Support + docs">
        <DL>
          <DT label="Support contact">
            {service.support_contact ?? "—"}
          </DT>
          <DT label="Documentation links" fullWidth>
            {service.documentation_links ? (
              <pre
                className="whitespace-pre-wrap rounded-sm bg-bone-100/60 p-3 font-mono text-caption text-ink-900"
                style={{ lineHeight: 1.55 }}
              >
                {service.documentation_links}
              </pre>
            ) : (
              "—"
            )}
          </DT>
        </DL>
      </Section>

      {service.notes && (
        <Section heading="Internal notes">
          <p
            className="whitespace-pre-wrap rounded-md border border-ink-700/10 bg-bone-50 p-4 font-body text-small text-ink-900"
            style={{ lineHeight: 1.65 }}
          >
            {service.notes}
          </p>
        </Section>
      )}

      <p className="font-body text-caption text-ink-500">
        Created {new Date(service.created_at).toLocaleString()}
        {service.updated_at !== service.created_at &&
          ` · Updated ${new Date(service.updated_at).toLocaleString()}`}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: "active" | "paused" | "former" }) {
  const STYLE = {
    active: "bg-brand-300/15 text-brand-700 ring-brand-700/25",
    paused: "bg-bone-200 text-ink-500 ring-ink-500/20",
    former: "bg-bone-200 text-ink-300 ring-ink-300/20",
  } as const;
  const LABEL = {
    active: "Active",
    paused: "Paused",
    former: "Former",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase ring-1 ring-inset",
        STYLE[status],
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {LABEL[status]}
    </span>
  );
}

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
      {children}
    </section>
  );
}

function DL({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-5 sm:grid-cols-2">{children}</dl>;
}

function DT({
  label,
  fullWidth,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <dt
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
      </dt>
      <dd className="mt-1 font-body text-ink-900">{children}</dd>
    </div>
  );
}
