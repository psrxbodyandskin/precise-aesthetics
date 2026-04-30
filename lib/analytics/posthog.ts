import posthog from "posthog-js";

export function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identify(distinctId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(distinctId, traits);
}
