"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import type { TrainingModuleRow } from "@/lib/admin/training";

interface AddModulePickerProps {
  curriculumId: string;
  attachedModuleIds: string[];
}

export function AddModulePicker({
  curriculumId,
  attachedModuleIds,
}: AddModulePickerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<TrainingModuleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [isRequired, setIsRequired] = useState(true);

  useEffect(() => {
    if (!open || modules.length > 0) return;
    setLoading(true);
    fetch("/api/admin/training/modules")
      .then((r) => r.json())
      .then((data: { ok: boolean; modules: TrainingModuleRow[] }) => {
        setModules(data.modules ?? []);
      })
      .catch(() => toast.error("Could not load modules."))
      .finally(() => setLoading(false));
  }, [open, modules.length]);

  const available = modules.filter(
    (m) => !attachedModuleIds.includes(m.id),
  );

  function attach(moduleId: string) {
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/training/curricula/${curriculumId}/modules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moduleId, isRequired }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not attach.");
        return;
      }
      toast.success("Module added.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Plus className="mr-1 size-4" strokeWidth={1.5} aria-hidden="true" />
          Add module
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Attach a module</DialogTitle>
        </DialogHeader>

        <label className="mb-3 flex items-center gap-2 font-body text-small text-ink-700">
          <Checkbox
            checked={isRequired}
            onCheckedChange={(v) => setIsRequired(Boolean(v))}
          />
          Required for certification
        </label>

        <Command>
          <CommandInput placeholder="Search modules…" />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading…" : "No modules available."}
            </CommandEmpty>
            {available.map((m) => (
              <CommandItem
                key={m.id}
                value={`${m.title} ${m.slug}`}
                onSelect={() => !pending && attach(m.id)}
                disabled={pending}
              >
                <span className="flex-1 truncate">{m.title}</span>
                <span className="ml-2 font-mono text-caption text-ink-500">
                  /{m.slug}
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
