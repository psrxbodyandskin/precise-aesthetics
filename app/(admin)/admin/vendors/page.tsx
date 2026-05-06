import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import { listVendors } from "@/lib/admin/vendors";
import {
  VENDOR_CATEGORIES,
  VENDOR_STATUSES,
  type VendorCategory,
  type VendorStatus,
} from "@/lib/schemas/vendor";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { VendorsListView } from "@/components/admin/vendors/VendorsListView";
import { VendorsFilterBar } from "@/components/admin/vendors/VendorsFilterBar";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Vendors — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminVendorsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const categories = (Array.isArray(sp.category) ? sp.category : sp.category ? [sp.category] : [])
    .filter((c): c is VendorCategory =>
      (VENDOR_CATEGORIES as readonly string[]).includes(c),
    );
  const statuses = (Array.isArray(sp.status) ? sp.status : sp.status ? [sp.status] : [])
    .filter((s): s is VendorStatus =>
      (VENDOR_STATUSES as readonly string[]).includes(s),
    );

  const result = await listVendors({
    q,
    category: categories.length > 0 ? categories : undefined,
    status: statuses.length > 0 ? statuses : undefined,
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Vendors" }]} />
      <AdminPageHeader
        eyebrow="Admin · Vendors"
        title="Vendors."
        lead="Track every business contact in one place."
        actions={
          <Button asChild>
            <Link href="/admin/vendors/new">+ New vendor</Link>
          </Button>
        }
      />

      <div className="mt-10">
        <VendorsFilterBar />
      </div>

      <div className="mt-6">
        <VendorsListView items={result.data} />
      </div>
    </div>
  );
}
