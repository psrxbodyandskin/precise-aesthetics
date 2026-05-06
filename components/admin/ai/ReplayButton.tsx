"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ReplayButtonProps {
  runId: string;
  onReplayed?: (newRunId: string) => void;
}

export function ReplayButton({ runId, onReplayed }: ReplayButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function replay() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/ai/runs/${runId}/replay`, {
        method: "POST",
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        runId?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Replay failed.");
        return;
      }
      toast.success("Replay complete.");
      if (data.runId) {
        if (onReplayed) onReplayed(data.runId);
        else router.push(`/admin/ai/runs/${data.runId}`);
      }
    });
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={replay} disabled={pending}>
      <RotateCcw className="mr-1 size-3.5" strokeWidth={1.5} aria-hidden="true" />
      {pending ? "Replaying…" : "Replay"}
    </Button>
  );
}
