"use client";

import { useEffect, useMemo, useState } from "react";

import { TrainingUserPicker } from "./TrainingUserPicker";
import { CurriculumOverviewCard } from "./CurriculumOverviewCard";
import type { PortalCurriculumOverview } from "@/lib/portal/training";

interface UserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface CurriculaOverviewClientProps {
  practiceId: string;
  authorizedUsers: UserOption[];
  overviews: PortalCurriculumOverview[];
}

const STORAGE_KEY_PREFIX = "pa.training.activeUser";

// Wraps the /portal/training overview cards in a picker — the
// active user drives "your progress" + "your cert state" on each
// card. Persists in localStorage keyed on practice_id, so the
// selection carries across to the curriculum + module pages.
export function CurriculaOverviewClient({
  practiceId,
  authorizedUsers,
  overviews,
}: CurriculaOverviewClientProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}.${practiceId}`;
  const [activeUserId, setActiveUserId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && authorizedUsers.some((u) => u.id === saved)) {
      setActiveUserId(saved);
    }
  }, [storageKey, authorizedUsers]);

  function selectUser(id: string) {
    setActiveUserId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, id);
    }
  }

  // Build per-overview view models for the active user.
  const cards = useMemo(() => {
    return overviews.map((o) => {
      const requiredModules = o.modules.filter((m) => m.is_required);
      const totalDurationSeconds = o.modules.reduce(
        (sum, m) => sum + (m.video_duration_seconds ?? 0),
        0,
      );

      let modulesCompleted = 0;
      if (activeUserId) {
        for (const m of requiredModules) {
          if (o.progressByModuleAndUser[m.id]?.[activeUserId]?.is_complete) {
            modulesCompleted++;
          }
        }
      }

      const certification = activeUserId
        ? (o.certificationsByUser[activeUserId] ?? null)
        : null;

      return {
        device_id: o.device_id,
        device_display_name: o.device_display_name,
        device_slug: o.device_slug,
        curriculum: o.curriculum,
        certification,
        module_count: o.modules.length,
        total_duration_seconds: totalDurationSeconds,
        modules_completed: modulesCompleted,
        modules_required: requiredModules.length,
      };
    });
  }, [overviews, activeUserId]);

  return (
    <div className="space-y-8">
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <TrainingUserPicker
          value={activeUserId}
          onChange={selectUser}
          options={authorizedUsers}
          helper="Pick once per session. Drives your progress + cert state on every card below."
        />
      </div>

      {cards.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-10 text-center">
          <p className="font-body text-ink-700">
            No devices on file for your practice.
          </p>
          <p className="mt-2 font-body text-caption text-ink-500">
            Contact us to get a device provisioned. Training will appear here
            once your device is active.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => (
            <CurriculumOverviewCard
              key={card.device_id}
              overview={card}
              practiceUserId={activeUserId || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
