import "server-only";
import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getClient(): PostHog | null {
  if (client) return client;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key || key.startsWith("phc_placeholder")) return null;

  client = new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export async function captureServer(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const c = getClient();
  if (!c) return;
  c.capture({ distinctId, event, properties });
  // In serverless contexts, flush so the event lands before the function exits.
  try {
    await c.flush();
  } catch {
    // Best-effort; never let analytics break the request.
  }
}
