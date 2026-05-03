"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { PracticeDeviceInput } from "@/lib/schemas/practice";

export interface DeviceOption {
  id: string;
  slug: string;
  displayName: string;
  shortDescription: string | null;
}

interface DevicePickerProps {
  /** Active devices from the catalog. */
  options: DeviceOption[];
  /** Current selection (controlled). */
  value: PracticeDeviceInput[];
  /** Update callback. */
  onChange: (next: PracticeDeviceInput[]) => void;
}

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

// Multi-select device picker with optional serial number + acquired
// date per selection. Used on the provisioning form.
export function DevicePicker({ options, value, onChange }: DevicePickerProps) {
  // Selected ids derived from `value`
  const selectedIds = new Set(value.map((v) => v.deviceId));

  function toggleDevice(id: string) {
    if (selectedIds.has(id)) {
      onChange(value.filter((v) => v.deviceId !== id));
    } else {
      onChange([
        ...value,
        { deviceId: id, serialNumber: "", acquiredAt: "" },
      ]);
    }
  }

  function updateField(
    deviceId: string,
    field: "serialNumber" | "acquiredAt",
    next: string,
  ) {
    onChange(
      value.map((v) =>
        v.deviceId === deviceId ? { ...v, [field]: next } : v,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-caption text-ink-500">
        Select the devices this practice owns. Serial number and
        acquisition date can be added now or filled in later.
      </p>

      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedIds.has(opt.id);
          const entry = value.find((v) => v.deviceId === opt.id);
          return (
            <div
              key={opt.id}
              className={cn(
                "rounded-md border p-4 transition-colors duration-[150ms]",
                isSelected
                  ? "border-ink-700/35 bg-bone-50"
                  : "border-ink-700/15 bg-transparent",
              )}
            >
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleDevice(opt.id)}
                  className="mt-1 border-ink-700/40 data-[state=checked]:border-ink-900 data-[state=checked]:bg-ink-900"
                />
                <div className="flex-1">
                  <p className="font-body text-body font-medium text-ink-900">
                    {opt.displayName}
                  </p>
                  {opt.shortDescription && (
                    <p className="mt-0.5 font-body text-caption text-ink-500">
                      {opt.shortDescription}
                    </p>
                  )}
                </div>
              </label>

              {isSelected && entry && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label
                      htmlFor={`serial-${opt.id}`}
                      className={labelClass}
                    >
                      Serial number
                    </Label>
                    <Input
                      id={`serial-${opt.id}`}
                      type="text"
                      value={entry.serialNumber ?? ""}
                      onChange={(e) =>
                        updateField(opt.id, "serialNumber", e.target.value)
                      }
                      className={cn(inputClass, "mt-2")}
                      suppressHydrationWarning
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`acquired-${opt.id}`}
                      className={labelClass}
                    >
                      Acquired
                    </Label>
                    <Input
                      id={`acquired-${opt.id}`}
                      type="date"
                      value={entry.acquiredAt ?? ""}
                      onChange={(e) =>
                        updateField(opt.id, "acquiredAt", e.target.value)
                      }
                      className={cn(inputClass, "mt-2")}
                      suppressHydrationWarning
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {options.length === 0 && (
          <p className="font-body text-caption text-ink-500">
            No devices in the catalog yet.
          </p>
        )}
      </div>
    </div>
  );
}
