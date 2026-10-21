import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/.next-*/**", "**/dist/**", "docs/task-dashboard.html"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  { files: ["**/*.d.ts"], rules: { "@typescript-eslint/triple-slash-reference": "off" } },
  {
    files: ["docs/dashboard-app.js"],
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        fetch: "readonly",
        setInterval: "readonly",
      },
    },
  },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly" } } },
  { files: ["apps/web/next.config.mjs"], languageOptions: { globals: { process: "readonly" } } },
  {
    files: ["scripts/**/*.cjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly", __dirname: "readonly", require: "readonly" } },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];
