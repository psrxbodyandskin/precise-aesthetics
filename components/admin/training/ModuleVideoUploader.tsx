"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Video, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getAuthBrowserClient } from "@/lib/supabase/client-auth";
import { cn } from "@/lib/utils";

interface ModuleVideoUploaderProps {
  moduleId: string;
  initialVideoStoragePath: string | null;
  initialDurationSeconds: number | null;
}

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const MAX_BYTES = 5 * 1024 * 1024 * 1024; // 5 GiB

// Direct-to-Supabase upload (Q1). The Vercel body limit forbids
// proxying multi-GB files, so the admin browser session uploads
// directly via the Supabase JS client (admin's session token,
// bucket RLS verifies is_admin()). Once finished, this component
// POSTs the storage_path + duration to /api/admin/training/modules/[id]/video.
//
// Duration extraction (Q3): a hidden <video> element loads the
// File via object URL and reads .duration once metadata fires.
// Some formats don't expose duration on metadata; the manual-entry
// fallback shows when extraction fails.
export function ModuleVideoUploader({
  moduleId,
  initialVideoStoragePath,
  initialDurationSeconds,
}: ModuleVideoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingDuration, setPendingDuration] = useState<number | null>(null);
  const [needsManualDuration, setNeedsManualDuration] = useState(false);
  const [manualDurationInput, setManualDurationInput] = useState("");

  function pickFile() {
    inputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use MP4, WebM, or MOV.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Video must be 5 GB or smaller.");
      return;
    }
    setPendingFile(file);
    setPendingDuration(null);
    setNeedsManualDuration(false);
    setManualDurationInput("");

    // Extract duration via hidden <video>
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;
    v.muted = true;
    const cleanup = () => URL.revokeObjectURL(url);

    const timeout = setTimeout(() => {
      cleanup();
      setNeedsManualDuration(true);
    }, 5000);

    v.addEventListener(
      "loadedmetadata",
      () => {
        clearTimeout(timeout);
        const seconds = Math.round(v.duration);
        if (Number.isFinite(seconds) && seconds > 0) {
          setPendingDuration(seconds);
        } else {
          setNeedsManualDuration(true);
        }
        cleanup();
      },
      { once: true },
    );
    v.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        setNeedsManualDuration(true);
        cleanup();
      },
      { once: true },
    );
  }

  async function startUpload() {
    if (!pendingFile) return;
    const duration =
      pendingDuration ??
      (manualDurationInput ? Number.parseInt(manualDurationInput, 10) : null);
    if (needsManualDuration && (!duration || duration <= 0)) {
      toast.error("Enter the video duration in seconds.");
      return;
    }

    setBusy(true);
    setProgress(0);

    try {
      const supabase = getAuthBrowserClient();
      const safeName = pendingFile.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const storagePath = `${moduleId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("training-videos")
        .upload(storagePath, pendingFile, {
          contentType: pendingFile.type,
          upsert: false,
        });
      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        setBusy(false);
        return;
      }
      setProgress(100);

      // Save to module row
      const res = await fetch(
        `/api/admin/training/modules/${moduleId}/video`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storagePath,
            durationSeconds: duration,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save video.");
        setBusy(false);
        return;
      }
      toast.success("Video uploaded.");
      setPendingFile(null);
      setPendingDuration(null);
      setNeedsManualDuration(false);
      setManualDurationInput("");
      router.refresh();
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  function clearPending() {
    setPendingFile(null);
    setPendingDuration(null);
    setNeedsManualDuration(false);
    setManualDurationInput("");
  }

  return (
    <div className="space-y-4">
      {initialVideoStoragePath ? (
        <div className="flex items-center gap-3 rounded-md border border-ink-700/15 bg-bone-50 p-4">
          <Video
            className="size-5 shrink-0 text-ink-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="font-body text-small font-medium text-ink-900 truncate">
              Video uploaded
            </p>
            <p
              className="font-body text-caption text-ink-500"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {initialDurationSeconds
                ? `${formatDuration(initialDurationSeconds)} · `
                : ""}
              {initialVideoStoragePath}
            </p>
          </div>
        </div>
      ) : (
        <p className="font-body text-caption text-ink-500">
          No video uploaded yet.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        onChange={onFileSelected}
      />

      {!pendingFile ? (
        <Button
          type="button"
          variant="secondary"
          onClick={pickFile}
          disabled={busy}
        >
          <Upload className="mr-2 size-4" strokeWidth={1.5} aria-hidden="true" />
          {initialVideoStoragePath ? "Replace video" : "Upload video"}
        </Button>
      ) : (
        <div className="rounded-md border border-ink-700/15 bg-bone-50 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-body text-small font-medium text-ink-900 truncate">
                {pendingFile.name}
              </p>
              <p
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {(pendingFile.size / (1024 * 1024)).toFixed(1)} MB
                {pendingDuration ? ` · ${formatDuration(pendingDuration)}` : ""}
              </p>
            </div>
            {!busy && (
              <button
                type="button"
                onClick={clearPending}
                className="rounded-sm p-1 text-ink-500 hover:text-ink-900"
                aria-label="Cancel"
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            )}
          </div>

          {needsManualDuration && !pendingDuration && (
            <div className="space-y-1">
              <label
                htmlFor="manual-duration"
                className="font-body text-caption text-ink-700"
              >
                Duration (seconds) — couldn&apos;t read from file metadata
              </label>
              <input
                id="manual-duration"
                type="number"
                min={1}
                value={manualDurationInput}
                onChange={(e) => setManualDurationInput(e.target.value)}
                className="block w-32 h-9 rounded-sm border border-ink-700/20 bg-white px-2 font-body text-small text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
                placeholder="600"
              />
            </div>
          )}

          {busy && (
            <div className="space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone-200">
                <div
                  className={cn(
                    "h-full bg-brand-500 transition-all duration-300",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p
                className="font-body text-caption text-ink-500"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                Uploading… {progress}%
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={startUpload}
              disabled={busy}
            >
              {busy ? "Uploading…" : "Start upload"}
            </Button>
            {!busy && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={clearPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
