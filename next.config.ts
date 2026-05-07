import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
  typedRoutes: false,

  // P12 — Security headers (defense-in-depth).
  // P12.5 — CSP added in REPORT-ONLY mode. Operator browses
  // production after deploy, captures violation reports from the
  // browser console, then we tighten + flip to enforcing in P12.5.5.
  async headers() {
    // P12.5 — Content Security Policy (report-only).
    //
    // Allowlist sources — only what we actually use:
    //   • self for everything
    //   • Sanity (Studio + image CDN + visual editing preview iframe)
    //   • PostHog (analytics ingestion + recording assets)
    //   • Sentry (error reporting + source maps)
    //   • Anthropic — server-side only, no client connect needed
    //   • Cal.com — embedded on /demo
    //   • Supabase — auth + REST + storage
    //   • Vercel Live (preview comments — only on preview deploys but
    //     allowing on prod is harmless and avoids deploy-env split)
    //   • Google Fonts — next/font self-hosts but the loader may emit
    //     fetch URLs during build; allowed conservatively
    //
    // 'unsafe-inline' for style — Tailwind v4 + shadcn primitives
    // emit inline styles. Documented as accepted risk — modernizing
    // to nonce-based style would require touching every styled
    // primitive and is P15+ work.
    //
    // 'unsafe-eval' — Sanity Studio's vite-style runtime evaluates
    // schemas at boot. Scoped via the report-only mode to surface in
    // violations; if it lands clean we can confirm and tighten.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.sanity.io https://*.posthog.com https://us-assets.i.posthog.com https://*.sentry.io https://*.cal.com https://app.cal.com https://*.vercel-scripts.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sanity.io wss://*.sanity.io https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://*.cal.com https://app.cal.com https://*.vercel.com",
      "frame-src 'self' https://*.cal.com https://app.cal.com https://*.sanity.io",
      "frame-ancestors 'self' https://*.sanity.io",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "media-src 'self' https://*.supabase.co",
      "worker-src 'self' blob:",
      "manifest-src 'self'",
    ].join("; ");

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
      // P12.5 — CSP in report-only mode. Browse the site after deploy,
      // capture browser-console violation reports, tighten, then flip
      // the header name to `Content-Security-Policy` to enforce.
      {
        key: "Content-Security-Policy-Report-Only",
        value: csp,
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
