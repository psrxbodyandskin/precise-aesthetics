"use client";

import { useEffect, useState } from "react";

import { TrainingUserPicker } from "./TrainingUserPicker";
import { VideoPlayer } from "./VideoPlayer";
import { ModuleCompletionPanel } from "./ModuleCompletionPanel";
import type { ModuleProgressRow } from "@/lib/portal/training";

interface UserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface ModulePlayerClientProps {
  practiceId: string;
  authorizedUsers: UserOption[];

  videoUrl: string | null;
  moduleId: string;
  /** Progress rows keyed by practice_user_id. Picker picks the
   *  right one client-side (server can't know who's active). */
  progressByUser: Record<string, ModuleProgressRow>;
  durationSeconds: number | null;
  requiredWatchPercentage: number;

  curriculumId: string | null;
  nextModuleId: string | null;
}

const STORAGE_KEY_PREFIX = "pa.training.activeUser";

// Picker holds the active practice_authorized_users.id — drives
// progress saves (every 10s), the acknowledge action, and the
// "have I watched this?" indicator.
export function ModulePlayerClient({
  practiceId,
  authorizedUsers,
  videoUrl,
  moduleId,
  progressByUser,
  durationSeconds,
  requiredWatchPercentage,
  curriculumId,
  nextModuleId,
}: ModulePlayerClientProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}.${practiceId}`;
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(storageKey);
    if (saved && authorizedUsers.some((u) => u.id === saved)) {
      setActiveUserId(saved);
    }
    setHydrated(true);
  }, [storageKey, authorizedUsers]);

  function selectUser(id: string) {
    setActiveUserId(id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, id);
    }
  }

  // Resolve the active user's progress row from the map.
  const userProgress = activeUserId ? progressByUser[activeUserId] ?? null : null;
  const initialWatchPercentage = userProgress?.watch_percentage ?? 0;
  const initialPositionSeconds = userProgress?.last_position_seconds ?? 0;
  const isComplete = Boolean(userProgress?.is_complete);

  // Live watch percentage — VideoPlayer pushes updates so the
  // completion panel reflects in real time without waiting for SSR.
  const [liveWatchPercentage, setLiveWatchPercentage] =
    useState<number>(initialWatchPercentage);

  // When the active user changes, reseed the live watch % to that
  // user's stored progress (otherwise switching users would leak
  // the previous user's progress into the panel).
  useEffect(() => {
    setLiveWatchPercentage(initialWatchPercentage);
  }, [initialWatchPercentage]);

  const watchUnlocked = liveWatchPercentage >= requiredWatchPercentage;

  return (
    <div className="space-y-8">
      {/* Picker */}
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <TrainingUserPicker
          value={activeUserId}
          onChange={selectUser}
          options={authorizedUsers}
          helper="Pick once per session. Stamped on this module's completion record."
        />
      </div>

      {/* Video */}
      {!hydrated ? null : !activeUserId ? (
        <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-8 text-center">
          <p className="font-body text-ink-700">
            Pick who&apos;s training above to start the module.
          </p>
        </div>
      ) : !videoUrl ? (
        <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 p-8 text-center">
          <p className="font-body text-caption text-ink-500">
            Video not yet uploaded.
          </p>
        </div>
      ) : (
        <VideoPlayer
          // Re-mount on user-switch so internal refs reset.
          key={activeUserId}
          videoUrl={videoUrl}
          moduleId={moduleId}
          practiceUserId={activeUserId}
          initialPositionSeconds={initialPositionSeconds}
          initialWatchPercentage={initialWatchPercentage}
          durationSeconds={durationSeconds}
          requiredWatchPercentage={requiredWatchPercentage}
          onWatchComplete={() => {}}
          onProgressUpdate={(pct) => setLiveWatchPercentage(pct)}
        />
      )}

      <ModuleCompletionPanel
        moduleId={moduleId}
        practiceUserId={activeUserId || null}
        watchPercentage={liveWatchPercentage}
        requiredWatchPercentage={requiredWatchPercentage}
        isComplete={isComplete}
        watchUnlocked={watchUnlocked}
        curriculumId={curriculumId}
        nextModuleId={nextModuleId}
      />
    </div>
  );
}
