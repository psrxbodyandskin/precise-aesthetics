import { NextResponse, type NextRequest } from "next/server";
import { getAuthServerClient } from "@/lib/supabase/server-auth";

// Single auth callback for all Supabase email-link flows: magic-link
// sign-in, invite acceptance, OAuth (if added later), and email-change
// confirmation. Recovery (password reset) lands directly on the
// `/[surface]/reset-password/confirm` page since it needs interactive UI.
//
// Supabase puts the auth code in `?code=` on the redirect URL; we
// exchange it for a session via the server client (which writes the
// session cookies via the cookie adapter).
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextRaw = url.searchParams.get("next") ?? "/portal";

  // Open-redirect protection: only allow same-host relative paths
  // starting with `/portal` or `/admin`. Falls back to /portal for
  // any other input.
  const next =
    nextRaw.startsWith("/portal") || nextRaw.startsWith("/admin")
      ? nextRaw
      : "/portal";

  if (!code) {
    // No code → couldn't verify the user; bounce to portal login.
    return NextResponse.redirect(new URL("/portal/login", url.origin));
  }

  const supabase = await getAuthServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/portal/login?auth_error=1", url.origin),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
