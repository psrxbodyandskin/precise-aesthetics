import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/server";
import {
  getCurriculumCertStats,
  listAllCurricula,
  listAllModules,
} from "@/lib/admin/training";
import { getServiceClient } from "@/lib/supabase/server";
import { AdminBreadcrumb } from "@/components/admin/shared/AdminBreadcrumb";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { CurriculumCard } from "@/components/admin/training/CurriculumCard";
import { CurriculumCreateDialog } from "@/components/admin/training/CurriculumCreateDialog";
import { ModulesTable } from "@/components/admin/training/ModulesTable";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Training — Admin",
  robots: { index: false, follow: false },
};

interface TrainingPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminTrainingPage({
  searchParams,
}: TrainingPageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = sp.tab === "modules" ? "modules" : "curricula";

  const supabase = getServiceClient();

  // Curricula list with module counts + cert stats
  const curricula = await listAllCurricula();
  const curriculaWithStats = await Promise.all(
    curricula.map(async (c) => {
      // Module count + total duration
      const { data: cmRows } = await supabase
        .from("curriculum_modules")
        .select(
          "module:training_modules(video_duration_seconds)",
        )
        .eq("curriculum_id", c.id);
      const moduleCount = cmRows?.length ?? 0;
      let durationSum = 0;
      for (const r of cmRows ?? []) {
        const mod = Array.isArray(r.module) ? r.module[0] : r.module;
        durationSum += mod?.video_duration_seconds ?? 0;
      }
      const stats = await getCurriculumCertStats(c.id);
      return {
        curriculum: c,
        moduleCount,
        totalDurationSeconds: durationSum,
        certStats: stats,
      };
    }),
  );

  const modules = await listAllModules();

  // Devices that don't yet have a curriculum (for the create dialog)
  const usedDeviceIds = new Set(curricula.map((c) => c.device_id));
  const { data: allDevices } = await supabase
    .from("devices")
    .select("id, display_name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  const availableDevices = (allDevices ?? []).filter(
    (d) => !usedDeviceIds.has(d.id),
  );

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-12 md:px-12 md:py-16">
      <AdminBreadcrumb items={[{ label: "Training" }]} />

      <AdminPageHeader
        eyebrow="Admin"
        title="Training."
        lead="Manage training curricula and modules. Each device has one curriculum; certifications gate treatment logging for that device."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CurriculumCreateDialog availableDevices={availableDevices} />
            <Link href="/admin/training/modules/new">
              <Button type="button" variant="secondary" size="sm">
                + New module
              </Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="mt-10 flex items-center gap-1 border-b border-ink-700/10">
        <TabLink href="/admin/training" active={tab === "curricula"}>
          Curricula
        </TabLink>
        <TabLink href="/admin/training?tab=modules" active={tab === "modules"}>
          All modules
        </TabLink>
      </div>

      <div className="mt-8">
        {tab === "curricula" ? (
          curriculaWithStats.length === 0 ? (
            <EmptyCurricula />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {curriculaWithStats.map(
                ({ curriculum, moduleCount, totalDurationSeconds, certStats }) => (
                  <CurriculumCard
                    key={curriculum.id}
                    curriculum={curriculum}
                    moduleCount={moduleCount}
                    totalDurationSeconds={totalDurationSeconds}
                    certStats={certStats}
                  />
                ),
              )}
            </div>
          )
        ) : (
          <ModulesTable modules={modules} />
        )}
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex h-10 items-center px-3 font-body text-small font-medium text-ink-900 border-b-2 border-brand-500 -mb-px"
          : "inline-flex h-10 items-center px-3 font-body text-small font-medium text-ink-500 hover:text-ink-900"
      }
    >
      {children}
    </Link>
  );
}

function EmptyCurricula() {
  return (
    <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-12 text-center">
      <p className="font-body text-ink-700">No curricula yet.</p>
      <p className="mt-2 font-body text-caption text-ink-500">
        Use “New curriculum” to create one for each device. Then attach modules
        from the curriculum detail page.
      </p>
    </div>
  );
}
