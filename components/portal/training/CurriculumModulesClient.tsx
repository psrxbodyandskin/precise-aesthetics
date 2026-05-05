"use client";

import { useEffect, useState } from "react";

import { TrainingUserPicker } from "./TrainingUserPicker";
import { ModulesProgressList } from "./ModulesProgressList";
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

// Session-scoped picker → drives the certify button in
// ModulesProgressList. Selection persists in localStorage keyed on
// practice_id so different practices don't collide on the same
// browser. The picker also surfaces on /portal/training/modules/[id]
// so progress saves can attribute correctly.
export function CurriculumModulesClient({
  detail,
  practiceId,
  authorizedUsers,
}: CurriculumModulesClientProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}.${practiceId}`;
  const [activeUserId, setActiveUserId] = useState<string>("");

  // Hydrate from localStorage on mount
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

  return (
    <div className="space-y-10">
      <div className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
        <TrainingUserPicker
          value={activeUserId}
          onChange={selectUser}
          options={authorizedUsers}
          helper="Pick once per session. Stamped on completed modules and the certificate."
        />
      </div>
      <ModulesProgressList
        detail={detail}
        practiceUserId={activeUserId || null}
      />
    </div>
  );
}
