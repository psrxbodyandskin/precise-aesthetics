import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import {
  isMandatory,
  isWithinQuietHours,
  shouldDispatchChannel,
  type NotificationCategory,
  type Preferences,
} from "@/lib/schemas/notifications";
import { sendNotificationEmail } from "./email";
import type { Database } from "@/lib/supabase/types";

// P10 — Notification dispatch core.
//
// Public surface:
//   - dispatchToPractice(practiceId, payload)
//   - dispatchToAdmins(payload)
//
// Internally both call dispatchSingle() which handles:
//   1. Insert notification (idempotency via partial unique
//      indexes on (practice_id|admin_user_id, event_id))
//   2. Catch SQLSTATE 23505 — duplicate event, no-op everything
//   3. Log in_app dispatch
//   4. If email eligible + preference allows + not in quiet
//      hours (or category is mandatory): render + Resend + log
//   5. If email fails: log status='failed' but don't throw —
//      in-app row is the safety net while Resend domain
//      verification is pending (per memory).
//
// Caller never awaits Resend success — dispatch returns once
// the in-app row exists. Email is best-effort.

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type DispatchLogInsert =
  Database["public"]["Tables"]["notification_dispatch_log"]["Insert"];

export interface DispatchPayload {
  category: NotificationCategory;
  /** Deterministic per-event id used for idempotency. Convention:
   *  "<category>.<entity>.<id>[.recipientSuffix]" so duplicate
   *  webhook re-fires + cron re-runs collapse to one row. */
  eventId: string;
  title: string;
  body?: string;
  linkPath?: string;
  /** practice_authorized_users.id — when relevant for portal
   *  surfaces (e.g. linking to /portal/training/modules under
   *  the cert holder's id). Optional. */
  practiceUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

// ------------------------------------------------------------
// Public — single-practice dispatch
// ------------------------------------------------------------
export async function dispatchToPractice(
  practiceId: string,
  payload: DispatchPayload,
): Promise<void> {
  await dispatchSingle({
    recipientType: "practice",
    practiceId,
    adminUserId: null,
    payload,
  });
}

// ------------------------------------------------------------
// Public — fan-out to every admin user
// ------------------------------------------------------------
// Resolves "all admins" as auth.users with
// app_metadata->>'role' = 'admin'. One notification record per
// admin. event_id is suffixed with the admin user id so the
// idempotency key is unique per recipient (the partial unique
// is on (admin_user_id, event_id)).
export async function dispatchToAdmins(
  payload: DispatchPayload,
): Promise<void> {
  const adminIds = await listAdminUserIds();
  if (adminIds.length === 0) return;

  await Promise.all(
    adminIds.map((adminUserId) =>
      dispatchSingle({
        recipientType: "admin",
        practiceId: null,
        adminUserId,
        payload,
      }),
    ),
  );
}

async function listAdminUserIds(): Promise<string[]> {
  const supabase = getServiceClient();
  // listUsers() returns paginated results — for early launch
  // (handful of admins) one page is fine. Document the
  // threshold so a future dev paginates when admin team grows
  // past 1000.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error || !data) return [];
  return data.users
    .filter(
      (u) =>
        (u.app_metadata as Record<string, unknown> | null)?.role === "admin",
    )
    .map((u) => u.id);
}

// ------------------------------------------------------------
// Private — single recipient dispatch
// ------------------------------------------------------------
interface SingleDispatchArgs {
  recipientType: "practice" | "admin";
  practiceId: string | null;
  adminUserId: string | null;
  payload: DispatchPayload;
}

async function dispatchSingle(args: SingleDispatchArgs): Promise<void> {
  const supabase = getServiceClient();

  // Insert notification — idempotent via partial unique index.
  const insert: NotificationInsert = {
    recipient_type: args.recipientType,
    practice_id: args.practiceId,
    admin_user_id: args.adminUserId,
    practice_user_id: args.payload.practiceUserId ?? null,
    category: args.payload.category,
    title: args.payload.title,
    body: args.payload.body ?? null,
    link_path: args.payload.linkPath ?? null,
    metadata: (args.payload.metadata ?? null) as never,
    event_id: args.payload.eventId,
  };

  const { data: notif, error: insertError } = await supabase
    .from("notifications")
    .insert(insert)
    .select("*")
    .single();

  // 23505 = unique violation = duplicate event id for this
  // recipient = idempotent no-op. Skip the rest of dispatch.
  if (insertError) {
    if (insertError.code === "23505") return;
    console.error("[notifications.dispatch] insert failed", {
      category: args.payload.category,
      event_id: args.payload.eventId,
      error: insertError.message,
    });
    return;
  }
  if (!notif) return;

  const notification = notif as NotificationRow;

  // Log in_app channel as sent (notifications table IS the in-
  // app channel — once the row exists, the bell will surface it).
  await logDispatch({
    notificationId: notification.id,
    channel: "in_app",
    status: "sent",
  });

  // Email evaluation — load preferences + quiet hours, decide.
  await maybeDispatchEmail(notification);
}

// ------------------------------------------------------------
// Email dispatch decision + send
// ------------------------------------------------------------
async function maybeDispatchEmail(notif: NotificationRow): Promise<void> {
  const supabase = getServiceClient();
  const category = notif.category as NotificationCategory;

  // Load preferences for the recipient.
  let preferences: Preferences | null = null;
  let quietStart: string | null = null;
  let quietEnd: string | null = null;
  let quietTz: string | null = null;
  {
    let q = supabase
      .from("notification_preferences")
      .select(
        "preferences, quiet_hours_start, quiet_hours_end, quiet_hours_timezone",
      )
      .eq("user_type", notif.recipient_type);
    if (notif.recipient_type === "practice" && notif.practice_id) {
      q = q.eq("practice_id", notif.practice_id);
    } else if (notif.recipient_type === "admin" && notif.admin_user_id) {
      q = q.eq("admin_user_id", notif.admin_user_id);
    }
    const { data } = await q.maybeSingle();
    if (data) {
      preferences = (data.preferences as Preferences | null) ?? null;
      quietStart = data.quiet_hours_start;
      quietEnd = data.quiet_hours_end;
      quietTz = data.quiet_hours_timezone;
    }
  }

  // Should we send email at all per category eligibility +
  // recipient preference?
  const wantEmail = shouldDispatchChannel({
    category,
    channel: "email",
    preferences,
  });
  if (!wantEmail) {
    await logDispatch({
      notificationId: notif.id,
      channel: "email",
      status: "skipped_preference",
    });
    return;
  }

  // Quiet hours — only suppress non-mandatory.
  if (!isMandatory(category)) {
    const inQuiet = isWithinQuietHours({
      now: new Date(),
      startTime: quietStart,
      endTime: quietEnd,
      timezone: quietTz,
    });
    if (inQuiet) {
      await logDispatch({
        notificationId: notif.id,
        channel: "email",
        status: "skipped_quiet_hours",
      });
      return;
    }
  }

  // Resolve recipient address.
  const toAddress = await resolveRecipientEmail(notif);
  if (!toAddress) {
    await logDispatch({
      notificationId: notif.id,
      channel: "email",
      status: "failed",
      errorMessage: "No recipient email address found",
    });
    return;
  }

  // Send via Resend (template selection inside).
  const result = await sendNotificationEmail({
    to: toAddress,
    notification: notif,
  });

  if (!result.ok) {
    await logDispatch({
      notificationId: notif.id,
      channel: "email",
      status: "failed",
      errorMessage: result.error,
    });
    return;
  }
  await logDispatch({
    notificationId: notif.id,
    channel: "email",
    status: "sent",
    resendMessageId: result.id ?? null,
  });
}

// ------------------------------------------------------------
// Recipient address resolution
// ------------------------------------------------------------
// Practice: practices.primary_email (Q3 — canonical contact).
// Admin: auth.users.email by id.
async function resolveRecipientEmail(
  notif: NotificationRow,
): Promise<string | null> {
  const supabase = getServiceClient();
  if (notif.recipient_type === "practice" && notif.practice_id) {
    const { data } = await supabase
      .from("practices")
      .select("primary_email")
      .eq("id", notif.practice_id)
      .single();
    return (data?.primary_email as string | undefined) ?? null;
  }
  if (notif.recipient_type === "admin" && notif.admin_user_id) {
    const { data } = await supabase.auth.admin.getUserById(notif.admin_user_id);
    return data.user?.email ?? null;
  }
  return null;
}

// ------------------------------------------------------------
// Dispatch log writes
// ------------------------------------------------------------
async function logDispatch(args: {
  notificationId: string;
  channel: "in_app" | "email";
  status: "sent" | "failed" | "skipped_preference" | "skipped_quiet_hours";
  resendMessageId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  const supabase = getServiceClient();
  const insert: DispatchLogInsert = {
    notification_id: args.notificationId,
    channel: args.channel,
    status: args.status,
    resend_message_id: args.resendMessageId ?? null,
    error_message: args.errorMessage ?? null,
  };
  const { error } = await supabase
    .from("notification_dispatch_log")
    .insert(insert);
  if (error) {
    console.error("[notifications.dispatch] log insert failed", {
      notification_id: args.notificationId,
      channel: args.channel,
      status: args.status,
      error: error.message,
    });
  }
}

// ------------------------------------------------------------
// Cross-practice fan-out helpers (used by Sanity webhook + cron)
// ------------------------------------------------------------

/** All practices that have logged at least one treatment with
 *  the given protocol. */
export async function listPracticesForProtocolUsage(
  protocolId: string,
): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("treatments")
    .select("practice_id")
    .eq("protocol_id", protocolId);
  const set = new Set<string>();
  for (const r of (data ?? []) as Array<{ practice_id: string }>) {
    set.add(r.practice_id);
  }
  return Array.from(set);
}

/** All practices that own the given device. */
export async function listPracticesForDeviceOwnership(
  deviceId: string,
): Promise<string[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("practice_devices")
    .select("practice_id")
    .eq("device_id", deviceId);
  return ((data ?? []) as Array<{ practice_id: string }>).map(
    (r) => r.practice_id,
  );
}
