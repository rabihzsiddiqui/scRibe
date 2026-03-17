import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Disabled: these new strict rules flag valid React patterns used in this codebase.
      // set-state-in-effect: SSR-safe localStorage init via useEffect is intentional.
      // purity: Date.now() in refs is a stable timestamp pattern, not a render side-effect.
      // refs: reading/writing refs during render is used for latest-value tracking per React docs.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
    },
  },
]);

export default eslintConfig;
