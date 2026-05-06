// Sentry browser-side init.
// Loaded by Next.js automatically during page hydration.
// Disabled gracefully when SENTRY_DSN is missing (e.g. local dev).

import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Capture replays for 10% of all sessions, plus 100% of sessions with an
    // error. Replays redact text/inputs by default — see CLAUDE.md HIPAA
    // posture: no PHI in logs, no PHI in error tracking.
    replaysSessionSampleRate: 0.0, // off by default; enable per-need
    replaysOnErrorSampleRate: 0.0, // off — too risky for clinical data
    // Don't capture URL search params or breadcrumbs that might contain
    // PHI. Filter aggressively. P12.5 should review this once we see real
    // event volume.
    sendDefaultPii: false,
  });
}
