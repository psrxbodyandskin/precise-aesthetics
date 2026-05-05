import { NextResponse, type NextRequest } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

import {
  syncIndicationFromSanity,
  syncProtocolFromSanity,
} from "@/lib/admin/protocols-sync";
import { getServiceClient } from "@/lib/supabase/server";
import {
  dispatchToPractice,
  listPracticesForDeviceOwnership,
  listPracticesForProtocolUsage,
} from "@/lib/notifications/dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/webhooks/sanity/protocol
//
// Sanity webhook endpoint for protocol library content. Configured
// in Sanity Studio → Manage → API → Webhooks. Single endpoint
// handles BOTH `protocol` and `indication` document types — branch
// on `_type` after signature verification.
//
// Auth: HMAC-SHA256 via @sanity/webhook. Sanity sends the signature
// in the `sanity-webhook-signature` header. Reject any request that
// doesn't verify against SANITY_WEBHOOK_SECRET.
//
// Idempotency: the sync layer compares incoming `_rev` against the
// last-stored rev in the Supabase mirror. Duplicate deliveries (same
// rev) are no-ops.
//
// Document deletion: Sanity's "Delete" event fires with the document
// removed; the sync layer interprets a missing fetch result as
// "archive in Supabase" (do NOT hard-delete; treatment_logs may
// reference protocol_versions).
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook/sanity/protocol] SANITY_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
      { status: 503 },
    );
  }

  const signature = req.headers.get(SIGNATURE_HEADER_NAME);
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing signature." },
      { status: 401 },
    );
  }

  const valid = await isValidSignature(rawBody, signature, secret);
  if (!valid) {
    return NextResponse.json(
      { ok: false, error: "Invalid signature." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const event = parseEvent(payload);
  if (!event) {
    return NextResponse.json(
      { ok: false, error: "Could not parse webhook payload." },
      { status: 400 },
    );
  }

  // Branch on document type. Sanity webhooks fire one document at a time.
  let result: Awaited<ReturnType<typeof syncProtocolFromSanity>>;
  if (event.type === "protocol") {
    result = await syncProtocolFromSanity(event.id);
  } else if (event.type === "indication") {
    result = await syncIndicationFromSanity(event.id);
  } else {
    return NextResponse.json(
      {
        ok: false,
        error: `Unsupported document type: ${event.type}`,
      },
      { status: 400 },
    );
  }

  if (result.status === "error") {
    console.error("[webhook/sanity/protocol] sync failed", {
      type: event.type,
      id: event.id,
      message: result.message,
    });
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  // P10 — fan-out notifications on protocol publish.
  // Two categories, partitioned by "has the practice used this
  // protocol before?":
  //   - protocol.updated_for_used_protocol (mandatory) → every
  //     practice with at least one treatment row referencing it.
  //   - protocol.new_for_owned_device (mutable) → every practice
  //     that owns one of the protocol's devices but has NOT used
  //     this protocol yet.
  //
  // Synchronous fan-out is fine at 1-10 practices (single-digit
  // ms total). Threshold to migrate to a background job:
  // ~100 practices total — at that scale this loop adds latency
  // to webhook acks and Sanity may retry on slow responses.
  if (event.type === "protocol" && result.action === "synced") {
    try {
      await dispatchProtocolPublishNotifications(event.id);
    } catch (err) {
      // Notification fan-out is best-effort. Don't fail the
      // webhook ack — the sync itself succeeded.
      console.error(
        "[webhook/sanity/protocol] notification fan-out failed",
        err,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    action: result.action,
    reason: result.reason,
  });
}

async function dispatchProtocolPublishNotifications(
  sanityProtocolId: string,
): Promise<void> {
  const supabase = getServiceClient();

  // Look up the freshly-synced protocol row + device tags.
  const { data: protocolRow } = await supabase
    .from("protocols")
    .select("id, title, current_version")
    .eq("sanity_id", sanityProtocolId)
    .single();
  if (!protocolRow) return;
  const protocolId = protocolRow.id as string;
  const versionLabel = (protocolRow.current_version as string) ?? "current";

  const { data: protoDeviceRows } = await supabase
    .from("protocol_devices")
    .select("device_id")
    .eq("protocol_id", protocolId);
  const deviceIds = ((protoDeviceRows ?? []) as Array<{ device_id: string }>)
    .map((r) => r.device_id);

  // Set 1: practices that have logged ≥1 treatment with this
  // protocol → mandatory notification.
  const usedBy = await listPracticesForProtocolUsage(protocolId);
  const usedSet = new Set(usedBy);

  // Set 2: practices that own any of the protocol's devices.
  const ownerIdsArrays = await Promise.all(
    deviceIds.map((d) => listPracticesForDeviceOwnership(d)),
  );
  const owners = new Set<string>();
  for (const arr of ownerIdsArrays) for (const id of arr) owners.add(id);

  // Used practices → mandatory category, version-keyed event_id.
  for (const practiceId of usedBy) {
    await dispatchToPractice(practiceId, {
      category: "protocol.updated_for_used_protocol",
      eventId: `protocol.updated.${protocolId}.${versionLabel}.practice.${practiceId}`,
      title: `Protocol updated: ${protocolRow.title}`,
      body: `A protocol your practice has used was republished as v${versionLabel}.`,
      linkPath: `/portal/protocols`,
      metadata: {
        protocol_id: protocolId,
        version_label: versionLabel,
      },
    });
  }

  // Owners minus users → mutable "new for your device" category.
  // Event id intentionally lacks version so the FIRST time a
  // practice gets this protocol notifies them; subsequent
  // republishes for the same practice dedupe at the unique key.
  for (const practiceId of owners) {
    if (usedSet.has(practiceId)) continue;
    await dispatchToPractice(practiceId, {
      category: "protocol.new_for_owned_device",
      eventId: `protocol.new.${protocolId}.practice.${practiceId}`,
      title: `New protocol available: ${protocolRow.title}`,
      body: "A protocol for one of your devices was published.",
      linkPath: `/portal/protocols`,
      metadata: {
        protocol_id: protocolId,
      },
    });
  }
}

// ------------------------------------------------------------
// Sanity webhook payload parsing
// Sanity supports custom projections, but the default delivery is the
// full document with `_id`, `_type`, `_rev`. We accept either shape.
// ------------------------------------------------------------
interface ParsedEvent {
  type: string;
  id: string;
}

function parseEvent(payload: unknown): ParsedEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;

  const id =
    typeof obj._id === "string"
      ? obj._id
      : typeof obj.documentId === "string"
        ? obj.documentId
        : null;
  const type =
    typeof obj._type === "string"
      ? obj._type
      : typeof obj.documentType === "string"
        ? obj.documentType
        : null;

  if (!id || !type) return null;
  return { type, id };
}
