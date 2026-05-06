"use client";

// Global error boundary — catches errors not handled by route segment
// boundaries. Reports to Sentry (no-op if SENTRY_DSN unset) and renders
// a minimal recovery UI.

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          background: "#FAF7F2",
          color: "#0A0F1C",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#4A5568",
              marginBottom: "0.75rem",
            }}
          >
            § Application error
          </p>
          <h1
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(1.5rem, 1.5vw + 1rem, 2rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.015em",
              color: "#0A0F1C",
              marginBottom: "1rem",
            }}
          >
            Something went wrong.
          </h1>
          <p style={{ color: "#1F2A3D", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            We&apos;ve been notified and will investigate. You can try again or
            return home.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                fontSize: "0.75rem",
                color: "#4A5568",
                marginBottom: "1.5rem",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-block",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.125rem",
              border: "none",
              background: "#0C1426",
              color: "#FDFCF9",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
