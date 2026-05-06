// P12 — RLS audit runner.
//
// Provisions four test users on a LOCAL Supabase project, then
// runs every cell of the expected matrix and asserts the outcome
// matches. Reports a markdown table to stdout.
//
// USAGE
//   1. Make sure local Supabase is running:
//        supabase start
//   2. Apply all migrations to local:
//        supabase db reset --local
//   3. Set env vars in .env.audit (template: .env.audit.example):
//        SUPABASE_URL=http://127.0.0.1:54321
//        SUPABASE_SERVICE_ROLE_KEY=<from `supabase status`>
//        SUPABASE_ANON_KEY=<from `supabase status`>
//   4. Run:
//        npx tsx scripts/rls-audit.ts > audits/RLS-AUDIT-RUN.md
//
// PRINCIPLE
//   The script never runs against production. Tests are
//   destructive (INSERT/UPDATE/DELETE) and are scoped to local
//   only. Audit results are saved to disk and reviewed before
//   any conclusion is drawn.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config as dotenvConfig } from "dotenv";
import { RLS_MATRIX, type Op, type Role, type RowExpectation } from "./rls-audit-matrix";

dotenvConfig({ path: ".env.audit" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
  console.error(
    "Missing env. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY in .env.audit",
  );
  process.exit(1);
}

if (!/127\.0\.0\.1|localhost/.test(SUPABASE_URL)) {
  console.error("Refusing to run against non-local Supabase URL:", SUPABASE_URL);
  console.error("RLS audit is destructive — local only.");
  process.exit(1);
}

interface TestUserCtx {
  role: Role;
  practiceId: string | null;
  client: SupabaseClient;
  userId?: string;
}

const TEST_PRACTICE_A_ID = "00000000-0000-0000-0000-00000000a001";
const TEST_PRACTICE_B_ID = "00000000-0000-0000-0000-00000000b001";

const TEST_USERS = {
  admin: { email: "audit-admin@example.test", password: "audit-password-1" },
  practiceA: { email: "audit-practiceA@example.test", password: "audit-password-2" },
  practiceB: { email: "audit-practiceB@example.test", password: "audit-password-3" },
};

const service = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function provisionTestUsers(): Promise<Record<Role, TestUserCtx>> {
  // Seed practices first (admin-controlled, service-role bypass)
  await service.from("practices").upsert([
    {
      id: TEST_PRACTICE_A_ID,
      name: "Audit Practice A",
      primary_email: TEST_USERS.practiceA.email,
      status: "active",
    },
    {
      id: TEST_PRACTICE_B_ID,
      name: "Audit Practice B",
      primary_email: TEST_USERS.practiceB.email,
      status: "active",
    },
  ]);

  // Provision auth users with proper app_metadata (the only
  // trustworthy claim per RLS-PATTERNS.md).
  const ensureUser = async (
    email: string,
    password: string,
    appMetadata: Record<string, unknown>,
  ) => {
    // Idempotent: try create, fall back to update if already exists.
    const { data: existing } = await service.auth.admin.listUsers();
    const found = existing?.users.find((u) => u.email === email);
    if (found) {
      await service.auth.admin.updateUserById(found.id, {
        password,
        app_metadata: appMetadata,
        email_confirm: true,
      });
      return found.id;
    }
    const { data: created, error } = await service.auth.admin.createUser({
      email,
      password,
      app_metadata: appMetadata,
      email_confirm: true,
    });
    if (error) throw error;
    return created.user!.id;
  };

  const adminId = await ensureUser(TEST_USERS.admin.email, TEST_USERS.admin.password, {
    role: "admin",
  });
  const aId = await ensureUser(TEST_USERS.practiceA.email, TEST_USERS.practiceA.password, {
    role: "practice",
    practice_id: TEST_PRACTICE_A_ID,
  });
  const bId = await ensureUser(TEST_USERS.practiceB.email, TEST_USERS.practiceB.password, {
    role: "practice",
    practice_id: TEST_PRACTICE_B_ID,
  });

  // Sign in as each to get a per-role anon-key client carrying the JWT.
  const signedClient = async (email: string, password: string): Promise<SupabaseClient> => {
    const c = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await c.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return c;
  };

  return {
    admin: {
      role: "admin",
      practiceId: null,
      client: await signedClient(TEST_USERS.admin.email, TEST_USERS.admin.password),
      userId: adminId,
    },
    practiceA: {
      role: "practiceA",
      practiceId: TEST_PRACTICE_A_ID,
      client: await signedClient(TEST_USERS.practiceA.email, TEST_USERS.practiceA.password),
      userId: aId,
    },
    practiceB: {
      role: "practiceB",
      practiceId: TEST_PRACTICE_B_ID,
      client: await signedClient(TEST_USERS.practiceB.email, TEST_USERS.practiceB.password),
      userId: bId,
    },
    anon: {
      role: "anon",
      practiceId: null,
      client: createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
        auth: { autoRefreshToken: false, persistSession: false },
      }),
    },
  };
}

interface CellResult {
  table: string;
  role: Role;
  op: Op;
  scope: string | undefined;
  expected: "allow" | "deny" | "skip-dead-table";
  actual: "allow" | "deny" | "error";
  errorMsg?: string;
  pass: boolean;
}

async function runCell(
  ctx: TestUserCtx,
  table: string,
  expectation: RowExpectation,
): Promise<CellResult> {
  const c = ctx.client;
  const out: CellResult = {
    table,
    role: ctx.role,
    op: expectation.op,
    scope: expectation.scope,
    expected: expectation.expected,
    actual: "error",
    pass: false,
  };

  try {
    // SELECT — try to read 1 row.
    if (expectation.op === "select") {
      const { data, error } = await c.from(table).select("*").limit(1);
      // RLS denies silently — no error, just empty rows.
      // For "deny" expectation: we expect either error OR empty array.
      // For "allow" expectation: we expect either data OR clear permission to read.
      if (error) {
        out.actual = "deny";
        out.errorMsg = error.message;
      } else {
        out.actual = (data?.length ?? 0) > 0 ? "allow" : "deny";
        // For empty tables we can't distinguish "denied silently" from "empty".
        // The full audit doc explains the distinction. For accuracy on empty tables,
        // the operator should also seed at least one row in the seed step.
      }
    } else if (expectation.op === "insert") {
      // Use a minimal stub row. Most tables require columns; this call
      // is *intentionally* underspecified — we want to see whether RLS
      // blocks the attempt before column validation. If it errors with
      // "violates row-level security policy" or 42501, that's a deny.
      // If it errors with column-level issues but RLS allowed, we treat
      // as allow (the policy didn't block).
      const stub: Record<string, unknown> = {};
      // The script doesn't try to satisfy NOT NULL constraints —
      // this is a policy probe, not a data integrity test.
      const { error } = await c.from(table).insert(stub);
      if (!error) {
        out.actual = "allow";
      } else if (
        /row-level security|RLS|42501|new row violates row-level security/i.test(
          error.message,
        )
      ) {
        out.actual = "deny";
      } else {
        // Column errors etc. — RLS didn't reject. Mark allow.
        out.actual = "allow";
        out.errorMsg = `(non-RLS error: ${error.message})`;
      }
    } else if (expectation.op === "update") {
      const { error } = await c
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq("id", "00000000-0000-0000-0000-000000000000"); // nonexistent
      if (!error) {
        out.actual = "allow";
      } else if (/row-level security|42501/i.test(error.message)) {
        out.actual = "deny";
      } else {
        out.actual = "allow";
        out.errorMsg = `(non-RLS error: ${error.message})`;
      }
    } else if (expectation.op === "delete") {
      const { error } = await c
        .from(table)
        .delete()
        .eq("id", "00000000-0000-0000-0000-000000000000");
      if (!error) {
        out.actual = "allow";
      } else if (/row-level security|42501/i.test(error.message)) {
        out.actual = "deny";
      } else {
        out.actual = "allow";
        out.errorMsg = `(non-RLS error: ${error.message})`;
      }
    }
  } catch (e) {
    out.actual = "error";
    out.errorMsg = e instanceof Error ? e.message : String(e);
  }

  out.pass =
    (out.expected === "allow" && out.actual === "allow") ||
    (out.expected === "deny" && out.actual === "deny");
  return out;
}

async function main() {
  console.log("# RLS Audit — runtime results\n");
  console.log(`> Generated ${new Date().toISOString()}\n`);
  console.log(`> Supabase URL: ${SUPABASE_URL}\n`);

  const ctx = await provisionTestUsers();

  let pass = 0;
  let fail = 0;
  const failures: CellResult[] = [];

  for (const t of RLS_MATRIX) {
    if (t.class === "dead") {
      console.log(`## ${t.table} — SKIPPED (dead table; ${t.description})\n`);
      continue;
    }
    console.log(`## ${t.table}\n`);
    console.log(`> Class: ${t.class} — ${t.description}\n`);
    console.log("| role | op | scope | expected | actual | pass |");
    console.log("|---|---|---|---|---|---|");
    for (const r of t.rows) {
      const result = await runCell(ctx[r.role], t.table, r);
      const flag = result.pass ? "✓" : "✗";
      console.log(
        `| ${r.role} | ${r.op} | ${r.scope ?? "-"} | ${r.expected} | ${result.actual} | ${flag} |`,
      );
      if (result.pass) pass++;
      else {
        fail++;
        failures.push(result);
      }
    }
    console.log("");
  }

  console.log("---\n");
  console.log(`**Total cells:** ${pass + fail}  \n`);
  console.log(`**Pass:** ${pass}  \n`);
  console.log(`**Fail:** ${fail}  \n`);
  if (failures.length > 0) {
    console.log("\n### Failures\n");
    for (const f of failures) {
      console.log(
        `- ${f.table} | ${f.role} | ${f.op} | scope=${f.scope ?? "-"} | expected=${f.expected} | actual=${f.actual}${f.errorMsg ? ` | ${f.errorMsg}` : ""}`,
      );
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Audit failed:", e);
  process.exit(1);
});
