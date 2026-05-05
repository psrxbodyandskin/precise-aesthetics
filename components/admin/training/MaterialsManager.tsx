"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthBrowserClient } from "@/lib/supabase/client-auth";
import type { ModuleMaterialRow } from "@/lib/admin/training";

interface MaterialsManagerProps {
  moduleId: string;
  materials: ModuleMaterialRow[];
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/zip",
];
const MAX_BYTES = 100 * 1024 * 1024; // 100 MiB

export function MaterialsManager({
  moduleId,
  materials,
}: MaterialsManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  function pickFile() {
    if (!titleDraft.trim()) {
      toast.error("Title required.");
      return;
    }
    inputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Use PDF, PNG, JPG, or ZIP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File must be 100 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const supabase = getAuthBrowserClient();
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const storagePath = `${moduleId}/${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("training-materials")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }

      const res = await fetch(
        `/api/admin/training/modules/${moduleId}/materials`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: titleDraft.trim(),
            storagePath,
            filename: file.name,
            mimeType: file.type,
            byteSize: file.size,
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not save material.");
        return;
      }
      toast.success("Material added.");
      setTitleDraft("");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function removeMaterial(materialId: string) {
    if (!confirm("Remove this material?")) return;
    const res = await fetch(
      `/api/admin/training/modules/${moduleId}/materials/${materialId}`,
      { method: "DELETE" },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      toast.error(data.error ?? "Could not delete.");
      return;
    }
    toast.success("Material removed.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {materials.length === 0 ? (
        <p className="font-body text-caption text-ink-500">No materials yet.</p>
      ) : (
        <ul className="space-y-2">
          {materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-3 rounded-md border border-ink-700/15 bg-bone-50 px-3 py-2.5"
            >
              <FileText
                className="size-4 shrink-0 text-ink-700"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <p className="font-body text-small font-medium text-ink-900 truncate">
                  {m.title}
                </p>
                <p className="font-body text-caption text-ink-500 truncate">
                  {m.filename} · {(m.byte_size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeMaterial(m.id)}
                className="rounded-sm p-1.5 text-ink-500 hover:text-ink-900"
                aria-label="Remove"
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label
            htmlFor="material-title"
            className="font-body text-caption text-ink-700"
          >
            Material title
          </label>
          <Input
            id="material-title"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="e.g., Treatment parameter sheet"
            disabled={uploading}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={pickFile}
          disabled={uploading || !titleDraft.trim()}
        >
          <Upload className="mr-2 size-4" strokeWidth={1.5} aria-hidden="true" />
          {uploading ? "Uploading…" : "Upload file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="sr-only"
          onChange={onFileSelected}
        />
      </div>
    </div>
  );
}
