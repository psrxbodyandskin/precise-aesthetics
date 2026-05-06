// Sentry Node.js server runtime init.
// Captures errors in /api routes, server components, server actions.

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Server side never captures replays.
    sendDefaultPii: false,
    // Don't send default integrations that might leak request bodies.
    // Specifically: Http integration captures request data; we keep it
    // but rely on sendDefaultPii=false to redact headers/cookies/params.
  });
}
