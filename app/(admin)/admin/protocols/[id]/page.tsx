import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";
import {
  getProtocolById,
  getProtocolSanityContent,
  listAuditLogForProtocol,
  listProtocolDevices,
  listProtocolVersions,
} from "@/lib/admin/protocols";
import { ProtocolDetailView } from "@/components/admin/protocols/ProtocolDetailView";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Protocol — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const protocolRes = await getProtocolById(id);
  if (protocolRes.error || !protocolRes.data) {
    notFound();
  }
  const protocol = protocolRes.data;

  const supabase = getServiceClient();
  const [
    devicesRes,
    versionsRes,
    auditRes,
    sanityDoc,
    activeDevicesRes,
  ] = await Promise.all([
    listProtocolDevices(id),
    listProtocolVersions(id),
    listAuditLogForProtocol(id),
    getProtocolSanityContent(protocol.sanity_id),
    supabase
      .from("devices")
      .select("id, slug, display_name, short_description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const availableDevices = (activeDevicesRes.data ?? []).map((d) => ({
    id: d.id,
    displayName: d.display_name,
    shortDescription: d.short_description,
  }));

  const studioBaseUrl = `${SITE.url}/studio`;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <ProtocolDetailView
        protocol={protocol as never}
        taggedDevices={(devicesRes.data ?? []) as never}
        availableDevices={availableDevices}
        versions={versionsRes.data ?? []}
        auditLog={auditRes.data ?? []}
        sanityDoc={sanityDoc}
        studioBaseUrl={studioBaseUrl}
      />
    </div>
  );
}
