import { z } from "zod";

// P10 — Notifications schemas, category metadata, mute logic.
//
// Mandatory categories override user preferences AND quiet hours.
// They're enumerated explicitly so a future dev (or this dev,
// late at night) can't accidentally make a clinical-safety
// notification mutable by editing a JSON config.

// ------------------------------------------------------------
// Category enum
// ------------------------------------------------------------
export const NOTIFICATION_CATEGORIES = [
  // Practitioner-side
  "protocol.updated_for_used_protocol",
  "adverse_event.status_updated",
  "protocol.new_for_owned_device",
  "training.new_module_added",
  "training.certification_expiring",

  // Admin-side
  "adverse_event.new",
  "inbox.new_demo_request",
  "inbox.new_lead",
  "inbox.new_contact_message",
  "training.certification_completed",
  "practice.high_engagement",
] as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

// ------------------------------------------------------------
// Recipient + side
// ------------------------------------------------------------
export type NotificationRecipientType = "practice" | "admin";

export const PRACTICE_CATEGORIES: NotificationCategory[] = [
  "protocol.updated_for_used_protocol",
  "adverse_event.status_updated",
  "protocol.new_for_owned_device",
  "training.new_module_added",
  "training.certification_expiring",
];

export const ADMIN_CATEGORIES: NotificationCategory[] = [
  "adverse_event.new",
  "inbox.new_demo_request",
  "inbox.new_lead",
  "inbox.new_contact_message",
  "training.certification_completed",
  "practice.high_engagement",
];

// ------------------------------------------------------------
// Mandatory categories (cannot be muted, ignore quiet hours)
// ------------------------------------------------------------
export const MANDATORY_CATEGORIES: NotificationCategory[] = [
  "protocol.updated_for_used_protocol",
  "adverse_event.status_updated",
  "training.certification_expiring",
  "adverse_event.new",
];

export function isMandatory(category: NotificationCategory): boolean {
  return (MANDATORY_CATEGORIES as string[]).includes(category);
}

// ------------------------------------------------------------
// Email-eligible categories (which categories ever send email at all)
// ------------------------------------------------------------
// Categories not in this set never send email regardless of
// preference (e.g. inbox.new_lead is in-app only per spec).
export const EMAIL_ELIGIBLE_CATEGORIES: NotificationCategory[] = [
  "protocol.updated_for_used_protocol",
  "adverse_event.status_updated",
  "training.certification_expiring",
  "adverse_event.new",
  "inbox.new_demo_request",
  "inbox.new_contact_message",
];

export function isEmailEligible(category: NotificationCategory): boolean {
  return (EMAIL_ELIGIBLE_CATEGORIES as string[]).includes(category);
}

// ------------------------------------------------------------
// Display metadata (UI labels for bell + preferences forms)
// ------------------------------------------------------------
export interface CategoryMeta {
  label: string;
  description: string;
  side: NotificationRecipientType;
  group: "clinical" | "library" | "inbox" | "operations";
}

export const CATEGORY_META: Record<NotificationCategory, CategoryMeta> = {
  // Practitioner — clinical (mandatory)
  "protocol.updated_for_used_protocol": {
    label: "Protocol you've used was updated",
    description:
      "A protocol your practice has logged treatments with was republished. Review the changes before logging again.",
    side: "practice",
    group: "clinical",
  },
  "adverse_event.status_updated": {
    label: "Adverse event status changed",
    description:
      "An adverse event your practice reported was reviewed by clinical staff.",
    side: "practice",
    group: "clinical",
  },
  "training.certification_expiring": {
    label: "Certification expiring",
    description:
      "A certification you hold is approaching its expiry date. Re-train to keep treatment-logging access.",
    side: "practice",
    group: "clinical",
  },

  // Practitioner — library (mutable)
  "protocol.new_for_owned_device": {
    label: "New protocol for your device",
    description:
      "A new protocol was published for a device your practice owns.",
    side: "practice",
    group: "library",
  },
  "training.new_module_added": {
    label: "New training module added",
    description:
      "A new module was added to a training curriculum for one of your devices.",
    side: "practice",
    group: "library",
  },

  // Admin — clinical (mandatory)
  "adverse_event.new": {
    label: "New adverse event submitted",
    description:
      "A practitioner reported an adverse event with a treatment log.",
    side: "admin",
    group: "clinical",
  },

  // Admin — inbox (mutable)
  "inbox.new_demo_request": {
    label: "New demo request",
    description: "Someone submitted the demo request form.",
    side: "admin",
    group: "inbox",
  },
  "inbox.new_lead": {
    label: "New homepage lead",
    description: "A new email subscribed via the homepage capture.",
    side: "admin",
    group: "inbox",
  },
  "inbox.new_contact_message": {
    label: "New contact message",
    description: "Someone submitted the contact form.",
    side: "admin",
    group: "inbox",
  },

  // Admin — operations (mutable)
  "training.certification_completed": {
    label: "Certification completed",
    description: "A practitioner completed their training and self-certified.",
    side: "admin",
    group: "operations",
  },
  "practice.high_engagement": {
    label: "Practice engagement signal",
    description:
      "A practice crossed an engagement threshold (treatment volume, training completion).",
    side: "admin",
    group: "operations",
  },
};

// ------------------------------------------------------------
// Preferences shape
// ------------------------------------------------------------
// Stored in notification_preferences.preferences (jsonb):
//   { "category.name": { "in_app": bool, "email": bool }, ... }
//
// Missing keys default to TRUE on both channels at the dispatch
// layer (opt-out, not opt-in — practitioners shouldn't have to
// flip switches to start receiving things).
export const categoryToggleSchema = z.object({
  in_app: z.boolean(),
  email: z.boolean(),
});

export type CategoryToggle = z.infer<typeof categoryToggleSchema>;

export const preferencesSchema = z.record(
  z.enum(NOTIFICATION_CATEGORIES),
  categoryToggleSchema,
);

export type Preferences = z.infer<typeof preferencesSchema>;

// Quiet hours
export const quietHoursSchema = z.object({
  enabled: z.boolean(),
  // 24h "HH:MM" — Postgres stores as `time` (no date component).
  start: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format.")
    .optional()
    .or(z.literal("")),
  end: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format.")
    .optional()
    .or(z.literal("")),
  // IANA timezone string. Default 'America/Chicago' lives in DB.
  timezone: z.string().min(1).max(120).optional(),
});

export type QuietHoursValues = z.infer<typeof quietHoursSchema>;

// Full preferences PATCH body — partial updates allowed.
export const preferencesUpdateSchema = z.object({
  preferences: preferencesSchema.optional(),
  quietHours: quietHoursSchema.optional(),
});

export type PreferencesUpdateValues = z.infer<typeof preferencesUpdateSchema>;

// ------------------------------------------------------------
// Mute resolution
// ------------------------------------------------------------
// Returns whether a channel should fire for a category given the
// recipient's stored preferences. Mandatory categories always
// return true regardless of preference. Missing entries default
// to true (opt-in by default).
export function shouldDispatchChannel(args: {
  category: NotificationCategory;
  channel: "in_app" | "email";
  preferences: Preferences | null;
}): boolean {
  // Mandatory always fires.
  if (isMandatory(args.category)) return true;

  // Email channel is gated on category-eligibility first —
  // some categories never send email regardless of pref.
  if (args.channel === "email" && !isEmailEligible(args.category)) {
    return false;
  }

  const entry = args.preferences?.[args.category];
  if (!entry) return true; // default opt-in
  return entry[args.channel];
}

// ------------------------------------------------------------
// Quiet hours check — caller passes "now" so tests can pin time.
// Mandatory categories ignore quiet hours; non-mandatory email
// is suppressed during the window. In-app fires regardless.
// ------------------------------------------------------------
export function isWithinQuietHours(args: {
  now: Date;
  startTime: string | null; // "HH:MM:SS" from Postgres
  endTime: string | null;
  timezone: string | null;
}): boolean {
  if (!args.startTime || !args.endTime) return false;

  // Compute "now" in the recipient's timezone as HH:MM.
  let hours = 0;
  let minutes = 0;
  try {
    const tz = args.timezone ?? "America/Chicago";
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = fmt.formatToParts(args.now);
    hours = Number.parseInt(
      parts.find((p) => p.type === "hour")?.value ?? "0",
      10,
    );
    minutes = Number.parseInt(
      parts.find((p) => p.type === "minute")?.value ?? "0",
      10,
    );
    // Intl returns "24" for midnight on some platforms — clamp.
    if (hours === 24) hours = 0;
  } catch {
    return false;
  }
  const nowMinutes = hours * 60 + minutes;

  // Parse "HH:MM" (or "HH:MM:SS") to minutes-of-day.
  const parseHM = (s: string): number | null => {
    const m = /^(\d{2}):(\d{2})/.exec(s);
    if (!m) return null;
    return Number.parseInt(m[1]!, 10) * 60 + Number.parseInt(m[2]!, 10);
  };
  const startMin = parseHM(args.startTime);
  const endMin = parseHM(args.endTime);
  if (startMin === null || endMin === null) return false;

  // Window can wrap midnight (start > end means cross-day).
  if (startMin <= endMin) {
    return nowMinutes >= startMin && nowMinutes < endMin;
  }
  return nowMinutes >= startMin || nowMinutes < endMin;
}
