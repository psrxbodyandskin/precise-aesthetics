// One-shot admin provisioning script.
//
// Creates (or updates if already present) two admin accounts with
// app_metadata.role = "admin" and email_confirm = true so they can
// sign in immediately at /admin/login.
//
// USAGE
//   npx tsx scripts/provision-admin-users.ts
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local.
// Outputs the generated temp passwords once. Operator copies them,
// shares with Roni, and each admin signs in + uses
// /admin/settings/account to set their own permanent password.
//
// Idempotent: re-running on an existing user updates app_metadata
// + resets the password (so a re-run after losing the temp pwd
// is a recovery path).

import { createClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { randomBytes } from "node:crypto";

dotenvConfig({ path: ".env.local" });

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const ADMINS = [
  { email: "mypreciseaesthetics@gmail.com", label: "Brian" },
  { email: "roni@psrxbodyandskin.com", label: "Roni" },
] as const;

// 16-char password using the URL-safe-ish base64 alphabet.
function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n=== Provisioning admin accounts ===\n");

  const results: Array<{ email: string; password: string; status: string }> = [];

  for (const admin of ADMINS) {
    const tempPassword = generateTempPassword();

    // List existing users to check for a match. Pagination caps at
    // 1000 per page; production has nowhere near that.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers(
      { perPage: 1000 },
    );
    if (listError) {
      console.error(`[${admin.email}] listUsers failed:`, listError.message);
      continue;
    }
    const existing = list.users.find(
      (u) => u.email?.toLowerCase() === admin.email.toLowerCase(),
    );

    if (existing) {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        password: tempPassword,
        email_confirm: true,
        app_metadata: { ...existing.app_metadata, role: "admin" },
      });
      if (error) {
        console.error(`[${admin.email}] updateUser failed:`, error.message);
        continue;
      }
      results.push({
        email: admin.email,
        password: tempPassword,
        status: "updated (existed; role re-asserted, password reset)",
      });
    } else {
      const { error } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: tempPassword,
        email_confirm: true,
        app_metadata: { role: "admin" },
        user_metadata: { full_name: admin.label },
      });
      if (error) {
        console.error(`[${admin.email}] createUser failed:`, error.message);
        continue;
      }
      results.push({
        email: admin.email,
        password: tempPassword,
        status: "created",
      });
    }
  }

  console.log("\n=== Done ===\n");
  for (const r of results) {
    console.log(`${r.email}`);
    console.log(`  status: ${r.status}`);
    console.log(`  temp password: ${r.password}`);
    console.log("");
  }
  console.log(
    "Each admin should sign in at /admin/login and immediately change\n" +
      "their password via /admin/settings/account.\n",
  );
}

main().catch((e) => {
  console.error("Provisioning failed:", e);
  process.exit(1);
});
