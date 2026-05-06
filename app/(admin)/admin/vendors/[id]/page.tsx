import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import { getVendorById } from "@/lib/admin/vendors";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { VendorDetailView } from "@/components/admin/vendors/VendorDetailView";

export const metadata: Metadata = {
  title: "Vendor — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const result = await getVendorById(id);
  if (result.error || !result.data) notFound();
  const vendor = result.data;

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Vendors", href: "/admin/vendors" },
          { label: vendor.name },
        ]}
      />
      <div className="mt-8">
        <VendorDetailView vendor={vendor} />
      </div>
    </div>
  );
}
