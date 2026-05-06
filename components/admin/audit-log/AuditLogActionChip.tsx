import { cn } from "@/lib/utils";

// P14 — color-coded action verb chip.
//
// Color category mapping (locked here; future verb additions land in
// the matching bucket so the visual scan stays consistent):
//
//   • creation events       → ink-900 register   (.created)
//   • modification events   → brand-700 register (.updated, .changed,
//                                                 .status_change)
//   • removal events        → ink-300 register   (.deleted, .archived,
//                                                 .removed)
//   • publish events        → brand-500 register (.published, .publish,
//                                                 .unpublished, .unpublish)
//   • AI agent events       → ink-700 register   (agent_run.*, plus the
//                                                 distinct visual treatment)
//   • auth + admin events   → error-700 register (auth.*, admin.*)
//                            ← attention-getting; credential rotations
//                              + auth changes matter for compliance
//   • everything else       → ink-700 default
//
// When a new verb category lands (e.g. P15 ships some new domain),
// add it here. The visual scan is the whole point — Roni glances at
// the timeline and reads color to know "this is creation vs auth
// vs publish" before reading the verb itself.

type Category =
  | "creation"
  | "modification"
  | "removal"
  | "publish"
  | "ai"
  | "auth"
  | "default";

function classify(action: string): Category {
  // Auth + admin first — these need the loudest visual treatment
  if (action.startsWith("auth.") || action.startsWith("admin.")) return "auth";
  if (action.startsWith("agent_run.")) return "ai";

  if (action.endsWith(".created")) return "creation";
  if (
    action.endsWith(".updated") ||
    action.endsWith(".changed") ||
    action.endsWith(".status_change")
  ) {
    return "modification";
  }
  if (
    action.endsWith(".deleted") ||
    action.endsWith(".archived") ||
    action.endsWith(".removed")
  ) {
    return "removal";
  }
  if (
    action.endsWith(".published") ||
    action.endsWith(".publish") ||
    action.endsWith(".unpublished") ||
    action.endsWith(".unpublish")
  ) {
    return "publish";
  }
  return "default";
}

const STYLE: Record<Category, string> = {
  creation: "bg-ink-900/8 text-ink-900 ring-ink-900/15",
  modification: "bg-brand-700/10 text-brand-700 ring-brand-700/20",
  removal: "bg-bone-200 text-ink-300 ring-ink-300/20",
  publish: "bg-brand-500/12 text-brand-700 ring-brand-700/20",
  ai: "bg-bone-200 text-ink-700 ring-ink-700/15",
  auth: "bg-[#FBEAEA] text-[#8A2C2C] ring-[#B23B3B]/30",
  default: "bg-bone-200 text-ink-700 ring-ink-700/15",
};

export function AuditLogActionChip({
  action,
  className,
}: {
  action: string;
  className?: string;
}) {
  const cat = classify(action);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[11px] font-medium ring-1 ring-inset",
        STYLE[cat],
        className,
      )}
    >
      {action}
    </span>
  );
}

export function classifyAction(action: string): Category {
  return classify(action);
}
