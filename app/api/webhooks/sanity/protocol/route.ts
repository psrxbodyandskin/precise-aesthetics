import { NextResponse, type NextRequest } from "next/server";
import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";

import {
  syncIndicationFromSanity,
  syncProtocolFromSanity,
} from "@/lib/admin/protocols-sync";

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

  return NextResponse.json({
    ok: true,
    action: result.action,
    reason: result.reason,
  });
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
