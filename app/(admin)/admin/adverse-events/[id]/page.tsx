import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import { getAdverseEventById } from "@/lib/admin/adverse-events";
import { getServiceClient } from "@/lib/supabase/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdverseEventDetailView } from "@/components/admin/adverse-events/AdverseEventDetailView";

export const metadata: Metadata = {
  title: "Adverse Event — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminAdverseEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const result = await getAdverseEventById(id);
  if (!result) notFound();

  const { adverse, photos } = result;

  // Generate signed URLs for photos
  const supabase = getServiceClient();
  const photoUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from("treatment-photos")
        .createSignedUrl(p.storage_path, 60 * 60);
      return { ...p, signedUrl: data?.signedUrl ?? null };
    }),
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb
        items={[
          { label: "Adverse Events", href: "/admin/adverse-events" },
          { label: formatBreadcrumbLabel(adverse) },
        ]}
      />
      <AdverseEventDetailView adverse={adverse as never} photos={photoUrls as never} />
    </div>
  );
}

function formatBreadcrumbLabel(adverse: { created_at: string }): string {
  try {
    return new Date(adverse.created_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Detail";
  }
}
