// Centralized PostHog event names so client + server stay in sync.
export const EVENTS = {
  LEAD_FORM_VIEWED: "lead_form_viewed",
  LEAD_FORM_SUBMITTED: "lead_form_submitted",
  LEAD_FORM_SUCCEEDED: "lead_form_succeeded",
  LEAD_FORM_FAILED: "lead_form_failed",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
