import "server-only";
import { redirect } from "next/navigation";
import { getAuthServerClient } from "@/lib/supabase/server-auth";
import { isRole, type AuthUser, type Role } from "./types";

// Returns the currently-authenticated user as an `AuthUser` summary, or
// null if no session. Reads role from `app_metadata.role` (the only
// trustworthy place — see lib/auth/types.ts).
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await getAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const rawRole = user.app_metadata?.role;
  const rawPracticeId = user.app_metadata?.practice_id;

  return {
    id: user.id,
    email: user.email ?? null,
    role: isRole(rawRole) ? rawRole : null,
    practiceId: typeof rawPracticeId === "string" ? rawPracticeId : null,
  };
}

// Redirects to the given login surface if there's no session.
// Returns the user otherwise.
export async function requireUser(loginPath: "/portal/login" | "/admin/login"): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath);
  return user;
}

// Practice-only guard. Used in /portal/* layouts and routes.
// Redirects to /portal/login if unauth; redirects to /admin if logged in
// as the wrong role (per ambiguity A: strict separation).
export async function requirePractice(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  if (user.role !== "practice") redirect("/admin");
  return user;
}

// Admin-only guard. Used in /admin/* layouts and routes.
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "admin") redirect("/portal");
  return user;
}

// Convenience — re-export the Role type for downstream imports.
export type { Role };
