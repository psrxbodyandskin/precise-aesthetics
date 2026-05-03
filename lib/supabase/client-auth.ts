"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Browser Supabase client wired to the SSR cookie scheme. Use this from
// Client Components for actions that need the authenticated user's session
// (e.g., signing in via password or magic link, signing out).
//
// Distinct from `getBrowserClient()` (which is the plain anon client used
// by marketing-side public form posts that don't need a session).
export function getAuthBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase auth browser client misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
