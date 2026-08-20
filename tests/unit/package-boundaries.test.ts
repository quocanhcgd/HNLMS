import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("package boundaries", () => {
  it("contains all shared package entrypoints", () => {
    const packages = ["domain-contracts", "authorization", "module-sdk", "license-contracts", "ui", "theme-presets"];
    for (const name of packages) {
      expect(existsSync(join(process.cwd(), "packages", name, "src", "index.ts"))).toBe(true);
    }
  });
});
