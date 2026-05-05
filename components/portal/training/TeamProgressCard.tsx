"use client";

import { Award } from "lucide-react";

import type {
  ModuleProgressRow,
  PortalCurriculumDetail,
} from "@/lib/portal/training";
import { cn } from "@/lib/utils";

interface UserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface TeamProgressCardProps {
  modules: PortalCurriculumDetail["modules"];
  authorizedUsers: UserOption[];
  activeUserId: string;
  onSelectUser: (id: string) => void;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// "Team progress" — practice-owner view of who's done what within
// this curriculum. Each row clickable to switch the picker to that
// user, so the practice owner can see exactly where someone got
// stuck.
export function TeamProgressCard({
  modules,
  authorizedUsers,
  activeUserId,
  onSelectUser,
}: TeamProgressCardProps) {
  if (authorizedUsers.length === 0) return null;

  const requiredModules = modules.filter((m) => m.is_required);
  const requiredCount = requiredModules.length;

  // Per-user completion count over required modules.
  const stats = authorizedUsers.map((user) => {
    let completed = 0;
    let inProgress = 0;
    for (const m of requiredModules) {
      const p: ModuleProgressRow | undefined = m.progressByUser[user.id];
      if (p?.is_complete) completed++;
      else if (p && p.watch_percentage > 0) inProgress++;
    }
    const percent = requiredCount
      ? Math.round((completed / requiredCount) * 100)
      : 0;
    let status: "certified" | "in_progress" | "not_started" | "complete";
    if (completed === requiredCount && requiredCount > 0) status = "complete";
    else if (completed > 0 || inProgress > 0) status = "in_progress";
    else status = "not_started";
    return { user, completed, percent, status };
  });

  return (
    <section className="rounded-md border border-ink-700/15 bg-bone-50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Team progress
        </p>
        <p className="font-body text-caption text-ink-500">
          Tap a row to view that user&apos;s progress
        </p>
      </div>

      <ul className="mt-4 divide-y divide-ink-700/10">
        {stats.map(({ user, completed, percent, status }) => {
          const active = user.id === activeUserId;
          return (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelectUser(user.id)}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm transition-colors duration-[150ms]",
                  active && "bg-brand-300/10",
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-body text-small font-medium text-ink-900 truncate">
                    {user.full_name}
                    {active && (
                      <span
                        className="ml-2 font-body text-[10px] uppercase text-brand-700"
                        style={EYEBROW_TRACKING}
                      >
                        Viewing
                      </span>
                    )}
                  </p>
                  {user.role_label && (
                    <p className="font-body text-caption text-ink-500 truncate">
                      {user.role_label}
                    </p>
                  )}
                </div>

                {/* Progress meter */}
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bone-200">
                    <div
                      className="h-full bg-brand-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span
                    className="w-12 shrink-0 text-right font-body text-caption text-ink-700"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {completed}/{requiredCount}
                  </span>
                </div>

                {/* Status badge */}
                <div className="hidden shrink-0 sm:block">
                  {status === "complete" && (
                    <span
                      className="inline-flex items-center gap-1 font-body text-[10px] font-medium uppercase text-brand-700"
                      style={EYEBROW_TRACKING}
                    >
                      <Award
                        className="size-3"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      All done
                    </span>
                  )}
                  {status === "in_progress" && (
                    <span
                      className="font-body text-[10px] font-medium uppercase text-ink-700"
                      style={EYEBROW_TRACKING}
                    >
                      In progress
                    </span>
                  )}
                  {status === "not_started" && (
                    <span
                      className="font-body text-[10px] font-medium uppercase text-ink-300"
                      style={EYEBROW_TRACKING}
                    >
                      Not started
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
