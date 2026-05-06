import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";

// P12 — Sentry test endpoint.
//
// Admin-only. Hitting this throws a synthetic error that Sentry's
// server-side SDK should capture. Use it to verify wiring after
// SENTRY_DSN lands in Vercel:
//
//   1. Sign in as admin
//   2. Visit /api/admin/sentry-test
//   3. Confirm a new Issue appears in your Sentry project within ~30s
//
// Once verified, leave this in place — it's tiny, admin-gated, and
// useful for the launch-day smoke test in LAUNCH-RUNBOOK.md.

export const runtime = "nodejs";

export async function GET() {
  await requireAdmin();
  // Synthetic error — distinctive name so it's easy to spot in Sentry.
  throw new Error("PA_SENTRY_VERIFICATION_PROBE — if you see this in Sentry, wiring works.");
  // Unreachable, but TS needs the return type.
  return NextResponse.json({ ok: false });
}
