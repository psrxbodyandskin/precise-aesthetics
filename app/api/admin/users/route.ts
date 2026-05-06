import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth/server";
import { getServiceClient } from "@/lib/supabase/server";

// P13 — list admin users.
//
// Used by the stack-reference detail page's "Account owner" picker.
// Reusable elsewhere (any admin picker that needs to attribute
// something to a specific admin user — future protocol-owner
// fields, etc.).
//
// Query: GET /api/admin/users?role=admin
//
// Returns minimal shape: id + email + display_name + role.
// Never includes app_metadata other than role; never includes
// password hashes or session info.

export const runtime = "nodejs";

interface AdminUserSummary {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
}

export async function GET(req: NextRequest) {
  await requireAdmin();

  const sp = req.nextUrl.searchParams;
  const role = sp.get("role") ?? "admin";
  if (role !== "admin" && role !== "practice") {
    return NextResponse.json(
      { ok: false, error: "Invalid role filter" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();
  // Supabase admin API: list all users, filter app_metadata.role.
  // Pagination: 1000 page size is the API default; in practice we
  // have a handful of admin users — single page is fine.
  const { data, error } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const filtered: AdminUserSummary[] = data.users
    .filter((u) => (u.app_metadata as Record<string, unknown>)?.role === role)
    .map((u) => ({
      id: u.id,
      email: u.email ?? "",
      display_name:
        ((u.user_metadata as Record<string, unknown>)?.full_name as
          | string
          | null) ?? null,
      role,
    }))
    .sort((a, b) => a.email.localeCompare(b.email));

  return NextResponse.json({ ok: true, users: filtered });
}
