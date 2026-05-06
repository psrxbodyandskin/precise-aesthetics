import "server-only";

// TODO: Replace with Upstash Redis (or equivalent) before launch.
// In-memory state is per-instance only — on Vercel's serverless runtime each
// cold-started lambda has its own counters, so this is a soft throttle, not a
// hard guarantee. Acceptable for the teaser period; revisit before traffic
// scales or before any endpoint that needs strong abuse protection.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// P12 — agent endpoint rate limit. 20 invocations per admin user
// per hour. Caps Anthropic cost-runaway risk if an admin account
// is compromised or a buggy client loops. In-memory stop-gap;
// migrate to Redis-backed counter (Upstash / Vercel KV) before
// scaling. See SECURITY-AUDIT-RESULTS.md for rationale + scope.
export const AGENT_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 } as const;

export function agentRateLimit(adminUserId: string): RateLimitResult {
  return rateLimit({
    key: `agent:${adminUserId}`,
    limit: AGENT_RATE_LIMIT.limit,
    windowMs: AGENT_RATE_LIMIT.windowMs,
  });
}
