import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

type CookieSet = { name: string; value: string; options?: CookieOptions };

// SSR-aware Supabase client for Server Components, Route Handlers, and
// Server Actions. Reads/writes auth session cookies through Next.js's
// request-scoped cookie store. Use this when you need to read the
// authenticated user or their role server-side.
//
// Distinct from `getServiceClient()` (which uses the service-role key and
// bypasses RLS — used only by trusted backend writes from /api/* routes).
export async function getAuthServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase auth server client misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // Server Components cannot set cookies. The middleware refreshes
          // sessions for every request, so this is non-fatal here. Setting
          // cookies in Server Actions and Route Handlers works normally.
        }
      },
    },
  });
}
