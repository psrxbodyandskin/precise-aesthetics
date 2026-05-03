// Canonical role values stored in Supabase Auth `app_metadata.role`.
//
// IMPORTANT: roles MUST live in `app_metadata` (admin-only writable),
// NEVER in `user_metadata` (user-editable, unsafe for authorization).
// Setting role in user_metadata would allow any authenticated user to
// promote themselves to admin via the standard auth update endpoint.
export const ROLES = ["practice", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

// Lightweight summary of the authenticated user used by server helpers
// and downstream layouts. Subset of Supabase's User shape.
export interface AuthUser {
  id: string;
  email: string | null;
  role: Role | null;
  // practice_id is added in Session P2 once the practices table exists.
  // Reading it now will return null until the JWT claim is populated.
  practiceId: string | null;
}
