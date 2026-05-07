// Next 16 ships native flat-config in eslint-config-next.
// The previous FlatCompat-based shim hit a circular-JSON bug with
// the new configs (P12 upgrade, 2026-05-05). Native flat-config
// import is the recommended path going forward.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// P12.5 — DEFERRED: 18 react-hooks v7 strict-rule errors across
// 13 files remain unresolved. They surfaced when eslint-config-next
// upgraded to v16 in P12 (Next 16 + new react-hooks v7 rules).
//
// Decision (P12.5): do NOT downgrade the rules to warn — keep the
// errors visible. Refactoring blind risks regressing real behavior
// (e.g., cert-expiry Date.now() comparison must update across
// renders). Each pattern is documented in KNOWN-GOTCHAS.md with
// the reasoning per category. Resolved in P15+ when React Compiler
// enablement is on the table — Compiler validates refactors as
// they land, instead of doing them blind.
//
// Build is not gated on eslint (Next 16 doesn't auto-lint at build).
// Production runtime is unaffected by these patterns.

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".claude/**",
      "design-system/**",
      "spec/**",
    ],
  },
];

export default eslintConfig;
