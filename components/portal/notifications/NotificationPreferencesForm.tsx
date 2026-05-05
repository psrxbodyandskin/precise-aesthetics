"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_CATEGORIES,
  CATEGORY_META,
  EMAIL_ELIGIBLE_CATEGORIES,
  isMandatory,
  PRACTICE_CATEGORIES,
  type NotificationCategory,
  type Preferences,
  type CategoryToggle,
} from "@/lib/schemas/notifications";
import { cn } from "@/lib/utils";

interface NotificationPreferencesFormProps {
  variant: "portal" | "admin";
  initialPreferences: Preferences;
  initialQuietHoursStart: string | null;
  initialQuietHoursEnd: string | null;
  initialQuietHoursTimezone: string | null;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Per-category preferences form. Mandatory categories render
// disabled with a lock icon — server-side dispatch ignores
// preferences for those categories regardless of UI state, but
// we mirror that on the client so the user understands.
//
// Saves on every change with a 500ms debounce.
export function NotificationPreferencesForm({
  variant,
  initialPreferences,
  initialQuietHoursStart,
  initialQuietHoursEnd,
  initialQuietHoursTimezone,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences);
  const [quietEnabled, setQuietEnabled] = useState<boolean>(
    Boolean(initialQuietHoursStart && initialQuietHoursEnd),
  );
  const [quietStart, setQuietStart] = useState(
    (initialQuietHoursStart ?? "").slice(0, 5),
  );
  const [quietEnd, setQuietEnd] = useState(
    (initialQuietHoursEnd ?? "").slice(0, 5),
  );
  const [quietTz, setQuietTz] = useState(
    initialQuietHoursTimezone ?? "America/Chicago",
  );

  const categories =
    variant === "portal" ? PRACTICE_CATEGORIES : ADMIN_CATEGORIES;

  const grouped = useMemo(() => {
    const out: Record<string, NotificationCategory[]> = {};
    for (const c of categories) {
      const meta = CATEGORY_META[c];
      const key = meta.group;
      if (!out[key]) out[key] = [];
      out[key]!.push(c);
    }
    return out;
  }, [categories]);

  const path =
    variant === "portal"
      ? "/api/portal/notifications/preferences"
      : "/api/admin/notifications/preferences";

  // Debounced save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  useEffect(() => {
    const payload = {
      preferences: prefs,
      quietHours: {
        enabled: quietEnabled,
        start: quietEnabled ? quietStart : "",
        end: quietEnabled ? quietEnd : "",
        timezone: quietTz,
      },
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: serialized,
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.ok) {
            toast.error(data.error ?? "Could not save preferences.");
            return;
          }
          lastSavedRef.current = serialized;
        })
        .catch(() => {
          toast.error("Could not save preferences.");
        });
    }, 500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [prefs, quietEnabled, quietStart, quietEnd, quietTz, path]);

  function setToggle(
    category: NotificationCategory,
    channel: keyof CategoryToggle,
    value: boolean,
  ) {
    setPrefs((prev) => {
      const current = prev[category] ?? { in_app: true, email: true };
      return {
        ...prev,
        [category]: { ...current, [channel]: value },
      };
    });
  }

  return (
    <div className="space-y-12">
      {/* Render groups in spec order */}
      {(["clinical", "library", "inbox", "operations"] as const).map((group) => {
        const list = grouped[group];
        if (!list || list.length === 0) return null;
        return (
          <section key={group}>
            <h2
              className="font-display text-ink-900"
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                fontWeight: 400,
              }}
            >
              {GROUP_HEADINGS[group]}
            </h2>
            <p
              className="mt-1 font-body text-caption text-ink-500"
              style={{ lineHeight: 1.55 }}
            >
              {GROUP_SUBHEADS[group]}
            </p>

            <div className="mt-5 space-y-3">
              {list.map((category) => {
                const meta = CATEGORY_META[category];
                const mandatory = isMandatory(category);
                const emailEligible = (
                  EMAIL_ELIGIBLE_CATEGORIES as readonly string[]
                ).includes(category);
                const toggle = prefs[category] ?? { in_app: true, email: true };
                return (
                  <div
                    key={category}
                    className={cn(
                      "rounded-md border border-ink-700/15 bg-bone-50 p-4",
                      mandatory && "bg-bone-100",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {mandatory && (
                            <Lock
                              className="size-3.5 text-ink-500"
                              strokeWidth={1.5}
                              aria-label="Mandatory — always on"
                            />
                          )}
                          <p className="font-body text-small font-medium text-ink-900">
                            {meta.label}
                          </p>
                        </div>
                        <p
                          className="mt-1 font-body text-caption text-ink-700"
                          style={{ lineHeight: 1.55 }}
                        >
                          {meta.description}
                        </p>
                        {mandatory && (
                          <p
                            className="mt-2 font-body text-caption italic text-ink-500"
                            style={EYEBROW_TRACKING}
                          >
                            Always on — clinical safety
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:gap-4">
                        <label className="flex items-center gap-2 font-body text-caption text-ink-700">
                          <Checkbox
                            checked={mandatory ? true : toggle.in_app}
                            disabled={mandatory}
                            onCheckedChange={(v) =>
                              setToggle(category, "in_app", Boolean(v))
                            }
                          />
                          In app
                        </label>
                        <label
                          className={cn(
                            "flex items-center gap-2 font-body text-caption",
                            !emailEligible && "text-ink-300",
                            emailEligible && "text-ink-700",
                          )}
                        >
                          <Checkbox
                            checked={
                              !emailEligible
                                ? false
                                : mandatory
                                  ? true
                                  : toggle.email
                            }
                            disabled={mandatory || !emailEligible}
                            onCheckedChange={(v) =>
                              setToggle(category, "email", Boolean(v))
                            }
                          />
                          Email
                          {!emailEligible && (
                            <span className="ml-1 text-[10px] uppercase italic">
                              n/a
                            </span>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Quiet hours */}
      <section>
        <h2
          className="font-display text-ink-900"
          style={{
            fontSize: "1.25rem",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
          }}
        >
          Quiet hours.
        </h2>
        <p
          className="mt-1 font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          Suppress non-mandatory email notifications during this window.
          Critical clinical notifications will still send.
        </p>

        <div className="mt-5 rounded-md border border-ink-700/15 bg-bone-50 p-4">
          <label className="flex items-center gap-3 font-body text-small text-ink-900">
            <Checkbox
              checked={quietEnabled}
              onCheckedChange={(v) => setQuietEnabled(Boolean(v))}
            />
            Pause email notifications during quiet hours
          </label>

          {quietEnabled && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="quiet-start">Start (HH:MM)</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quiet-end">End (HH:MM)</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quiet-tz">Timezone</Label>
                <Input
                  id="quiet-tz"
                  type="text"
                  value={quietTz}
                  onChange={(e) => setQuietTz(e.target.value)}
                  placeholder="America/Chicago"
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const GROUP_HEADINGS: Record<string, string> = {
  clinical: "Clinical updates (mandatory).",
  library: "Library updates.",
  inbox: "Inbox.",
  operations: "Operations.",
};

const GROUP_SUBHEADS: Record<string, string> = {
  clinical:
    "Always on. Mandatory for clinical safety — these can't be muted.",
  library: "Mute or change channel for non-critical content notifications.",
  inbox: "Marketing-site inbound. Mute by category if it's noisy.",
  operations:
    "Practice activity signals. Mute or change channel anytime.",
};
