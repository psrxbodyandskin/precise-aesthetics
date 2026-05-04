"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PHOTO_CAPTURE_PHASES,
  PHOTO_CAPTURE_PHASE_LABELS,
  type PhotoCapturePhase,
} from "@/lib/schemas/treatment";
import { processPhotoForUpload } from "@/lib/portal/photos";
import { cn } from "@/lib/utils";

export interface PreparedPhoto {
  id: string; // local-only stable id for keying
  file: File; // post-strip JPEG ready for upload
  previewUrl: string;
  capturePhase?: PhotoCapturePhase;
  caption?: string;
}

interface PhotoUploaderProps {
  value: PreparedPhoto[];
  onChange: (photos: PreparedPhoto[]) => void;
  consentAffirmed: boolean;
  onConsentChange: (next: boolean) => void;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15MB pre-strip; canvas re-encode usually shrinks

// Drag-drop photo uploader. Strips ALL metadata client-side (canvas
// re-encode + heic2any for HEIC). Practitioner picks a capture phase
// per photo and an optional caption. Patient consent is a single
// checkbox required before submission when any photo is attached.
export function PhotoUploader({
  value,
  onChange,
  consentAffirmed,
  onConsentChange,
}: PhotoUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processingCount, setProcessingCount] = useState(0);

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => {
      value.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setProcessingCount((c) => c + arr.length);

    const processed: PreparedPhoto[] = [];
    for (const file of arr) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`"${file.name}" is over 15MB. Skipping.`);
        continue;
      }
      try {
        const result = await processPhotoForUpload(file);
        processed.push({
          id: crypto.randomUUID(),
          file: result.file,
          previewUrl: result.preview,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not process photo";
        toast.error(`"${file.name}": ${msg}`);
      }
    }
    setProcessingCount((c) => Math.max(0, c - arr.length));
    if (processed.length > 0) {
      onChange([...value, ...processed]);
    }
  }

  function updatePhoto(id: string, patch: Partial<PreparedPhoto>) {
    onChange(value.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removePhoto(id: string) {
    const target = value.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-5">
      <p className="font-body text-caption text-ink-500" style={{ lineHeight: 1.55 }}>
        Optional. Photos help track progress and contribute to outcome
        pattern recognition. Patient consent must be affirmed before
        upload. EXIF and other metadata are stripped automatically.
      </p>

      {/* Drop zone */}
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors duration-[150ms] outline-none focus-within:[box-shadow:var(--pa-focus-ring)]",
          isDragging
            ? "border-brand-500/60 bg-brand-300/10"
            : "border-ink-700/20 bg-bone-50 hover:border-ink-700/35",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus
          className="size-6 text-ink-500"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <p className="font-body text-small font-medium text-ink-900">
          Drop photos here or click to upload
        </p>
        <p className="font-body text-caption text-ink-500">
          JPG, PNG, HEIC. Up to 15MB per file.
        </p>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </label>

      {processingCount > 0 && (
        <p
          aria-live="polite"
          className="inline-flex items-center gap-2 font-body text-caption text-ink-500"
        >
          <Loader2 className="size-3.5 animate-spin" strokeWidth={1.5} aria-hidden="true" />
          Processing {processingCount} photo{processingCount === 1 ? "" : "s"}…
        </p>
      )}

      {/* Photo list */}
      {value.length > 0 && (
        <ul className="space-y-3">
          {value.map((p) => (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-md border border-ink-700/15 bg-bone-50 p-3 sm:flex-row sm:items-start"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.previewUrl}
                alt=""
                className="h-20 w-20 flex-shrink-0 rounded-sm object-cover"
              />
              <div className="flex-1 space-y-2">
                <p
                  className="font-body text-small text-ink-900 truncate"
                  title={p.file.name}
                >
                  {p.file.name}
                </p>
                <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                  <Select
                    value={p.capturePhase ?? ""}
                    onValueChange={(v) =>
                      updatePhoto(p.id, {
                        capturePhase: v as PhotoCapturePhase,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 bg-bone-50 border-ink-700/35">
                      <SelectValue placeholder="Phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHOTO_CAPTURE_PHASES.map((ph) => (
                        <SelectItem key={ph} value={ph}>
                          {PHOTO_CAPTURE_PHASE_LABELS[ph]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="text"
                    placeholder="Caption (optional)"
                    value={p.caption ?? ""}
                    onChange={(e) => updatePhoto(p.id, { caption: e.target.value })}
                    className="h-9 bg-bone-50 border-ink-700/35"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                aria-label={`Remove ${p.file.name}`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-sm text-ink-500 transition-colors duration-[150ms] hover:text-ink-900 outline-none focus-visible:[box-shadow:var(--pa-focus-ring)]"
              >
                <X className="size-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Consent — required if any photos */}
      {value.length > 0 && (
        <div className="rounded-md border border-ink-700/15 bg-bone-100 p-4">
          <Label
            htmlFor={`${inputId}-consent`}
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id={`${inputId}-consent`}
              type="checkbox"
              checked={consentAffirmed}
              onChange={(e) => onConsentChange(e.target.checked)}
              className="mt-0.5 size-4 rounded-sm border-ink-700/35 text-brand-500 focus-visible:[box-shadow:var(--pa-focus-ring)]"
            />
            <span className="font-body text-small text-ink-700" style={{ lineHeight: 1.55 }}>
              I confirm I have obtained patient consent for clinical photos.
            </span>
          </Label>
        </div>
      )}
    </div>
  );
}
