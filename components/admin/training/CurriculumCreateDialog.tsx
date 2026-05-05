"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeviceOption {
  id: string;
  display_name: string;
}

interface CurriculumCreateDialogProps {
  /** Devices that don't yet have a curriculum (training_curricula has unique(device_id)). */
  availableDevices: DeviceOption[];
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function CurriculumCreateDialog({
  availableDevices,
}: CurriculumCreateDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deviceId, setDeviceId] = useState(availableDevices[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!deviceId || !title.trim()) {
      toast.error("Pick a device and enter a title.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/admin/training/curricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId,
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not create curriculum.");
        return;
      }
      toast.success("Curriculum created.");
      setOpen(false);
      setTitle("");
      setDescription("");
      if (data.id) {
        router.push(`/admin/training/curricula/${data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={availableDevices.length === 0}
        >
          <Plus className="mr-1 size-4" strokeWidth={1.5} aria-hidden="true" />
          New curriculum
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New curriculum</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="device"
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Device
            </label>
            <select
              id="device"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="mt-2 h-11 w-full rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-small text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
              required
            >
              {availableDevices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.display_name}
                </option>
              ))}
            </select>
            <p className="mt-1 font-body text-caption text-ink-500">
              One curriculum per device. Devices already covered are hidden.
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="e.g., Precise Pico™ Training Curriculum"
              className="mt-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="font-body text-overline font-medium uppercase text-ink-500"
              style={EYEBROW_TRACKING}
            >
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create curriculum"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
