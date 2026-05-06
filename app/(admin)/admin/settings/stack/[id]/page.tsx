import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import {
  getStackServiceById,
  listEnvVarsForService,
} from "@/lib/admin/stack";
import { getServiceClient } from "@/lib/supabase/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { StackDetailView } from "@/components/admin/stack/StackDetailView";

export const metadata: Metadata = {
  title: "Service — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StackServiceDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const [serviceRes, envVarsRes] = await Promise.all([
    getStackServiceById(id),
    listEnvVarsForService(id),
  ]);

  if (serviceRes.error || !serviceRes.data) notFound();
  const service = serviceRes.data;

  // Resolve account owner email if set (for display only)
  let ownerEmail: string | null = null;
  if (service.account_owner_user_id) {
    const supabase = getServiceClient();
    const { data: ownerData } = await supabase.auth.admin.getUserById(
      service.account_owner_user_id,
    );
    ownerEmail = ownerData?.user?.email ?? null;
  }

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Settings" },
          { label: "Stack", href: "/admin/settings/stack" },
          { label: service.name },
        ]}
      />
      <div className="mt-8">
        <StackDetailView
          service={service}
          envVars={envVarsRes.data}
          ownerEmail={ownerEmail}
        />
      </div>
    </div>
  );
}
