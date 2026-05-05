"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/schemas/training";
import {
  TRAINING_CONTENT_STATUS_LABELS,
  TRAINING_CONTENT_STATUSES,
  type TrainingContentStatus,
} from "@/lib/schemas/training";
import type { TrainingModuleRow } from "@/lib/admin/training";

interface ModuleEditFormProps {
  module: TrainingModuleRow | null; // null when creating
}

const EYEBROW_TRACKING = { letterSpacing: "0.18em" } as const;

export function ModuleEditForm({ module }: ModuleEditFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isCreate = !module;

  const [title, setTitle] = useState(module?.title ?? "");
  const [slug, setSlug] = useState(module?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(module?.slug));
  const [description, setDescription] = useState(module?.description ?? "");
  const [requiredPct, setRequiredPct] = useState(
    module?.required_watch_percentage ?? 90,
  );
  const [status, setStatus] = useState<TrainingContentStatus>(
    module?.status ?? "draft",
  );

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      toast.error("Title and slug required.");
      return;
    }

    startTransition(async () => {
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        requiredWatchPercentage: requiredPct,
        ...(isCreate ? {} : { status }),
      };
      const url = isCreate
        ? "/api/admin/training/modules"
        : `/api/admin/training/modules/${module!.id}`;
      const res = await fetch(url, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save module.");
        return;
      }
      toast.success(isCreate ? "Module created." : "Module saved.");
      if (isCreate && data.id) {
        router.push(`/admin/training/modules/${data.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
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
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={120}
          required
          className="mt-2"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Slug
        </label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          maxLength={80}
          required
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          className="mt-2 font-mono"
        />
        <p className="mt-1 font-body text-caption text-ink-500">
          Lowercase letters, numbers, hyphens. Must be unique across all modules.
        </p>
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

      <div>
        <label
          htmlFor="required-pct"
          className="font-body text-overline font-medium uppercase text-ink-500"
          style={EYEBROW_TRACKING}
        >
          Required watch percentage
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            id="required-pct"
            type="range"
            min={50}
            max={100}
            value={requiredPct}
            onChange={(e) => setRequiredPct(Number.parseInt(e.target.value, 10))}
            className="flex-1"
          />
          <span
            className="w-14 font-body text-small text-ink-900"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {requiredPct}%
          </span>
        </div>
      </div>

      {!isCreate && (
        <div>
          <label
            htmlFor="status"
            className="font-body text-overline font-medium uppercase text-ink-500"
            style={EYEBROW_TRACKING}
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as TrainingContentStatus)
            }
            className="mt-2 h-11 w-full rounded-sm border border-ink-700/20 bg-bone-50 px-3 font-body text-small text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
          >
            {TRAINING_CONTENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TRAINING_CONTENT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isCreate ? "Create module" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
