"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StackEnvVarRow } from "@/lib/admin/stack";
import { ENV_VAR_NAME_RE } from "@/lib/schemas/stack";
import { cn } from "@/lib/utils";

interface StackEnvVarsTableProps {
  serviceId: string;
  envVars: StackEnvVarRow[];
}

export function StackEnvVarsTable({ serviceId, envVars }: StackEnvVarsTableProps) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function remove(varId: string) {
    if (!confirm("Remove this env var entry?")) return;
    setRemovingId(varId);
    startTransition(async () => {
      const res = await fetch(`/api/admin/stack/env-vars/${varId}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not remove.");
      } else {
        toast.success("Removed.");
        router.refresh();
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p
          className="font-body text-caption text-ink-500"
          style={{ letterSpacing: "0.04em" }}
        >
          Names + locations only. Server rejects any payload containing a value
          field.
        </p>
        <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden="true" />
          Add env var
        </Button>
      </div>

      {envVars.length === 0 ? (
        <div className="rounded-md border border-dashed border-ink-700/20 bg-bone-50 px-6 py-8 text-center">
          <p className="font-body text-small text-ink-500">
            No env vars listed for this service yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-ink-700/15 bg-bone-50">
          <table className="w-full font-body text-small">
            <thead>
              <tr className="border-b border-ink-700/10">
                <Th>Name</Th>
                <Th>Description</Th>
                <Th align="center">Vercel</Th>
                <Th align="center">Local env</Th>
                <Th align="center">Secret</Th>
                <Th align="right" />
              </tr>
            </thead>
            <tbody>
              {envVars.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-ink-700/5 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-caption text-ink-900">
                    {v.var_name}
                  </td>
                  <td className="px-4 py-3 text-ink-700">
                    {v.description ?? <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BoolCell value={v.set_in_vercel} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BoolCell value={v.set_in_local_env} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <BoolCell value={v.is_secret} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(v.id)}
                      disabled={removingId === v.id}
                      aria-label={`Remove ${v.var_name}`}
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-sm text-ink-500",
                        "transition-colors hover:bg-bone-100 hover:text-[#8A2C2C]",
                        "outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]",
                        "disabled:opacity-40",
                      )}
                    >
                      <Trash2
                        className="size-3.5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddEnvVarModal
        open={addOpen}
        onOpenChange={setAddOpen}
        serviceId={serviceId}
      />
    </div>
  );
}

function BoolCell({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium uppercase",
        value
          ? "bg-brand-300/15 text-brand-700 ring-1 ring-inset ring-brand-700/20"
          : "bg-bone-200 text-ink-300 ring-1 ring-inset ring-ink-300/20",
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {value ? "Yes" : "No"}
    </span>
  );
}

function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-overline font-medium uppercase text-ink-500",
        align === "center" && "text-center",
        align === "right" && "text-right",
        align === "left" && "text-left",
      )}
      style={{ letterSpacing: "0.18em" }}
    >
      {children}
    </th>
  );
}

function AddEnvVarModal({
  open,
  onOpenChange,
  serviceId,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  serviceId: string;
}) {
  const router = useRouter();
  const [varName, setVarName] = useState("");
  const [description, setDescription] = useState("");
  const [setInVercel, setSetInVercel] = useState(false);
  const [setInLocalEnv, setSetInLocalEnv] = useState(false);
  const [isSecretOverride, setIsSecretOverride] = useState<
    "default" | "secret" | "public"
  >("default");
  const [pending, startTransition] = useTransition();

  function reset() {
    setVarName("");
    setDescription("");
    setSetInVercel(false);
    setSetInLocalEnv(false);
    setIsSecretOverride("default");
  }

  function submit() {
    const trimmed = varName.trim();
    if (!ENV_VAR_NAME_RE.test(trimmed)) {
      toast.error("Name must be uppercase letters, digits, underscores; start with a letter.");
      return;
    }

    const payload: Record<string, unknown> = {
      var_name: trimmed,
      description: description.trim() || null,
      set_in_vercel: setInVercel,
      set_in_local_env: setInLocalEnv,
    };
    if (isSecretOverride !== "default") {
      payload.is_secret = isSecretOverride === "secret";
    }

    startTransition(async () => {
      const res = await fetch(`/api/admin/stack/${serviceId}/env-vars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not add.");
        return;
      }
      toast.success("Env var added.");
      reset();
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add env var</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="ev-name" className="mb-2 block">
              Name <span className="ml-1 text-[#8A2C2C]">*</span>
            </Label>
            <Input
              id="ev-name"
              value={varName}
              onChange={(e) => setVarName(e.target.value.toUpperCase())}
              placeholder="ANTHROPIC_API_KEY"
              autoCapitalize="characters"
              maxLength={200}
              required
              className="font-mono"
            />
            <p
              className="mt-1 font-body text-caption text-ink-500"
              style={{ lineHeight: 1.5 }}
            >
              Uppercase letters, digits, underscores. Names starting with{" "}
              <code className="font-mono text-ink-700">NEXT_PUBLIC_</code> auto-default to non-secret.
            </p>
          </div>
          <div>
            <Label htmlFor="ev-desc" className="mb-2 block">
              Description
            </Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this used for?"
              rows={2}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label className="block">Where is it set?</Label>
            <Checkbox
              checked={setInVercel}
              onChange={setSetInVercel}
              label="Vercel production env"
            />
            <Checkbox
              checked={setInLocalEnv}
              onChange={setSetInLocalEnv}
              label=".env.local"
            />
          </div>
          <div>
            <Label className="mb-2 block">Sensitivity</Label>
            <select
              value={isSecretOverride}
              onChange={(e) =>
                setIsSecretOverride(
                  e.target.value as "default" | "secret" | "public",
                )
              }
              className="w-full rounded-sm border border-ink-700/20 bg-bone-50 px-3 py-2 font-body text-small text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
            >
              <option value="default">Auto (NEXT_PUBLIC_* → public, else secret)</option>
              <option value="secret">Override: secret</option>
              <option value="public">Override: public</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? "Adding…" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-ink-700/30 text-midnight-800 focus:ring-midnight-800"
      />
      <span className="font-body text-small text-ink-700">{label}</span>
    </label>
  );
}
