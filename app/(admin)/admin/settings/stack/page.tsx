import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import {
  getTotalMonthlyCost,
  listStackServices,
} from "@/lib/admin/stack";
import {
  STACK_CATEGORIES,
  STACK_STATUSES,
  type StackCategory,
  type StackStatus,
} from "@/lib/schemas/stack";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StackServicesList } from "@/components/admin/stack/StackServicesList";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Stack reference — Admin",
  robots: { index: false, follow: false },
};

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminStackPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const categories = (Array.isArray(sp.category) ? sp.category : sp.category ? [sp.category] : [])
    .filter((c): c is StackCategory =>
      (STACK_CATEGORIES as readonly string[]).includes(c),
    );
  const statuses = (Array.isArray(sp.status) ? sp.status : sp.status ? [sp.status] : [])
    .filter((s): s is StackStatus =>
      (STACK_STATUSES as readonly string[]).includes(s),
    );

  const [{ data: services }, totalCost] = await Promise.all([
    listStackServices({
      category: categories.length > 0 ? categories : undefined,
      status: statuses.length > 0 ? statuses : undefined,
    }),
    getTotalMonthlyCost(),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Settings" }, { label: "Stack" }]} />
      <AdminPageHeader
        eyebrow="Settings · Stack"
        title="Stack reference."
        lead="Every system we use, every env var name, where the credentials live. NO actual secrets stored here."
        actions={
          <Button asChild>
            <Link href="/admin/settings/stack/new">+ New service</Link>
          </Button>
        }
      />

      {services.length > 0 && (
        <div className="mt-10 rounded-md border border-ink-700/15 bg-bone-50 px-5 py-4">
          <p
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Total monthly stack cost
          </p>
          <p
            className="mt-1 font-display text-ink-900"
            style={{ fontSize: "1.75rem", lineHeight: 1.2, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}
          >
            ${totalCost.toFixed(2)}/mo
          </p>
          <p
            className="mt-1 font-body text-caption text-ink-500"
            style={{ lineHeight: 1.55 }}
          >
            Across {services.filter((s) => s.status === "active").length} active services. Estimates only — confirm against vendor invoices.
          </p>
        </div>
      )}

      <div className="mt-10">
        <StackServicesList services={services} />
      </div>
    </div>
  );
}
