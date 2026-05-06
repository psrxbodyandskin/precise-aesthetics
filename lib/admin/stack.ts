import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import type { Database } from "@/lib/supabase/types";
import type {
  StackEnvVarCreateInput,
  StackListFilters,
  StackServiceCreateInput,
  StackServiceUpdateInput,
} from "@/lib/schemas/stack";

// P13 — Stack reference data layer.
//
// Class C: admin-only via RLS + requireAdmin() at the route.
//
// CRITICAL: env-var helpers NEVER write a `value`. The schema has
// no value column; this layer wouldn't be able to persist one
// even if asked. Defense-in-depth.
//
// Audit log verbs:
//   stack_service.created / updated / archived
//   stack_env_var.created / removed
// (No stack_env_var.updated — append-and-remove only.)

export type StackServiceRow =
  Database["public"]["Tables"]["stack_services"]["Row"];
export type StackEnvVarRow =
  Database["public"]["Tables"]["stack_env_vars"]["Row"];

interface RouteContext {
  actorId: string;
  ipAddress?: string;
}

// ----- services -----

export async function listStackServices(
  filters: StackListFilters,
): Promise<{ data: StackServiceRow[]; error: string | null }> {
  const supabase = getServiceClient();
  let q = supabase
    .from("stack_services")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    if (statuses.length > 0) q = q.in("status", statuses);
  } else {
    q = q.eq("status", "active");
  }

  if (filters.category) {
    const cats = Array.isArray(filters.category) ? filters.category : [filters.category];
    if (cats.length > 0) q = q.in("category", cats);
  }

  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as StackServiceRow[], error: null };
}

export async function getStackServiceById(
  id: string,
): Promise<{ data: StackServiceRow | null; error: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("stack_services")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: (data ?? null) as StackServiceRow | null, error: null };
}

export async function createStackService(
  input: StackServiceCreateInput,
  ctx: RouteContext,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("stack_services")
    .insert({
      ...input,
      created_by: ctx.actorId,
      last_updated_by: ctx.actorId,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "Insert failed" };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "stack_service.created",
    targetType: "stack_service",
    targetId: data.id,
    metadata: { name: input.name, category: input.category },
    ipAddress: ctx.ipAddress,
  });

  return { id: data.id, error: null };
}

export async function updateStackService(
  id: string,
  input: StackServiceUpdateInput,
  ctx: RouteContext,
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("stack_services")
    .update({ ...input, last_updated_by: ctx.actorId })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "stack_service.updated",
    targetType: "stack_service",
    targetId: id,
    metadata: { fields_changed: Object.keys(input) },
    ipAddress: ctx.ipAddress,
  });

  return { error: null };
}

export async function archiveStackService(
  id: string,
  ctx: RouteContext,
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("stack_services")
    .update({ status: "former", last_updated_by: ctx.actorId })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "stack_service.archived",
    targetType: "stack_service",
    targetId: id,
    ipAddress: ctx.ipAddress,
  });

  return { error: null };
}

export async function getTotalMonthlyCost(): Promise<number> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("stack_services")
    .select("monthly_cost_estimate_usd")
    .eq("status", "active");
  if (error || !data) return 0;
  return data.reduce(
    (sum, row) => sum + Number(row.monthly_cost_estimate_usd ?? 0),
    0,
  );
}

// ----- env vars -----

export async function listEnvVarsForService(
  serviceId: string,
): Promise<{ data: StackEnvVarRow[]; error: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("stack_env_vars")
    .select("*")
    .eq("service_id", serviceId)
    .order("var_name", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as StackEnvVarRow[], error: null };
}

export async function addEnvVar(
  serviceId: string,
  input: StackEnvVarCreateInput,
  ctx: RouteContext,
): Promise<{ id: string | null; error: string | null }> {
  // Auto-detect is_secret for NEXT_PUBLIC_* per Brian's confirmation
  // in P13 ambiguity #5. Operator can override on the form.
  const isSecretDefault = !input.var_name.startsWith("NEXT_PUBLIC_");
  const is_secret = input.is_secret ?? isSecretDefault;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("stack_env_vars")
    .insert({
      service_id: serviceId,
      var_name: input.var_name,
      description: input.description ?? null,
      set_in_vercel: input.set_in_vercel,
      set_in_local_env: input.set_in_local_env,
      is_secret,
    })
    .select("id")
    .single();
  if (error || !data) return { id: null, error: error?.message ?? "Insert failed" };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "stack_env_var.created",
    targetType: "stack_env_var",
    targetId: data.id,
    metadata: {
      service_id: serviceId,
      var_name: input.var_name,
      is_secret,
    },
    ipAddress: ctx.ipAddress,
  });

  return { id: data.id, error: null };
}

export async function removeEnvVar(
  varId: string,
  ctx: RouteContext,
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  // Capture the row first for the audit trail
  const { data: existing } = await supabase
    .from("stack_env_vars")
    .select("var_name, service_id")
    .eq("id", varId)
    .maybeSingle();

  const { error } = await supabase.from("stack_env_vars").delete().eq("id", varId);
  if (error) return { error: error.message };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "stack_env_var.removed",
    targetType: "stack_env_var",
    targetId: varId,
    metadata: existing
      ? { service_id: existing.service_id, var_name: existing.var_name }
      : {},
    ipAddress: ctx.ipAddress,
  });

  return { error: null };
}
