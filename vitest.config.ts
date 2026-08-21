export default {
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx", "apps/api/tests/**/*.spec.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
};
