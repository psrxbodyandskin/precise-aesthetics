import { NextResponse, type NextRequest } from "next/server";

import { requirePractice } from "@/lib/auth/server";
import { getPracticeForAuthUser } from "@/lib/portal/setup";
import { authorizedUserCreateSchema } from "@/lib/schemas/treatment";
import {
  createAuthorizedUser,
  deactivateAuthorizedUser,
  listAuthorizedUsers,
} from "@/lib/portal/practice-users";
import { logAudit } from "@/lib/admin/audit";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

// GET — list active + inactive authorized users for the caller's practice
export async function GET() {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice not found" },
      { status: 404 },
    );
  }
  const users = await listAuthorizedUsers(practice.id);
  return NextResponse.json({ ok: true, users });
}

// POST — add a new authorized user
export async function POST(req: NextRequest) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice not found" },
      { status: 404 },
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

  const parsed = authorizedUserCreateSchema.safeParse(json);
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

  const result = await createAuthorizedUser(practice.id, {
    fullName: parsed.data.fullName,
    roleLabel: parsed.data.roleLabel ?? null,
  });
  if (result.status !== "ok") {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: "practice.authorized_user_added",
    targetType: "practice",
    targetId: practice.id,
    metadata: {
      authorized_user_id: result.id,
      name: parsed.data.fullName,
    },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true, id: result.id });
}

// DELETE /api/portal/practice-users?id=<uuid> — soft delete
export async function DELETE(req: NextRequest) {
  const user = await requirePractice();
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return NextResponse.json(
      { ok: false, error: "Practice not found" },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("id");
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json(
      { ok: false, error: "Invalid user id" },
      { status: 400 },
    );
  }

  const result = await deactivateAuthorizedUser(practice.id, userId);
  if (result.status !== "ok") {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 500 },
    );
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: "practice.authorized_user_deactivated",
    targetType: "practice",
    targetId: practice.id,
    metadata: { authorized_user_id: userId },
    ipAddress: getClientIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
