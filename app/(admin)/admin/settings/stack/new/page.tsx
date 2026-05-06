import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { StackServiceForm } from "@/components/admin/stack/StackServiceForm";
import { StackSecurityBanner } from "@/components/admin/stack/StackSecurityBanner";

export const metadata: Metadata = {
  title: "New service — Admin",
  robots: { index: false, follow: false },
};

export default async function NewStackServicePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Settings" },
          { label: "Stack", href: "/admin/settings/stack" },
          { label: "New" },
        ]}
      />
      <AdminPageHeader
        eyebrow="Settings · Stack"
        title="New service."
        lead="Add a vendor we depend on. Env vars get added on the detail page after creating."
      />
      <div className="mt-8">
        <StackSecurityBanner />
      </div>
      <div className="mt-8">
        <StackServiceForm />
      </div>
    </div>
  );
}
