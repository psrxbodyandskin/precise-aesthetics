import { Award } from "lucide-react";

import type { AdminTrainingCurriculumProgress } from "@/lib/admin/training";
import { cn } from "@/lib/utils";

interface PracticeTrainingProgressPanelProps {
  rows: AdminTrainingCurriculumProgress[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Per-practice training progress — server-rendered, read-only.
// Slots into /admin/practices/[id] alongside the existing
// PracticeCertificationsPanel. Surfaces who's certified, who's
// in progress, who hasn't started.
//
// "Send reminder" hookup is reserved for P10 (notifications).
// Until then, the cell is a static label.
export function PracticeTrainingProgressPanel({
  rows,
}: PracticeTrainingProgressPanelProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-ink-700/15 bg-bone-50 px-5 py-4">
        <p className="font-body text-caption text-ink-500">
          No training curricula available for this practice&apos;s devices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {rows.map(({ curriculum, device, certification, users }) => {
        const isCertified =
          certification?.status === "certified" &&
          (!certification.expires_at ||
            new Date(certification.expires_at).getTime() > Date.now());
        return (
          <div
            key={curriculum.id}
            className="rounded-md border border-ink-700/15 bg-bone-50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/10 px-5 py-4">
              <div>
                <p
                  className="font-body text-overline font-medium uppercase text-ink-500"
                  style={EYEBROW_TRACKING}
                >
                  {device.display_name}
                </p>
                <p className="mt-1 font-body text-small font-medium text-ink-900">
                  {curriculum.title}
                </p>
              </div>

              {isCertified ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand-300/15 px-2.5 py-1 font-body text-[11px] font-medium uppercase text-brand-700 ring-1 ring-inset ring-brand-700/25"
                  style={{ letterSpacing: "0.08em" }}
                >
                  <Award
                    className="size-3"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Practice certified
                </span>
              ) : (
                <span
                  className="inline-flex items-center rounded-full bg-bone-200 px-2.5 py-1 font-body text-[11px] font-medium uppercase text-ink-700"
                  style={{ letterSpacing: "0.08em" }}
                >
                  Not yet certified
                </span>
              )}
            </div>

            {users.length === 0 ? (
              <p className="px-5 py-4 font-body text-caption text-ink-500">
                No authorized users on this practice yet.
              </p>
            ) : (
              <ul className="divide-y divide-ink-700/10">
                {users.map(({ user, required_complete, required_total, status }) => {
                  const percent = required_total
                    ? Math.round((required_complete / required_total) * 100)
                    : 0;
                  return (
                    <li
                      key={user.id}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-body text-small font-medium text-ink-900 truncate",
                            !user.is_active && "text-ink-500 italic",
                          )}
                        >
                          {user.full_name}
                          {!user.is_active && " (inactive)"}
                        </p>
                        {user.role_label && (
                          <p className="font-body text-caption text-ink-500 truncate">
                            {user.role_label}
                          </p>
                        )}
                      </div>

                      <div className="hidden w-44 shrink-0 items-center gap-2 sm:flex">
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
                          {required_complete}/{required_total}
                        </span>
                      </div>

                      <div className="shrink-0">
                        <UserStatusBadge status={status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function UserStatusBadge({
  status,
}: {
  status: "certified" | "complete" | "in_progress" | "not_started";
}) {
  const map: Record<typeof status, { label: string; className: string }> = {
    certified: {
      label: "Certified by",
      className:
        "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
    },
    complete: {
      label: "All complete",
      className:
        "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/25",
    },
    in_progress: {
      label: "In progress",
      className:
        "bg-bone-200 text-ink-700 ring-1 ring-inset ring-ink-700/15",
    },
    not_started: {
      label: "Not started",
      className:
        "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/30",
    },
  };
  const { label, className } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 font-body text-[11px] font-medium uppercase",
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {label}
    </span>
  );
}
