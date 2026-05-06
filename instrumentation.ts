// Next.js instrumentation entry — required by @sentry/nextjs to
// register the runtime configs at boot. Next 16+ calls this file's
// `register()` function automatically on cold start, once per
// runtime (nodejs / edge).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Re-export Sentry's request-error hook under the name Next.js
// expects (`onRequestError`). Sentry 10.x exports it as
// `captureRequestError`. No-op if SENTRY_DSN isn't set.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
