import { cn } from "@/lib/utils";

// P14 — actor role indicator.
//
// NULL actor_role represents service-role actions with no acting user
// (webhooks, scheduled jobs, system events). Rendered as "System".

interface AuditLogActorChipProps {
  actorRole: string | null;
  className?: string;
}

const STYLE: Record<string, string> = {
  admin: "bg-midnight-800 text-cream-50 ring-midnight-800/30",
  practice: "bg-brand-700/10 text-brand-700 ring-brand-700/20",
  system: "bg-bone-200 text-ink-500 ring-ink-500/15",
};

const LABEL: Record<string, string> = {
  admin: "Admin",
  practice: "Practice",
  system: "System",
};

export function AuditLogActorChip({
  actorRole,
  className,
}: AuditLogActorChipProps) {
  const key = actorRole ?? "system";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-body text-[10px] font-medium uppercase ring-1 ring-inset",
        STYLE[key] ?? STYLE.system,
        className,
      )}
      style={{ letterSpacing: "0.08em" }}
    >
      {LABEL[key] ?? "System"}
    </span>
  );
}
