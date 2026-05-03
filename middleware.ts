import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware-client";
import { isRole } from "@/lib/auth/types";

// Auth middleware. Two responsibilities:
//
// 1. Refresh the Supabase auth session cookie on every request that
//    matches the matcher (Supabase access tokens are short-lived; without
//    refresh, sessions silently expire mid-flow).
//
// 2. Gate the /portal/* and /admin/* surfaces by role. Unauth → redirect
//    to the surface's own login. Wrong role → redirect to the user's own
//    surface (per ambiguity A: strict separation, no cross-surface UI).
//
// Excluded from the matcher:
// - login, reset-password, callback routes (must be reachable while
//   unauthenticated)
// - /api/auth/* (handled by their own route handlers)
// - static assets, favicon, og images, sitemap

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareSupabase(request, response);

  // Always refresh the session, even on public routes within the matcher,
  // so a returning user with an expired access token gets a refreshed
  // session before reaching protected pages.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPortalRoute = path.startsWith("/portal");
  const isAdminRoute = path.startsWith("/admin");

  // Public auth routes within the protected surfaces — login, reset, etc.
  // Must remain reachable without a session.
  const isPublicAuthRoute =
    path === "/portal/login" ||
    path === "/portal/reset-password" ||
    path === "/portal/reset-password/confirm" ||
    path === "/admin/login" ||
    path === "/admin/reset-password" ||
    path === "/admin/reset-password/confirm";

  if (isPublicAuthRoute) {
    return response;
  }

  // Unauthenticated visitor on a protected portal/admin route → bounce to
  // the surface's own login.
  if (!user && (isPortalRoute || isAdminRoute)) {
    const loginPath = isAdminRoute ? "/admin/login" : "/portal/login";
    const loginUrl = new URL(loginPath, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated visitor on the wrong surface → redirect to their own
  // surface index. Strict separation per ambiguity A.
  if (user) {
    const role = user.app_metadata?.role;
    const validRole = isRole(role) ? role : null;

    if (isPortalRoute && validRole !== "practice") {
      const target = validRole === "admin" ? "/admin" : "/portal/login";
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (isAdminRoute && validRole !== "admin") {
      const target = validRole === "practice" ? "/portal" : "/admin/login";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - _next/static (build assets)
     * - _next/image (image optimizer)
     * - favicon, icon, apple-icon, manifest, robots, sitemap, og
     * - /api/auth/* (own route handlers manage their own session)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|apple-icon\\.png|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|og|api/auth).*)",
  ],
};
