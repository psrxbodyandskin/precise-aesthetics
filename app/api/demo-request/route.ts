import { NextResponse } from "next/server";
import { demoRequestSchema } from "@/lib/schemas/demo-request";
import { insertDemoRequest } from "@/lib/supabase/demo-requests";
import {
  sendDemoConfirmation,
  sendInternalDemoNotification,
} from "@/lib/resend/send";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit({
    key: `demo:${ip}`,
    limit: 5,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again in a minute." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.max(
            1,
            Math.ceil((limit.resetAt - Date.now()) / 1000),
          ).toString(),
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

  const parsed = demoRequestSchema.safeParse(json);
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

  const result = await insertDemoRequest(values);
  if (result.status === "error") {
    return NextResponse.json(
      { ok: false, error: "We could not save your request. Please try again." },
      { status: 500 },
    );
  }

  const submittedAt = new Date().toISOString();
  const [confirmRes, internalRes] = await Promise.all([
    sendDemoConfirmation({ to: values.email, firstName: values.firstName }),
    sendInternalDemoNotification({ values, submittedAt }),
  ]);

  return NextResponse.json({
    ok: true,
    id: result.id,
    emails: {
      confirmation: confirmRes.ok,
      internal: internalRes.ok,
    },
  });
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}
