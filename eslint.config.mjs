// Next 16 ships native flat-config in eslint-config-next.
// The previous FlatCompat-based shim hit a circular-JSON bug with
// the new configs (P12 upgrade, 2026-05-05). Native flat-config
// import is the recommended path going forward.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

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
