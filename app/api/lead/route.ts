import { NextResponse } from "next/server";
import { leadFormSchema } from "@/lib/schemas/lead-form";
import { upsertLead } from "@/lib/supabase/leads";
import {
  sendLeadWelcome,
  sendInternalLeadNotification,
} from "@/lib/resend/send";
import { captureServer } from "@/lib/analytics/posthog-server";
import { EVENTS } from "@/lib/analytics/events";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit({
    key: `lead:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000)).toString(),
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = leadFormSchema.safeParse(json);
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

  // Stage 1: persist
  const result = await upsertLead(values);
  if (result.status === "error") {
    await captureServer(values.email, EVENTS.LEAD_FORM_FAILED, {
      stage: "supabase",
      error: result.message,
      source: values.source,
    });
    return NextResponse.json(
      { ok: false, error: "We could not save your submission. Please try again." },
      { status: 500 },
    );
  }

  // Stage 2 + 3: emails (welcome + internal notify) — non-blocking on partial failure.
  // Each runs independently so a transient Resend error on one does not nuke the other.
  const submittedAt = new Date().toISOString();
  const [welcomeRes, internalRes] = await Promise.all([
    sendLeadWelcome({
      to: values.email,
      firstName: values.firstName,
      interest: values.interest,
    }),
    sendInternalLeadNotification({
      values,
      status: result.status,
      submittedAt,
    }),
  ]);

  // Stage 4: analytics
  await captureServer(values.email, EVENTS.LEAD_FORM_SUCCEEDED, {
    status: result.status,
    leadId: result.id,
    interest: values.interest,
    role: values.role,
    source: values.source,
    welcomeEmailOk: welcomeRes.ok,
    internalEmailOk: internalRes.ok,
    utm_source: values.utm?.source,
    utm_medium: values.utm?.medium,
    utm_campaign: values.utm?.campaign,
  });

  return NextResponse.json({
    ok: true,
    status: result.status,
    emails: {
      welcome: welcomeRes.ok,
      internal: internalRes.ok,
    },
  });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
