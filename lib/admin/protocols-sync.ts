import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import {
  fetchIndicationFromSanity,
  fetchProtocolFromSanity,
} from "@/lib/sanity/protocols";
import type { Indication, Protocol } from "@/lib/sanity/types";
import type { Database, Json } from "@/lib/supabase/types";

// P4 — Sync layer. Writes Sanity content into the Supabase mirror.
//
// Called from:
//   - Webhook handler (/api/webhooks/sanity/protocol) on publish/unpublish
//   - Admin force-resync endpoint
//
// Idempotency:
//   - Each row stores the last-synced Sanity _rev. If the incoming
//     rev matches, sync is a no-op.
//   - protocol_versions is keyed (protocol_id, version) — duplicate
//     publishes for the same version are rejected by the unique
//     constraint, but we check first to avoid loud errors.
//
// Versioning:
//   - First publish: 1.0
//   - Subsequent publishes: minor bump (1.0 → 1.1) by default
//   - If protocols.pending_major_bump = true at publish time:
//     major bump (1.5 → 2.0) and the flag is cleared
//   - Admin sets the flag via /api/admin/protocols/[id]/major-bump
//
// Status mapping:
//   - Sanity published → Supabase status='published', creates new version snapshot
//   - Sanity draft (was published) → Supabase status='draft', no snapshot, last_published_at intact
//   - Sanity archived → Supabase status='archived'
//   - Sanity unpublish → Supabase status='archived' (do NOT delete; treatment_logs reference it)

type SyncResult =
  | { status: "ok"; action: "synced" | "skipped"; reason?: string }
  | { status: "error"; message: string };

type ProtocolUpdate = Database["public"]["Tables"]["protocols"]["Update"];

// ------------------------------------------------------------
// Indication sync — straightforward upsert by sanity_id
// ------------------------------------------------------------
export async function syncIndicationFromSanity(
  sanityId: string,
): Promise<SyncResult> {
  const doc = await fetchIndicationFromSanity(sanityId);
  if (!doc) {
    return await deleteIndicationBySanityId(sanityId);
  }
  return await upsertIndication(doc);
}

export async function upsertIndication(
  doc: Indication,
): Promise<SyncResult> {
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("indication_categories")
    .select("id, sanity_rev")
    .eq("sanity_id", doc._id)
    .maybeSingle();

  if (existing && existing.sanity_rev === doc._rev) {
    return { status: "ok", action: "skipped", reason: "rev unchanged" };
  }

  const payload = {
    sanity_id: doc._id,
    sanity_rev: doc._rev ?? null,
    title: doc.title,
    slug: doc.slug.current,
    short_description: doc.shortDescription ?? null,
    sort_order: doc.sortOrder ?? doc.displayOrder ?? 0,
  };

  const { error } = existing
    ? await supabase
        .from("indication_categories")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("indication_categories").insert(payload);

  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "ok", action: "synced" };
}

async function deleteIndicationBySanityId(
  sanityId: string,
): Promise<SyncResult> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("indication_categories")
    .delete()
    .eq("sanity_id", sanityId);
  if (error) return { status: "error", message: error.message };
  return { status: "ok", action: "synced", reason: "deleted" };
}

// ------------------------------------------------------------
// Protocol sync — orchestration
// ------------------------------------------------------------
export async function syncProtocolFromSanity(
  sanityId: string,
  options: { actorId?: string } = {},
): Promise<SyncResult> {
  const doc = await fetchProtocolFromSanity(sanityId);
  if (!doc) {
    // Document deleted in Sanity → archive in Supabase (don't delete;
    // treatment_logs reference versions).
    return await archiveProtocolBySanityId(sanityId);
  }
  return await upsertProtocolFromSanity(doc, options);
}

export async function upsertProtocolFromSanity(
  doc: Protocol,
  options: { actorId?: string } = {},
): Promise<SyncResult> {
  const supabase = getServiceClient();

  // Resolve indication category by Sanity ref (the `indication` field is
  // expanded to include _id by fetchProtocolFromSanity's projection).
  const indicationSanityRef = doc.indication;
  let indicationSanityId: string | null = null;
  let indicationCategoryId: string | null = null;
  if (indicationSanityRef && "_id" in indicationSanityRef) {
    indicationSanityId = indicationSanityRef._id;
  } else if (indicationSanityRef && "_ref" in indicationSanityRef) {
    indicationSanityId = indicationSanityRef._ref;
  }
  if (indicationSanityId) {
    const { data } = await supabase
      .from("indication_categories")
      .select("id")
      .eq("sanity_id", indicationSanityId)
      .maybeSingle();
    indicationCategoryId = data?.id ?? null;
    // If missing, the indication webhook hasn't fired yet. The protocol
    // sync still proceeds with null indication_category_id; admin can
    // re-resync the indication or it'll auto-resolve on the next protocol
    // edit. Loud-log so we can detect persistent missing references.
    if (!indicationCategoryId) {
      console.warn("[sync] protocol references missing indication", {
        protocolSanityId: doc._id,
        indicationSanityId,
      });
    }
  }

  // Existing row?
  const { data: existing } = await supabase
    .from("protocols")
    .select(
      "id, sanity_rev, current_version, status, pending_major_bump, last_published_at",
    )
    .eq("sanity_id", doc._id)
    .maybeSingle();

  // Idempotency — same _rev, no work to do
  if (existing && existing.sanity_rev === doc._rev) {
    return { status: "ok", action: "skipped", reason: "rev unchanged" };
  }

  const isPublishingNow = doc.status === "published";
  const wasPublished = existing?.status === "published";

  // Decide next version
  let nextVersion: string | null = existing?.current_version ?? null;
  let willCreateSnapshot = false;
  if (isPublishingNow) {
    if (!existing || !wasPublished) {
      // First publish (new protocol) OR republishing a draft → start at 1.0
      // OR bump from previous published version.
      if (!existing?.current_version) {
        nextVersion = "1.0";
      } else {
        nextVersion = existing.pending_major_bump
          ? bumpMajor(existing.current_version)
          : bumpMinor(existing.current_version);
      }
      willCreateSnapshot = true;
    } else {
      // Already published, content edit republish → minor or major bump
      nextVersion = existing.pending_major_bump
        ? bumpMajor(existing.current_version!)
        : bumpMinor(existing.current_version!);
      willCreateSnapshot = true;
    }
  }

  const now = new Date().toISOString();

  const updatePayload: ProtocolUpdate = {
    sanity_id: doc._id,
    sanity_rev: doc._rev ?? null,
    title: doc.title,
    slug: doc.slug.current,
    short_description: doc.shortDescription ?? null,
    indication_category_id: indicationCategoryId,
    indication_tags: doc.indicationTags ?? [],
    fitzpatrick_types: doc.fitzpatrickTypes ?? [],
    status: doc.status,
    last_synced_at: now,
  };

  if (isPublishingNow) {
    updatePayload.current_version = nextVersion;
    updatePayload.last_published_at = now;
    updatePayload.last_published_by = options.actorId ?? null;
    updatePayload.pending_major_bump = false; // consume the flag
  }

  // Upsert
  let protocolId: string;
  if (existing) {
    const { data, error } = await supabase
      .from("protocols")
      .update(updatePayload)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: error?.message ?? "Update failed" };
    }
    protocolId = data.id;
  } else {
    const { data, error } = await supabase
      .from("protocols")
      .insert(updatePayload as never)
      .select("id")
      .single();
    if (error || !data) {
      return { status: "error", message: error?.message ?? "Insert failed" };
    }
    protocolId = data.id;
  }

  // Snapshot if publishing
  if (willCreateSnapshot && nextVersion) {
    const snapshotResult = await createVersionSnapshot({
      protocolId,
      version: nextVersion,
      doc,
      actorId: options.actorId,
      indicationSanityId,
    });
    if (snapshotResult.status === "error") {
      return snapshotResult;
    }
  }

  return { status: "ok", action: "synced" };
}

async function archiveProtocolBySanityId(
  sanityId: string,
): Promise<SyncResult> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("protocols")
    .update({ status: "archived" })
    .eq("sanity_id", sanityId);
  if (error) return { status: "error", message: error.message };
  return { status: "ok", action: "synced", reason: "archived" };
}

// ------------------------------------------------------------
// Snapshot creation — append-only ledger row
// ------------------------------------------------------------
interface CreateSnapshotArgs {
  protocolId: string;
  version: string;
  doc: Protocol;
  actorId?: string;
  indicationSanityId: string | null;
}

async function createVersionSnapshot(
  args: CreateSnapshotArgs,
): Promise<SyncResult> {
  const supabase = getServiceClient();

  // Idempotency — if this exact (protocol_id, version) snapshot already
  // exists, skip without erroring. Happens on duplicate webhook delivery.
  const { data: existing } = await supabase
    .from("protocol_versions")
    .select("id")
    .eq("protocol_id", args.protocolId)
    .eq("version", args.version)
    .maybeSingle();
  if (existing) {
    return {
      status: "ok",
      action: "skipped",
      reason: "version snapshot exists",
    };
  }

  const { error } = await supabase.from("protocol_versions").insert({
    protocol_id: args.protocolId,
    version: args.version,
    title: args.doc.title,
    short_description: args.doc.shortDescription ?? null,
    indication_category_sanity_id: args.indicationSanityId,
    indication_tags: args.doc.indicationTags ?? [],
    fitzpatrick_types: args.doc.fitzpatrickTypes ?? [],
    sanity_snapshot: args.doc as unknown as Json,
    published_by: args.actorId ?? null,
  });
  if (error) {
    return { status: "error", message: error.message };
  }
  return { status: "ok", action: "synced" };
}

// ------------------------------------------------------------
// Version bump helpers
// ------------------------------------------------------------
export function bumpMinor(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed) return "1.0";
  return `${parsed.major}.${parsed.minor + 1}`;
}

export function bumpMajor(version: string): string {
  const parsed = parseVersion(version);
  if (!parsed) return "2.0";
  return `${parsed.major + 1}.0`;
}

function parseVersion(v: string): { major: number; minor: number } | null {
  const m = /^(\d+)\.(\d+)$/.exec(v);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]) };
}
