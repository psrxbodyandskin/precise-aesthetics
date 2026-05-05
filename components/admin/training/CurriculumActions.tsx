"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { TrainingContentStatus } from "@/lib/schemas/training";

interface CurriculumActionsProps {
  curriculumId: string;
  status: TrainingContentStatus;
}

export function CurriculumActions({
  curriculumId,
  status,
}: CurriculumActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(next: TrainingContentStatus) {
    if (next === status) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/training/curricula/${curriculumId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not update status.");
        return;
      }
      toast.success(
        next === "published"
          ? "Curriculum published."
          : next === "archived"
            ? "Curriculum archived."
            : "Curriculum returned to draft.",
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "published" && (
        <Button
          type="button"
          size="sm"
          onClick={() => setStatus("published")}
          disabled={pending}
        >
          Publish
        </Button>
      )}
      {status === "published" && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setStatus("draft")}
          disabled={pending}
        >
          Unpublish
        </Button>
      )}
      {status !== "archived" && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setStatus("archived")}
          disabled={pending}
        >
          Archive
        </Button>
      )}
    </div>
  );
}
