import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getClientIp } from "@/lib/rate-limit";
import { addEnvVar, listEnvVarsForService } from "@/lib/admin/stack";
import { stackEnvVarCreateSchema } from "@/lib/schemas/stack";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  await requireAdmin();
  const { id } = await params;
  const result = await listEnvVarsForService(id);
  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, envVars: result.data });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin();
  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // CRITICAL — defense-in-depth: reject any payload containing a
  // `value` field even before Zod parses. The schema is .strict()
  // and would reject too, but this gives a clearer 400 error and
  // ensures we never accidentally log a value to debug output.
  if (json && typeof json === "object" && "value" in json) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Refusing request: this endpoint never accepts secret values. The stack reference indexes names + locations only.",
      },
      { status: 400 },
    );
  }

  const parsed = stackEnvVarCreateSchema.safeParse(json);
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

  const result = await addEnvVar(id, parsed.data, {
    actorId: admin.id,
    ipAddress: getClientIp(req.headers),
  });
  if (result.error || !result.id) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Insert failed" },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: result.id });
}
