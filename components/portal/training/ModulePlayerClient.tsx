"use client";

import { useEffect, useState } from "react";

import { TrainingUserPicker } from "./TrainingUserPicker";
import { VideoPlayer } from "./VideoPlayer";
import { ModuleCompletionPanel } from "./ModuleCompletionPanel";

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
  initialPositionSeconds: number;
  initialWatchPercentage: number;
  durationSeconds: number | null;
  requiredWatchPercentage: number;
  isComplete: boolean;

  // Post-completion navigation
  curriculumId: string | null;
  nextModuleId: string | null;
}

const STORAGE_KEY_PREFIX = "pa.training.activeUser";

// Picker holds the active practice_authorized_users.id — drives
// progress saves (every 10s) and the acknowledgment/complete action.
// Without a selection, the video doesn't render (progress save would
// 400 with "practiceUserId required"); a clear callout asks the user
// to identify themselves first.
export function ModulePlayerClient({
  practiceId,
  authorizedUsers,
  videoUrl,
  moduleId,
  initialPositionSeconds,
  initialWatchPercentage,
  durationSeconds,
  requiredWatchPercentage,
  isComplete,
  curriculumId,
  nextModuleId,
}: ModulePlayerClientProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}.${practiceId}`;
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  // Live watch percentage — updated by VideoPlayer's onProgressUpdate
  // so the completion panel reflects progress in real time without
  // waiting for a server round-trip.
  const [liveWatchPercentage, setLiveWatchPercentage] = useState<number>(
    initialWatchPercentage,
  );

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

      {/* Video — only render once we know who's watching, otherwise
          progress saves can't attribute and we get a noisy 400 loop. */}
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

      {/* Completion panel — only operable once a user is picked */}
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
