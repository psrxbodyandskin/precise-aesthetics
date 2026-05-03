"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { requirePractice } from "@/lib/auth/server";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { logAudit } from "@/lib/admin/audit";
import {
  setupPasswordSchema,
  setupProfileSchema,
  setupAuthorizedUsersSchema,
} from "@/lib/schemas/setup-wizard";
import {
  finalizePracticeSetup,
  getPracticeForAuthUser,
  replaceAuthorizedUsers,
  updatePracticeProfile,
} from "@/lib/portal/setup";

// Server actions that drive each persisted step of the setup wizard.
// Contract: every step writes to its real destination on submit, so a
// browser close mid-wizard is recoverable on next sign-in. Step 7
// (finalize) is the only one that flips practices.status.
//
// Every action begins with requirePractice() to confirm the caller is
// authenticated as a practice user — this also guards against admins
// hitting these endpoints directly.

type ActionResult =
  | { status: "ok"; redirectTo?: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip");
}

// ------------------------------------------------------------
// Step 2 — set password
// ------------------------------------------------------------
export async function setPasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePractice();

  const parsed = setupPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: "error",
      message: issue?.message ?? "Invalid password.",
      fieldErrors: parsed.error.issues.reduce<Record<string, string>>(
        (acc, i) => {
          const k = i.path.join(".") || "_";
          if (!acc[k]) acc[k] = i.message;
          return acc;
        },
        {},
      ),
    };
  }

  const supabase = await getAuthServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  // Find the practice row to log against
  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (practice) {
    await logAudit({
      actorId: user.id,
      actorRole: "practice",
      action: "practice.setup.password_set",
      targetType: "practice",
      targetId: practice.id,
      ipAddress: (await getClientIp()) ?? undefined,
    });
  }

  revalidatePath("/portal/setup");
  return { status: "ok", redirectTo: "/portal/setup/profile" };
}

// ------------------------------------------------------------
// Step 3 — confirm practice profile
// ------------------------------------------------------------
export async function setProfileAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePractice();

  const parsed = setupProfileSchema.safeParse({
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    city: formData.get("city"),
    state: formData.get("state") || null,
    postalCode: formData.get("postalCode"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid profile.",
    };
  }

  const { data: practice, error: lookupError } =
    await getPracticeForAuthUser(user.id);
  if (lookupError || !practice) {
    return {
      status: "error",
      message: "Could not find your practice record.",
    };
  }

  const { error } = await updatePracticeProfile(practice.id, parsed.data);
  if (error) {
    return { status: "error", message: error.message };
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: "practice.setup.profile_updated",
    targetType: "practice",
    targetId: practice.id,
    ipAddress: (await getClientIp()) ?? undefined,
  });

  revalidatePath("/portal/setup");
  return { status: "ok", redirectTo: "/portal/setup/users" };
}

// ------------------------------------------------------------
// Step 4 — authorized users
// ------------------------------------------------------------
export async function setAuthorizedUsersAction(
  formData: FormData,
): Promise<ActionResult> {
  const user = await requirePractice();

  // Form submits arrays as `users[0].fullName`, `users[0].roleLabel`, etc.
  // Walk the entries and reassemble.
  const userRows: Record<number, { fullName?: string; roleLabel?: string }> = {};
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^users\[(\d+)\]\.(fullName|roleLabel)$/);
    if (!match) continue;
    const idx = Number(match[1]);
    const field = match[2] as "fullName" | "roleLabel";
    if (!userRows[idx]) userRows[idx] = {};
    userRows[idx][field] = String(value);
  }

  const orderedRows = Object.keys(userRows)
    .map((k) => Number(k))
    .sort((a, b) => a - b)
    .map((i) => userRows[i]!)
    .map((r) => ({
      fullName: (r.fullName ?? "").trim(),
      roleLabel: (r.roleLabel ?? "").trim(),
    }))
    .filter((r) => r.fullName.length > 0);

  const parsed = setupAuthorizedUsersSchema.safeParse({ users: orderedRows });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid users.",
    };
  }

  const { data: practice } = await getPracticeForAuthUser(user.id);
  if (!practice) {
    return {
      status: "error",
      message: "Could not find your practice record.",
    };
  }

  const result = await replaceAuthorizedUsers(practice.id, parsed.data.users);
  if (result.status !== "ok") {
    return { status: "error", message: result.message };
  }

  await logAudit({
    actorId: user.id,
    actorRole: "practice",
    action: "practice.setup.authorized_users_saved",
    targetType: "practice",
    targetId: practice.id,
    metadata: { count: result.count },
    ipAddress: (await getClientIp()) ?? undefined,
  });

  revalidatePath("/portal/setup");
  return { status: "ok", redirectTo: "/portal/setup/devices" };
}

// ------------------------------------------------------------
// Step 5 — confirm devices (no DB write; just navigation)
// ------------------------------------------------------------
export async function confirmDevicesAction(): Promise<ActionResult> {
  await requirePractice();
  return { status: "ok", redirectTo: "/portal/setup/tour" };
}

// ------------------------------------------------------------
// Step 6 — tour complete (no DB write; just navigation)
// ------------------------------------------------------------
export async function tourCompleteAction(): Promise<ActionResult> {
  await requirePractice();
  return { status: "ok", redirectTo: "/portal/setup/done" };
}

// ------------------------------------------------------------
// Step 7 — finalize (flip status to active, redirect to /portal)
// ------------------------------------------------------------
export async function finalizeSetupAction(): Promise<void> {
  const user = await requirePractice();

  const { data: practice, error: lookupError } =
    await getPracticeForAuthUser(user.id);
  if (lookupError || !practice) {
    redirect("/portal/login?finalize_error=missing");
  }

  // Idempotent: only flips if currently 'pending'.
  if (practice.status === "pending") {
    const { error } = await finalizePracticeSetup(practice.id, user.id);
    if (error) {
      // No real way to surface this except logging — the flip is a one-row
      // update against a known id. Bounce through with an audit miss.
      console.error("[setup] finalize failed", error);
    } else {
      await logAudit({
        actorId: user.id,
        actorRole: "practice",
        action: "practice.setup.completed",
        targetType: "practice",
        targetId: practice.id,
        ipAddress: (await getClientIp()) ?? undefined,
      });
    }
  }

  revalidatePath("/portal");
  redirect("/portal");
}
