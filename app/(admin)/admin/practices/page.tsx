import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import { listPractices } from "@/lib/admin/practices";
import { isPracticeStatus, type PracticeStatus } from "@/lib/schemas/practice";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import {
  PracticesTable,
  type PracticeRowData,
} from "@/components/admin/practices/PracticesTable";

export const metadata: Metadata = {
  title: "Practices",
  robots: { index: false, follow: false },
};

interface SearchParams {
  status?: string;
  search?: string;
}

export default async function AdminPracticesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const statusParam = params.status;
  const statusFilter: PracticeStatus | "all" =
    statusParam === "all" || !statusParam
      ? "all"
      : isPracticeStatus(statusParam)
        ? statusParam
        : "all";
  const search = params.search ?? "";

  const { data, count, error } = await listPractices({
    status: statusFilter,
    search,
    limit: 50,
    offset: 0,
  });

  const rows: PracticeRowData[] = (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    primary_email: p.primary_email,
    status: p.status,
    created_at: p.created_at,
  }));

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminPageHeader
        eyebrow={"Admin"}
        title={"Practices"}
        lead="Manage practice accounts, device assignments, and invite status."
        actions={
          <Link
            href="/admin/practices/new"
            className="inline-flex h-10 items-center rounded-md bg-midnight-800 px-5 font-body text-small font-medium text-cream-50 transition-colors duration-[150ms] hover:bg-midnight-700"
          >
            + New practice
          </Link>
        }
      />

      <div className="mt-12">
        {error ? (
          <p className="font-body text-body text-red-700">
            Could not load practices.
          </p>
        ) : (
          <PracticesTable
            practices={rows}
            total={count ?? 0}
            initialStatus={statusFilter}
            initialSearch={search}
          />
        )}
      </div>
    </div>
  );
}
