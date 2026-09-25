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
    "public/pdf.worker.min.mjs",
    "tests/create-test-images.js",
    "tests/create-test-pdf.js",
    // Agent tooling and repo-pinned skills are not app code: vendored minified
    // bundles (gsap.min.js) and CommonJS skill scripts fail the app's rules
    // without telling us anything about the product. Keep lint on app source.
    ".agents/**",
  ]),
]);

export default eslintConfig;
