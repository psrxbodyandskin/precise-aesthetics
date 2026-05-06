// P11 — Route-level SQL safety check.
//
// First line of defence for the Query Assistant. Rejects:
//   - Any write keyword (INSERT/UPDATE/DELETE/DROP/ALTER/
//     CREATE/TRUNCATE/GRANT/REVOKE/COMMENT) anywhere in the
//     query, case-insensitive
//   - References to auth.* or storage.* schemas
//   - Multi-statement queries (separated by `;` outside string
//     literals — caught by a simple count after stripping)
//
// The Postgres-side execute_readonly_query() RPC is the second
// line: it sets default_transaction_read_only=on and a 10s
// statement timeout, AND re-checks is_admin(). Both layers
// non-negotiable.

const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "COMMENT",
  "VACUUM",
  "REINDEX",
  "REFRESH",
  "COPY",
  "MERGE",
];

const FORBIDDEN_SCHEMA_PATTERNS = [/\bauth\./i, /\bstorage\./i, /\bpg_catalog\./i];

export interface SqlGuardResult {
  safe: boolean;
  reason?: string;
}

export function validateReadOnlySql(rawQuery: string): SqlGuardResult {
  const trimmed = rawQuery.trim();
  if (trimmed.length === 0) {
    return { safe: false, reason: "Empty query." };
  }

  // Strip line + block comments so commented-out keywords don't
  // confuse the keyword scan.
  const stripped = trimmed
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  // Split on `;` — multiple statements not allowed. The Query
  // Assistant prompt asks for a single SELECT.
  const statements = stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (statements.length > 1) {
    return {
      safe: false,
      reason: "Multiple SQL statements are not allowed.",
    };
  }

  const single = statements[0] ?? stripped;
  const upper = single.toUpperCase();

  // First non-comment token must start with SELECT or WITH (CTE).
  const firstToken = upper.split(/\s+/)[0] ?? "";
  if (firstToken !== "SELECT" && firstToken !== "WITH") {
    return {
      safe: false,
      reason: `Query must start with SELECT or WITH (got "${firstToken}").`,
    };
  }

  // Forbidden keyword scan as standalone words.
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const re = new RegExp(`\\b${keyword}\\b`, "i");
    if (re.test(single)) {
      return {
        safe: false,
        reason: `Query contains forbidden keyword: ${keyword}.`,
      };
    }
  }

  // Forbidden schema references.
  for (const pattern of FORBIDDEN_SCHEMA_PATTERNS) {
    if (pattern.test(single)) {
      return {
        safe: false,
        reason: `Query references a protected schema (${pattern.source}).`,
      };
    }
  }

  return { safe: true };
}
