"use client";

import { useEffect, useMemo, useState } from "react";

import { TrainingUserPicker } from "./TrainingUserPicker";
import { ModulesProgressList } from "./ModulesProgressList";
import { TeamProgressCard } from "./TeamProgressCard";
import type { PortalCurriculumDetail } from "@/lib/portal/training";

interface UserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface CurriculumModulesClientProps {
  detail: PortalCurriculumDetail;
  practiceId: string;
  authorizedUsers: UserOption[];
}

const STORAGE_KEY_PREFIX = "pa.training.activeUser";

export function CurriculumModulesClient({
  detail,
  practiceId,
  authorizedUsers,
}: CurriculumModulesClientProps) {
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

  // Per-user progress for the header bar — counts the active user's
  // completed required modules.
  const { completed, total, percent } = useMemo(() => {
    const required = detail.modules.filter((m) => m.is_required);
    const completedCount = activeUserId
      ? required.filter((m) => m.progressByUser[activeUserId]?.is_complete)
          .length
      : 0;
    return {
      completed: completedCount,
      total: required.length,
      percent: required.length
        ? Math.round((completedCount / required.length) * 100)
        : 0,
    };
  }, [detail.modules, activeUserId]);

  const activeUserName = authorizedUsers.find((u) => u.id === activeUserId)
    ?.full_name;

  return (
    <div className="space-y-10">
      {/* Picker */}
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <TrainingUserPicker
          value={activeUserId}
          onChange={selectUser}
          options={authorizedUsers}
          helper="Pick once per session. Stamped on completed modules and the certificate."
        />

        {/* Per-user progress under the picker — follows selection */}
        {activeUserId && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between font-body text-caption text-ink-500">
              <span>
                {activeUserName
                  ? `${activeUserName}'s progress`
                  : "Your progress"}
              </span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>
                {completed} of {total} required modules
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
              <div
                className="h-full bg-brand-500 transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modules list (per-user state) */}
      <ModulesProgressList
        detail={detail}
        practiceUserId={activeUserId || null}
      />

      {/* Team-wide progress (always visible) */}
      <TeamProgressCard
        modules={detail.modules}
        authorizedUsers={authorizedUsers}
        activeUserId={activeUserId}
        onSelectUser={selectUser}
      />
    </div>
  );
}
