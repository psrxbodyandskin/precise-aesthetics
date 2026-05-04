import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { fetchProtocolFromSanity } from "@/lib/sanity/protocols";
import type { ProtocolStatus } from "@/lib/schemas/protocol";

// P4 — Server-only data layer for the admin protocol library.
// All callers go through requireAdmin() before reaching here.
// The service-role client bypasses RLS; authorization is enforced
// upstream in route handlers.

// ------------------------------------------------------------
// List + detail reads
// ------------------------------------------------------------
export async function listProtocols(opts: {
  status?: ProtocolStatus | "all";
  indicationCategoryId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = getServiceClient();
  let q = supabase
    .from("protocols")
    .select(
      "id, sanity_id, title, slug, short_description, indication_category_id, status, current_version, pending_major_bump, last_published_at, created_at, indication_categories(id, title, slug)",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });

  if (opts.status && opts.status !== "all") {
    q = q.eq("status", opts.status);
  }
  if (opts.indicationCategoryId) {
    q = q.eq("indication_category_id", opts.indicationCategoryId);
  }
  if (opts.search && opts.search.trim().length > 0) {
    const term = `%${opts.search.trim().toLowerCase()}%`;
    q = q.or(`title.ilike.${term},slug.ilike.${term}`);
  }

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  q = q.range(offset, offset + limit - 1);

  return q;
}

export async function getProtocolById(id: string) {
  const supabase = getServiceClient();
  return supabase
    .from("protocols")
    .select(
      "*, indication_categories(id, sanity_id, title, slug, sort_order)",
    )
    .eq("id", id)
    .single();
}

export async function listProtocolDevices(protocolId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("protocol_devices")
    .select("*, devices(id, slug, display_name, short_description)")
    .eq("protocol_id", protocolId);
}

export async function listProtocolVersions(protocolId: string) {
  const supabase = getServiceClient();
  return supabase
    .from("protocol_versions")
    .select(
      "id, version, title, short_description, published_at, published_by",
    )
    .eq("protocol_id", protocolId)
    .order("published_at", { ascending: false });
}

export async function listAuditLogForProtocol(
  protocolId: string,
  limit = 50,
) {
  const supabase = getServiceClient();
  return supabase
    .from("audit_log")
    .select("*")
    .eq("target_type", "protocol")
    .eq("target_id", protocolId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

// Hydrate the full Sanity document for the detail-view content preview.
export async function getProtocolSanityContent(sanityId: string) {
  return fetchProtocolFromSanity(sanityId);
}

// ------------------------------------------------------------
// Mutations — all log-audit'd from the route handler
// ------------------------------------------------------------

export async function replaceProtocolDevices(
  protocolId: string,
  deviceIds: string[],
) {
  const supabase = getServiceClient();

  const { error: deleteError } = await supabase
    .from("protocol_devices")
    .delete()
    .eq("protocol_id", protocolId);
  if (deleteError) {
    return { status: "error" as const, message: deleteError.message };
  }

  if (deviceIds.length === 0) {
    return { status: "ok" as const, count: 0 };
  }

  const rows = deviceIds.map((deviceId) => ({
    protocol_id: protocolId,
    device_id: deviceId,
  }));
  const { error: insertError } = await supabase
    .from("protocol_devices")
    .insert(rows);
  if (insertError) {
    return { status: "error" as const, message: insertError.message };
  }
  return { status: "ok" as const, count: rows.length };
}

export async function setProtocolStatus(
  protocolId: string,
  status: ProtocolStatus,
) {
  const supabase = getServiceClient();
  return supabase
    .from("protocols")
    .update({ status })
    .eq("id", protocolId)
    .select("*")
    .single();
}

export async function setPendingMajorBump(
  protocolId: string,
  pendingMajorBump: boolean,
) {
  const supabase = getServiceClient();
  return supabase
    .from("protocols")
    .update({ pending_major_bump: pendingMajorBump })
    .eq("id", protocolId)
    .select("id, pending_major_bump, current_version")
    .single();
}
