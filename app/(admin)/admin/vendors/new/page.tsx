import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { VendorForm } from "@/components/admin/vendors/VendorForm";

export const metadata: Metadata = {
  title: "New vendor — Admin",
  robots: { index: false, follow: false },
};

export default async function NewVendorPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Vendors", href: "/admin/vendors" },
          { label: "New" },
        ]}
      />
      <AdminPageHeader
        eyebrow="Admin · Vendors"
        title="New vendor."
        lead="Add a manufacturer, software vendor, service provider, or other business contact."
      />
      <div className="mt-10">
        <VendorForm />
      </div>
    </div>
  );
}
