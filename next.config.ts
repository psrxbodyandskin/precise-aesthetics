import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  typedRoutes: false,

  // P12 — Security headers (defense-in-depth).
  // CSP intentionally deferred to P12.5 polish — strict CSP without
  // 'unsafe-inline' styles breaks Tailwind / Sanity Studio / Cal.com
  // embeds; needs a per-route review pass that belongs in polish, not
  // a security cut. The remaining four are safe to ship now.
  async headers() {
    const baseSecurityHeaders = [
      // Block clickjacking. SAMEORIGIN (not DENY) so Sanity Studio
      // can iframe Visual Editing previews of our own routes.
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      // Block MIME sniffing.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Limit referrer leakage to same-origin path on cross-origin nav.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // HSTS — preload-eligible. Vercel terminates TLS so this is safe
      // to send unconditionally. 2-year max-age + includeSubDomains.
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      // Disable powerful permissions we never use.
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: baseSecurityHeaders,
      },
    ];
  },
};

// P12 — Sentry wrapping. Source map upload runs at build time when
// SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT are set in the
// build env (Vercel). Falls back gracefully (silent skip, no build
// error) when missing — important so dev/preview builds don't break
// for contributors who don't have Sentry creds.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  // Hide source maps from the public bundle but still upload them
  // to Sentry for symbolication. (Sentry 10 moved this under
  // `sourcemaps` from the old top-level `hideSourceMaps`.)
  sourcemaps: { disable: false },
  // Disable telemetry pings.
  telemetry: false,
});
