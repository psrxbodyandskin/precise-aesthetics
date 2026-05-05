import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { getServiceClient } from "@/lib/supabase/server";
import { treatmentLogSchema, type PhotoMetadata } from "@/lib/schemas/treatment";
import {
  createTreatment,
  resolveCurrentVersionId,
  listTreatmentsForPractice,
} from "@/lib/portal/treatments";
import { listAuthorizedUsersForPractice } from "@/lib/portal/treatments";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";
import { sendAdverseEventNotification } from "@/lib/resend/send";
import {
  certifiedDeviceIdsForUser,
  protocolDeviceIds,
} from "@/lib/portal/training";

export const runtime = "nodejs";

// POST /api/portal/treatments
//
// Multipart submission:
//   - "payload" field: JSON-encoded TreatmentLogValues
//   - "photo_<index>" fields: image files (already EXIF-stripped client-side)
//
// Flow:
//   1. requirePractice() + resolve practice_id
//   2. Parse + validate payload (Zod)
//   3. Resolve current protocol_version_id (locks at log time)
//   4. Validate entered_by_user_id belongs to this practice
//   5. Upload photos to storage (path: {practice_id}/{treatment_id}/{uuid}-{filename})
//      — generated AFTER the treatment row exists so we have the id
//   6. Insert treatment + photo metadata + adverse event (atomic-ish via service role)
//   7. Send adverse event email if flagged
//   8. Audit log
//   9. Return treatment id
export async function POST(req: NextRequest) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice record not found." },
      { status: 404 },
    );
  }

  const formData = await req.formData();
  const payloadRaw = formData.get("payload");
  if (typeof payloadRaw !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing payload" },
      { status: 400 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  const parsed = treatmentLogSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid submission",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const values = parsed.data;

  // Resolve the current version id. RLS already ensures this protocol
  // is visible to the practice (device-tagged + status='published').
  const versionResult = await resolveCurrentVersionId(values.protocolId);
  if (!versionResult) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Could not resolve the current protocol version. Refresh and try again.",
      },
      { status: 400 },
    );
  }

  // Validate entered_by_user_id belongs to this practice's roster
  // and snapshot the name for denormalization.
  const authorizedUsers = await listAuthorizedUsersForPractice();
  const matchedUser = authorizedUsers.find(
    (u) => u.id === values.enteredByUserId,
  );
  if (!matchedUser) {
    return NextResponse.json(
      { ok: false, error: "Selected user is not on your practice roster." },
      { status: 400 },
    );
  }

  // P9.1 — per-user certification gate. The entered_by user must
  // be certified for at least one of the protocol's applicable
  // devices. Cert is per-user, not practice-wide, so a logger who
  // hasn't trained themselves can't push a row through even if a
  // colleague is certified.
  const [protoDeviceIds, userCertedDeviceIds] = await Promise.all([
    protocolDeviceIds(values.protocolId),
    certifiedDeviceIdsForUser(values.enteredByUserId),
  ]);
  if (protoDeviceIds.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "This protocol is not associated with any device. Contact admin.",
      },
      { status: 400 },
    );
  }
  const intersection = protoDeviceIds.filter((id) =>
    userCertedDeviceIds.includes(id),
  );
  if (intersection.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `${matchedUser.full_name} is not certified for any of this protocol's devices. Complete training first.`,
        code: "NOT_CERTIFIED",
      },
      { status: 403 },
    );
  }

  // ---- Photo upload (storage first, metadata in createTreatment) ----
  const photoFiles: { file: File; meta: PhotoMetadata; index: number }[] = [];
  const photoMetas = values.photoMetadata ?? [];
  for (let i = 0; i < photoMetas.length; i++) {
    const file = formData.get(`photo_${i}`);
    if (file instanceof File) {
      photoFiles.push({ file, meta: photoMetas[i]!, index: i });
    }
  }

  // Upload photos with a temp prefix; we'll move them to the real path
  // after the treatment id is known. Simpler: generate the treatment id
  // up front via uuid, but for now upload to a staging path under the
  // practice_id and remember storage_path strings for the metadata insert.
  // Storage policy enforces that the first folder segment is the
  // practice_id of the caller (via JWT), so all paths start with practice.id.
  const supabase = getServiceClient();
  const photoUploads: Array<{
    storage_path: string;
    filename: string;
    mime_type: string;
    byte_size: number;
    capture_phase?: "before" | "during" | "after" | "followup" | null;
    caption?: string | null;
    consent_affirmed: boolean;
  }> = [];

  // Pre-generate treatment id so storage paths can include it before insert.
  // Using crypto.randomUUID on the server.
  const treatmentId = crypto.randomUUID();

  for (const { file, meta } of photoFiles) {
    if (file.size === 0 || file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: `Photo "${file.name}" is empty or larger than 15MB.` },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: `Photo "${file.name}" is not an image.` },
        { status: 400 },
      );
    }
    const photoUuid = crypto.randomUUID();
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
    const storagePath = `${practice.id}/${treatmentId}/${photoUuid}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("treatment-photos")
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      // Roll back any earlier successful uploads to avoid orphaned files.
      for (const p of photoUploads) {
        await supabase.storage.from("treatment-photos").remove([p.storage_path]);
      }
      return NextResponse.json(
        { ok: false, error: `Photo upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }
    photoUploads.push({
      storage_path: storagePath,
      filename: file.name,
      mime_type: file.type,
      byte_size: file.size,
      capture_phase: meta.capturePhase ?? null,
      caption: meta.caption ?? null,
      consent_affirmed: values.consentAffirmed,
    });
  }

  // ---- Insert treatment + photos + adverse event ----
  const result = await createTreatment({
    practiceId: practice.id,
    values,
    enteredByName: matchedUser.full_name,
    protocolVersionId: versionResult.versionId,
    protocolVersionLabel: versionResult.versionLabel,
    photos: photoUploads,
  });

  if (result.status !== "ok") {
    // Clean up uploaded photos on failure
    for (const p of photoUploads) {
      await supabase.storage.from("treatment-photos").remove([p.storage_path]);
    }
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  // ---- Send adverse event email + log ----
  if (values.adverseReaction && result.adverseEventId) {
    // Fetch protocol title for the email
    const { data: protocolRow } = await supabase
      .from("protocols")
      .select("title")
      .eq("id", values.protocolId)
      .single();
    const sendResult = await sendAdverseEventNotification({
      adverseEventId: result.adverseEventId,
      practiceName: practice.name,
      treatmentDate: values.treatmentDate,
      protocolTitle: protocolRow?.title ?? "Unknown protocol",
      protocolVersionLabel: versionResult.versionLabel,
      indication: values.indication,
      patientFitzpatrick: values.patientFitzpatrick,
      enteredByName: matchedUser.full_name,
      description: values.adverseReactionDescription ?? "",
    });
    if (!sendResult.ok) {
      console.error(
        "[treatments] adverse event email failed",
        sendResult.error,
      );
      // Don't fail the request — the treatment + adverse event row exist;
      // admin will see it in the panel even if the email didn't go.
    }
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: "treatment.logged",
    targetType: "treatment",
    targetId: result.treatmentId,
    metadata: {
      photos: photoUploads.length,
      adverseEvent: values.adverseReaction,
      protocol_version: versionResult.versionLabel,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({
    ok: true,
    treatmentId: result.treatmentId,
    adverseEventId: result.adverseEventId,
  });
}

export async function GET() {
  await requirePractice();
  const treatments = await listTreatmentsForPractice({ limit: 100 });
  return NextResponse.json({ ok: true, treatments });
}
