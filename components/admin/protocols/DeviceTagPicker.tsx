"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DeviceOption {
  id: string;
  displayName: string;
  shortDescription: string | null;
}

interface DeviceTagPickerProps {
  protocolId: string;
  allDevices: DeviceOption[];
  initialTaggedDeviceIds: string[];
}

export function DeviceTagPicker({
  protocolId,
  allDevices,
  initialTaggedDeviceIds,
}: DeviceTagPickerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialTaggedDeviceIds),
  );
  const [savedSet, setSavedSet] = useState<Set<string>>(
    () => new Set(initialTaggedDeviceIds),
  );

  const isDirty = !setsEqual(selected, savedSet);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function save() {
    const payload = { deviceIds: Array.from(selected) };
    startTransition(async () => {
      const res = await fetch(`/api/admin/protocols/${protocolId}/devices`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save device tags.");
        return;
      }
      setSavedSet(new Set(selected));
      toast.success(
        `Saved. ${selected.size} device${selected.size === 1 ? "" : "s"} tagged.`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {selected.size === 0 && (
        <div
          role="alert"
          className="rounded-md border border-[#A8801F]/40 bg-[#FFF6D6] px-4 py-3"
        >
          <p
            className="font-body text-overline font-medium uppercase text-[#7A5A00]"
            style={{ letterSpacing: "0.18em" }}
          >
            § No devices tagged
          </p>
          <p className="mt-1 font-body text-caption text-[#5A4500]">
            Practitioners can&rsquo;t see this protocol until at least one
            device is tagged. Add one below.
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {allDevices.map((d) => {
          const active = selected.has(d.id);
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => toggle(d.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border px-4 py-3 text-left transition-colors duration-[150ms] outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
                  active
                    ? "border-brand-500/40 bg-brand-300/10"
                    : "border-ink-700/15 bg-bone-50 hover:border-ink-700/30",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-sm border",
                    active
                      ? "border-brand-500 bg-brand-500 text-cream-50"
                      : "border-ink-700/30 bg-bone-50",
                  )}
                  aria-hidden="true"
                >
                  {active && <Check className="size-3.5" strokeWidth={2} />}
                </span>
                <span className="flex-1">
                  <span className="block font-body text-small font-medium text-ink-900">
                    {d.displayName}
                  </span>
                  {d.shortDescription && (
                    <span className="mt-1 block font-body text-caption text-ink-500">
                      {d.shortDescription}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
        {allDevices.length === 0 && (
          <li className="rounded-md border border-ink-700/15 bg-bone-50 p-6 text-center">
            <p className="font-body text-caption text-ink-500">
              No devices in catalog yet. Add devices via SQL until the
              admin device editor ships.
            </p>
          </li>
        )}
      </ul>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={pending}
          disabled={!isDirty || pending}
          onClick={save}
          suppressHydrationWarning
        >
          {pending ? "Saving" : "Save tags"}
        </Button>
        {isDirty && (
          <span
            className="inline-flex items-center gap-1.5 font-body text-caption text-ink-500"
            aria-live="polite"
          >
            <Plus className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
