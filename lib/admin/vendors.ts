import "server-only";

import { getServiceClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/admin/audit";
import type { Database } from "@/lib/supabase/types";
import type {
  VendorCreateInput,
  VendorListFilters,
  VendorUpdateInput,
} from "@/lib/schemas/vendor";

// P13 — Vendor directory data layer.
//
// Class C: every read/write goes through service-role + the route's
// requireAdmin() gate. RLS policies on the table enforce admin-only
// at the DB layer.
//
// Audit log verbs (per Brian's confirmation in P13 ambiguity #4):
//   vendor.created / vendor.updated / vendor.archived

export type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];

interface RouteContext {
  actorId: string;
  ipAddress?: string;
}

export async function listVendors(
  filters: VendorListFilters,
): Promise<{ data: VendorRow[]; error: string | null }> {
  const supabase = getServiceClient();
  let q = supabase.from("vendors").select("*").order("name", { ascending: true });

  // Status filter (default to active when omitted, like /admin/practices)
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    if (statuses.length > 0) q = q.in("status", statuses);
  } else {
    q = q.eq("status", "active");
  }

  // Category filter
  if (filters.category) {
    const cats = Array.isArray(filters.category) ? filters.category : [filters.category];
    if (cats.length > 0) q = q.in("category", cats);
  }

  // Search across name + description + contact name + contact email + notes
  if (filters.q && filters.q.length >= 1) {
    const escaped = filters.q.replace(/[%_]/g, "\\$&");
    q = q.or(
      [
        `name.ilike.%${escaped}%`,
        `description.ilike.%${escaped}%`,
        `contact_name.ilike.%${escaped}%`,
        `contact_email.ilike.%${escaped}%`,
        `notes.ilike.%${escaped}%`,
      ].join(","),
    );
  }

  const { data, error } = await q;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as VendorRow[], error: null };
}

export async function getVendorById(
  id: string,
): Promise<{ data: VendorRow | null; error: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) return { data: null, error: error.message };
  return { data: (data ?? null) as VendorRow | null, error: null };
}

export async function createVendor(
  input: VendorCreateInput,
  ctx: RouteContext,
): Promise<{ id: string | null; error: string | null }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("vendors")
    .insert({
      ...input,
      contact_email: input.contact_email || null,
      messaging_handles: input.messaging_handles as never,
      created_by: ctx.actorId,
      last_updated_by: ctx.actorId,
    })
    .select("id")
    .single();

  if (error || !data) return { id: null, error: error?.message ?? "Insert failed" };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "vendor.created",
    targetType: "vendor",
    targetId: data.id,
    metadata: { name: input.name, category: input.category },
    ipAddress: ctx.ipAddress,
  });

  return { id: data.id, error: null };
}

export async function updateVendor(
  id: string,
  input: VendorUpdateInput,
  ctx: RouteContext,
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  const update: Database["public"]["Tables"]["vendors"]["Update"] = {
    ...input,
    last_updated_by: ctx.actorId,
  };
  if ("contact_email" in input) {
    update.contact_email = input.contact_email || null;
  }
  if ("messaging_handles" in input && input.messaging_handles) {
    update.messaging_handles = input.messaging_handles as never;
  }

  const { error } = await supabase.from("vendors").update(update).eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "vendor.updated",
    targetType: "vendor",
    targetId: id,
    metadata: { fields_changed: Object.keys(input) },
    ipAddress: ctx.ipAddress,
  });

  return { error: null };
}

// Soft-delete: status='former'. Hard delete is intentionally unavailable.
export async function archiveVendor(
  id: string,
  ctx: RouteContext,
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("vendors")
    .update({ status: "former", last_updated_by: ctx.actorId })
    .eq("id", id);
  if (error) return { error: error.message };

  await logAudit({
    actorId: ctx.actorId,
    actorRole: "admin",
    action: "vendor.archived",
    targetType: "vendor",
    targetId: id,
    ipAddress: ctx.ipAddress,
  });

  return { error: null };
}
