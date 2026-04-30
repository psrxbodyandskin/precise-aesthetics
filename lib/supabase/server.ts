import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  // Don't throw at import time so build can succeed without keys; throw on use.
}

export function getServiceClient() {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service client misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
