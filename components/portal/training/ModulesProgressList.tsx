"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ModuleRow } from "./ModuleRow";
import type { PortalCurriculumDetail } from "@/lib/portal/training";

interface ModulesProgressListProps {
  detail: PortalCurriculumDetail;
  practiceUserId: string | null;
}

export function ModulesProgressList({
  detail,
  practiceUserId,
}: ModulesProgressListProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const requiredModules = detail.modules.filter((m) => m.is_required);
  const optionalModules = detail.modules.filter((m) => !m.is_required);

  // Resolve the active user's progress on each module from the
  // per-user map. Falls back to null while picker is unselected.
  const progressFor = (m: (typeof detail.modules)[number]) =>
    practiceUserId ? (m.progressByUser[practiceUserId] ?? null) : null;

  // P9.1 — cert button gates on the ACTIVE user's own completion
  // (matches the server-side certifyCurriculum gate). Picker user
  // must personally have every required module marked complete.
  const allRequiredCompleteForUser =
    practiceUserId !== null &&
    requiredModules.length > 0 &&
    requiredModules.every(
      (m) => m.progressByUser[practiceUserId]?.is_complete === true,
    );

  // Per-user certification lookup
  const userCert = practiceUserId
    ? (detail.certificationsByUser[practiceUserId] ?? null)
    : null;
  const isCertified =
    userCert?.status === "certified" &&
    (!userCert.expires_at ||
      new Date(userCert.expires_at).getTime() > Date.now());

  function certify() {
    if (!practiceUserId) {
      toast.error("Pick who's certifying above to finalize.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(
        `/api/portal/training/curricula/${detail.curriculum.id}/certify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certifiedByUserId: practiceUserId }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not complete certification.");
        return;
      }
      toast.success("Certification complete.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Certification CTA — surfaces only when all required modules done
          and not yet certified (or recert needed) */}
      {allRequiredCompleteForUser && !isCertified && (
        <div className="rounded-md border border-brand-500/40 bg-brand-300/10 p-5">
          <div className="flex items-start gap-3">
            <Award
              className="size-5 shrink-0 text-brand-700"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className="font-body text-small font-medium text-ink-900">
                All required modules complete.
              </p>
              <p
                className="mt-1 font-body text-caption text-ink-700"
                style={{ lineHeight: 1.55 }}
              >
                Complete certification to unlock treatment logging for this
                device.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={certify}
              disabled={pending || !practiceUserId}
            >
              {pending ? "Certifying…" : "Complete certification"}
            </Button>
          </div>
        </div>
      )}

      {/* Required modules */}
      {requiredModules.length > 0 && (
        <section>
          <h2
            className="mb-4 font-display text-ink-900"
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              fontWeight: 400,
            }}
          >
            Required modules.
          </h2>
          <ul className="space-y-2">
            {requiredModules.map((m, i) => (
              <ModuleRow
                key={m.curriculum_module_id}
                index={i}
                module={m.module}
                progress={progressFor(m)}
                isRequired={m.is_required}
              />
            ))}
          </ul>
        </section>
      )}

      {/* Optional modules */}
      {optionalModules.length > 0 && (
        <section>
          <h2
            className="mb-4 font-display text-ink-900"
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
              fontWeight: 400,
            }}
          >
            Optional modules.
          </h2>
          <ul className="space-y-2">
            {optionalModules.map((m, i) => (
              <ModuleRow
                key={m.curriculum_module_id}
                index={requiredModules.length + i}
                module={m.module}
                progress={progressFor(m)}
                isRequired={m.is_required}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
