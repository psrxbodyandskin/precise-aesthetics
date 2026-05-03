import { NextResponse, type NextRequest } from "next/server";
import { getAuthServerClient } from "@/lib/supabase/server-auth";

// POST /api/auth/logout — clears the Supabase session cookies and
// redirects to the surface-appropriate login. Surface determined by the
// `surface` query/body param; defaults to "portal".
//
// Per ambiguity E: practice users → /portal/login, admin → /admin/login.
// Never to the marketing site.
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const surface = url.searchParams.get("surface");
  const target =
    surface === "admin" ? "/admin/login" : "/portal/login";

  const supabase = await getAuthServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(target, url.origin), {
    status: 303, // See Other — converts the POST into a GET on redirect
  });
}
