import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";
import { listProtocols } from "@/lib/admin/protocols";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { ProtocolsTable } from "@/components/admin/protocols/ProtocolsTable";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Protocols — Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProtocolsPage() {
  await requireAdmin();
  const supabase = getServiceClient();

  const [{ data: protocols }, { data: indications }] = await Promise.all([
    listProtocols({ status: "all", limit: 100, offset: 0 }),
    supabase
      .from("indication_categories")
      .select("id, title")
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Protocols" }]} />

      <AdminPageHeader
        eyebrow="Admin"
        title="Protocols"
        lead="Authoring lives in Sanity Studio. Publish state, device tagging, and version history live here."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/studio" target="_blank" rel="noopener noreferrer">
              Open Sanity Studio
            </Link>
          </Button>
        }
      />

      <div className="mt-12">
        <ProtocolsTable
          protocols={(protocols ?? []) as never}
          indications={(indications ?? []) as never}
        />
      </div>
    </div>
  );
}
