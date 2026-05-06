import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth/server";
import {
  getDistinctActionVerbs,
  getDistinctTargetTypes,
  listAllPracticesForFilter,
  listAuditLogEntries,
} from "@/lib/admin/audit-log";
import {
  auditLogFiltersSchema,
  type AuditLogFilters,
} from "@/lib/schemas/audit-log";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { AuditLogFilterBar } from "@/components/admin/audit-log/AuditLogFilterBar";
import { AuditLogList } from "@/components/admin/audit-log/AuditLogList";
import { AuditLogPagination } from "@/components/admin/audit-log/AuditLogPagination";
import { ExportCsvButton } from "@/components/admin/audit-log/ExportCsvButton";

export const metadata: Metadata = {
  title: "Audit log — Admin",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAuditLogPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  // Coerce array params to single values (we use single-value filters)
  const single = (k: string): string | undefined => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const parsed = auditLogFiltersSchema.safeParse({
    q: single("q"),
    actor_id: single("actor_id"),
    actor_role: single("actor_role"),
    action: single("action"),
    target_type: single("target_type"),
    target_id: single("target_id"),
    practice_id: single("practice_id"),
    date_from: single("date_from"),
    date_to: single("date_to"),
    page: single("page"),
    page_size: single("page_size"),
  });

  // Fall back to defaults silently on bad input — UI doesn't surface
  // raw zod errors here (filter-bar URL state is operator-controlled).
  const filters: AuditLogFilters = parsed.success ? parsed.data : {};

  const [{ entries, total }, actionVerbs, targetTypes, practices] =
    await Promise.all([
      listAuditLogEntries(filters),
      getDistinctActionVerbs(),
      getDistinctTargetTypes(),
      listAllPracticesForFilter(),
    ]);

  const page = filters.page ?? 1;
  const pageSize = filters.page_size ?? 50;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Audit log" }]} />
      <AdminPageHeader
        eyebrow="Admin · Audit log"
        title="Audit log."
        lead="Every meaningful action across the system. Filter and inspect for compliance, investigation, and operational review."
        actions={<ExportCsvButton />}
      />

      <div className="mt-10">
        <AuditLogFilterBar
          actionVerbs={actionVerbs}
          targetTypes={targetTypes}
          practices={practices}
        />
      </div>

      <div className="mt-6">
        <AuditLogList entries={entries} />
      </div>

      {total > 0 && (
        <div className="mt-6">
          <AuditLogPagination
            page={page}
            pageSize={pageSize}
            total={total}
          />
        </div>
      )}
    </div>
  );
}
