"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SUGGESTED_ROLE_CHIPS } from "@/lib/schemas/setup-wizard";
import { setAuthorizedUsersAction } from "@/app/(portal)/portal/setup/actions";

const labelClass = "text-small font-medium text-ink-900";
const inputClass =
  "h-11 bg-bone-50 border-ink-700/35 text-ink-900 placeholder:text-ink-500";

interface AuthorizedUsersEditorProps {
  initial: Array<{ fullName: string; roleLabel: string | null }>;
}

interface RowState {
  key: string;
  fullName: string;
  roleLabel: string;
}

let rowKeySeq = 0;
const nextRowKey = () => `row-${++rowKeySeq}`;

export function AuthorizedUsersEditor({ initial }: AuthorizedUsersEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<RowState[]>(() =>
    initial.length > 0
      ? initial.map((u) => ({
          key: nextRowKey(),
          fullName: u.fullName,
          roleLabel: u.roleLabel ?? "",
        }))
      : [{ key: nextRowKey(), fullName: "", roleLabel: "" }],
  );

  function addRow() {
    setRows((r) => [...r, { key: nextRowKey(), fullName: "", roleLabel: "" }]);
  }

  function removeRow(key: string) {
    setRows((r) => (r.length === 1 ? r : r.filter((x) => x.key !== key)));
  }

  function updateRow(key: string, field: "fullName" | "roleLabel", value: string) {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [field]: value } : x)));
  }

  function applyChip(key: string, chip: string) {
    updateRow(key, "roleLabel", chip);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    rows.forEach((row, idx) => {
      fd.append(`users[${idx}].fullName`, row.fullName);
      fd.append(`users[${idx}].roleLabel`, row.roleLabel);
    });
    startTransition(async () => {
      const result = await setAuthorizedUsersAction(fd);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      if (result.redirectTo) router.push(result.redirectTo);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <p
        className="font-body text-small text-ink-700"
        style={{ lineHeight: 1.6 }}
      >
        Add anyone at your practice who will enter treatment data. You
        can add or remove users later from settings.
      </p>

      <ul className="space-y-6">
        {rows.map((row, idx) => (
          <li
            key={row.key}
            className="border-l border-ink-700/15 pl-5"
          >
            <div className="flex items-baseline justify-between">
              <p
                className="font-body text-overline font-medium uppercase text-ink-500"
                style={{ letterSpacing: "0.18em" }}
              >
                {String(idx + 1).padStart(2, "0")}
              </p>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Remove this user"
                  className="flex items-center gap-1 text-caption text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
                >
                  <X className="size-3.5" strokeWidth={1.5} aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${row.key}-name`} className={labelClass}>
                  Full name
                </Label>
                <Input
                  id={`${row.key}-name`}
                  type="text"
                  autoComplete="off"
                  value={row.fullName}
                  onChange={(e) => updateRow(row.key, "fullName", e.target.value)}
                  className={cn(inputClass, "mt-2")}
                  suppressHydrationWarning
                />
              </div>
              <div>
                <Label htmlFor={`${row.key}-role`} className={labelClass}>
                  Role <span className="text-ink-500">(optional)</span>
                </Label>
                <Input
                  id={`${row.key}-role`}
                  type="text"
                  autoComplete="off"
                  placeholder="Practitioner, RN, MA…"
                  value={row.roleLabel}
                  onChange={(e) => updateRow(row.key, "roleLabel", e.target.value)}
                  className={cn(inputClass, "mt-2")}
                  suppressHydrationWarning
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SUGGESTED_ROLE_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => applyChip(row.key, chip)}
                      className="rounded-sm border border-ink-700/20 bg-bone-50 px-2 py-0.5 text-caption text-ink-700 transition-colors duration-[150ms] hover:border-brand-500/50 hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 text-small text-brand-700 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)] rounded-sm"
      >
        <Plus className="size-4" strokeWidth={1.5} aria-hidden="true" />
        Add another
      </button>

      <div className="border-t border-ink-700/10 pt-6">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="w-full sm:w-auto"
          suppressHydrationWarning
        >
          {pending ? "Saving" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}
