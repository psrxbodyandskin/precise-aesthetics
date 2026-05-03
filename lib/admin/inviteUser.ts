import "server-only";
import { getServiceClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/constants";

// Auth-admin helpers used by /api/admin/practices/* routes.
//
// IMPORTANT — Supabase project Site URL gotcha (see CLAUDE.md):
// `redirectTo` passed to generateLink/inviteUserByEmail/resetPasswordForEmail
// is silently overridden by the project's Site URL setting in the Supabase
// dashboard. Before any production invite/reset flow works, the Site URL
// MUST be set to https://preciseaesthetics.com.

interface CreatePracticeAuthUserArgs {
  email: string;
}

interface CreatePracticeAuthUserResult {
  status: "ok";
  authUserId: string;
}

interface CreatePracticeAuthUserError {
  status: "error";
  message: string;
  code?: "email_exists" | "unknown";
}

// Step 1 of provisioning: create the Supabase Auth user with role=practice
// in app_metadata. We DON'T set practice_id yet because the practices row
// hasn't been inserted (chicken-and-egg). practice_id is patched in a
// follow-up call (`setPracticeIdClaim`) once the practice record exists.
//
// We use admin.createUser with a temporary random password and
// `email_confirm: true`. The actual sign-in path is the invite flow:
// generateLink({type:'invite'}) → email → user clicks → sets password →
// signs in. The temp password is unreachable.
export async function createPracticeAuthUser({
  email,
}: CreatePracticeAuthUserArgs): Promise<
  CreatePracticeAuthUserResult | CreatePracticeAuthUserError
> {
  const supabase = getServiceClient();

  const tempPassword = crypto.randomUUID() + crypto.randomUUID(); // 72 char throwaway
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    app_metadata: { role: "practice" },
  });

  if (error || !data.user) {
    const isExists = /already registered|already.*exist/i.test(error?.message ?? "");
    return {
      status: "error",
      message: error?.message ?? "Could not create auth user",
      code: isExists ? "email_exists" : "unknown",
    };
  }
  return { status: "ok", authUserId: data.user.id };
}

// Step 2 of provisioning: now that the practices row exists, patch the
// auth user's app_metadata with practice_id. This is the JWT claim that
// drives `current_practice_id()` and every Class A RLS policy in P3+.
export async function setPracticeIdClaim(
  authUserId: string,
  practiceId: string,
): Promise<{ status: "ok" } | { status: "error"; message: string }> {
  const supabase = getServiceClient();
  const { error } = await supabase.auth.admin.updateUserById(authUserId, {
    app_metadata: {
      role: "practice",
      practice_id: practiceId,
    },
  });
  if (error) return { status: "error", message: error.message };
  return { status: "ok" };
}

// Generate the one-time invite link the practice will click. Pass the
// resulting `action_link` to PracticeInviteEmail as the CTA href.
//
// Caveat: if Supabase Site URL isn't set to production, the returned
// link uses whatever the dashboard says. See CLAUDE.md gotcha.
export async function generateInviteLink(
  email: string,
): Promise<{ status: "ok"; link: string } | { status: "error"; message: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${SITE.url}/portal/reset-password/confirm`,
    },
  });
  if (error || !data?.properties?.action_link) {
    return { status: "error", message: error?.message ?? "No action_link returned" };
  }
  return { status: "ok", link: data.properties.action_link };
}

// Generate a password recovery link for the "Force password reset" admin
// action. Same Site URL caveat applies.
export async function generateRecoveryLink(
  email: string,
): Promise<{ status: "ok"; link: string } | { status: "error"; message: string }> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${SITE.url}/portal/reset-password/confirm`,
    },
  });
  if (error || !data?.properties?.action_link) {
    return { status: "error", message: error?.message ?? "No action_link returned" };
  }
  return { status: "ok", link: data.properties.action_link };
}
