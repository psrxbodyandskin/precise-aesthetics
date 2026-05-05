import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ModuleEditForm } from "@/components/admin/training/ModuleEditForm";

export const metadata: Metadata = {
  title: "New module — Admin",
  robots: { index: false, follow: false },
};

export default async function NewModulePage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-[760px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Training", href: "/admin/training" },
          { label: "New module" },
        ]}
      />

      <AdminPageHeader
        eyebrow="Admin"
        title="New module."
        lead="Create a training module. Upload the video and supporting materials after the module is created."
      />

      <div className="mt-10 rounded-md border border-ink-700/15 bg-bone-50 p-6 md:p-8">
        <ModuleEditForm module={null} />
      </div>
    </div>
  );
}
