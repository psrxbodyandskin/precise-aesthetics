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
import type { VendorRow } from "@/lib/admin/vendors";
import { VendorCategoryChip } from "./VendorCategoryChip";
import { VendorStatusChip } from "./VendorStatusChip";
import { VendorForm } from "./VendorForm";

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface VendorDetailViewProps {
  vendor: VendorRow;
}

export function VendorDetailView({ vendor }: VendorDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archivePending, startArchive] = useTransition();

  function archive() {
    startArchive(async () => {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
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
      toast.success("Vendor archived.");
      setArchiveOpen(false);
      router.push("/admin/vendors");
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
            § Editing vendor
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
            {vendor.name}
          </h1>
        </header>
        <VendorForm
          vendorId={vendor.id}
          initial={vendor}
          onSaved={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              § Vendor
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
              {vendor.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <VendorCategoryChip category={vendor.category} />
              <VendorStatusChip status={vendor.status} />
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
            {vendor.status !== "former" && (
              <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    Archive
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Archive {vendor.name}?</DialogTitle>
                  </DialogHeader>
                  <p
                    className="font-body text-small text-ink-700"
                    style={{ lineHeight: 1.6 }}
                  >
                    This hides the vendor from active lists. Nothing is
                    permanently deleted — the record stays for audit purposes
                    and can be reactivated by editing the status.
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

      {vendor.description && (
        <Section heading="Description">
          <p
            className="font-body text-ink-900"
            style={{ lineHeight: 1.65, whiteSpace: "pre-wrap" }}
          >
            {vendor.description}
          </p>
        </Section>
      )}

      <Section heading="Primary contact">
        <DL>
          <DT label="Name">{vendor.contact_name ?? "—"}</DT>
          <DT label="Email">
            {vendor.contact_email ? (
              <a
                href={`mailto:${vendor.contact_email}`}
                className="text-brand-700 underline-offset-2 hover:underline"
              >
                {vendor.contact_email}
              </a>
            ) : (
              "—"
            )}
          </DT>
          <DT label="Phone">{vendor.contact_phone ?? "—"}</DT>
        </DL>
      </Section>

      {(vendor.whatsapp || vendor.telegram || vendor.signal) && (
        <Section heading="Messaging">
          <DL>
            {vendor.whatsapp && <DT label="WhatsApp">{vendor.whatsapp}</DT>}
            {vendor.telegram && <DT label="Telegram">{vendor.telegram}</DT>}
            {vendor.signal && <DT label="Signal">{vendor.signal}</DT>}
          </DL>
        </Section>
      )}

      {(vendor.website || vendor.account_id) && (
        <Section heading="Web + account">
          <DL>
            {vendor.website && (
              <DT label="Website">
                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand-700 underline-offset-2 hover:underline"
                >
                  {vendor.website}
                  <ExternalLink
                    className="size-3"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </a>
              </DT>
            )}
            {vendor.account_id && (
              <DT label="Account / customer ID">{vendor.account_id}</DT>
            )}
          </DL>
        </Section>
      )}

      {vendor.notes && (
        <Section heading="Internal notes">
          <p
            className="whitespace-pre-wrap rounded-md border border-ink-700/10 bg-bone-50 p-4 font-body text-small text-ink-900"
            style={{ lineHeight: 1.65 }}
          >
            {vendor.notes}
          </p>
        </Section>
      )}

      <p className="font-body text-caption text-ink-500">
        Created {new Date(vendor.created_at).toLocaleString()}
        {vendor.updated_at !== vendor.created_at &&
          ` · Updated ${new Date(vendor.updated_at).toLocaleString()}`}
      </p>
    </div>
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

function DT({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
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
