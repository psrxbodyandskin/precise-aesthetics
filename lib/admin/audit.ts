import "server-only";
import { getServiceClient } from "@/lib/supabase/server";

// Wrapper around the SECURITY DEFINER `log_audit()` SQL function from
// 0004_rls_framework.sql. Every admin write action calls this — never
// inserts into audit_log directly. Centralizing here means downstream
// sessions don't need to know the RPC signature.
//
// Required for clinical-software compliance trails. See spec/RLS-PATTERNS.md.

export interface LogAuditArgs {
  /** auth.users.id of the user performing the action. */
  actorId: string;
  /** 'admin' | 'practice'. */
  actorRole: string;
  /** Dotted action verb, e.g. 'practice.provisioned', 'protocol.published'. */
  action: string;
  /** What kind of thing was affected, e.g. 'practice', 'protocol'. */
  targetType?: string;
  /** UUID of the affected record. */
  targetId?: string;
  /** Free-form details (JSON). Not for PHI — store anonymized facts only. */
  metadata?: Record<string, unknown>;
  /** Client IP if available (`getClientIp()` from lib/rate-limit.ts). */
  ipAddress?: string;
}

export async function logAudit(args: LogAuditArgs): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.rpc("log_audit", {
    p_actor_id: args.actorId,
    p_actor_role: args.actorRole,
    p_action: args.action,
    p_target_type: args.targetType ?? null,
    p_target_id: args.targetId ?? null,
    p_metadata: (args.metadata ?? {}) as never,
    p_ip_address: args.ipAddress ?? null,
  });

  if (error) {
    // Audit failure is loud but non-fatal: the underlying admin action
    // already succeeded. Surface to server logs for compliance review.
    console.error("[audit] log_audit failed", {
      action: args.action,
      targetType: args.targetType,
      targetId: args.targetId,
      error: error.message,
    });
  }
}
