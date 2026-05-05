"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface UserOption {
  id: string;
  full_name: string;
  role_label: string | null;
}

interface TrainingUserPickerProps {
  value: string;
  onChange: (id: string) => void;
  options: UserOption[];
  /** Visible label above the picker. Default: "Who is training?". */
  label?: string;
  /** Helper text below the picker. */
  helper?: string;
  required?: boolean;
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

// Session-scoped picker — the practitioner identifies which authorized
// user is doing this training session. Selection persists in
// localStorage (keyed in the parent wrapper) so they pick once per
// device, not once per module.
//
// Mirrors P6's "Entered by" Select on the treatment-logging form so
// the chair-side experience is consistent across logging and
// training. Required for any write (progress saves, acknowledge,
// certify) since module_progress is keyed on (practice_id,
// practice_user_id, module_id) and certified_by_user_id is stamped
// on the certificate.
export function TrainingUserPicker({
  value,
  onChange,
  options,
  label = "Who is training?",
  helper,
  required = true,
}: TrainingUserPickerProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor="training-user"
        className="font-body text-overline font-medium uppercase text-ink-500"
        style={EYEBROW_TRACKING}
      >
        {label}
        {required && <span className="ml-1 text-[#8A2C2C]">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id="training-user"
          className="h-11 w-full rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-small text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          suppressHydrationWarning
        >
          <SelectValue placeholder="Choose a user" />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && (
            <SelectItem value="__none__" disabled>
              No authorized users on this practice
            </SelectItem>
          )}
          {options.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.full_name}
              {u.role_label ? ` — ${u.role_label}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helper && (
        <p
          className="font-body text-caption text-ink-500"
          style={{ lineHeight: 1.55 }}
        >
          {helper}
        </p>
      )}
    </div>
  );
}
