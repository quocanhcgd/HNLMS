import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createDevelopmentSeed, PERSONA_ROLES, resetDevelopmentSeed } from "../../packages/test-fixtures/src/index";

describe("deterministic development fixtures", () => {
  it("creates two tenants, multiple branches, every persona and safe sample media", () => {
    const seed = createDevelopmentSeed();
    expect(seed.organizations).toHaveLength(2);
    expect(seed.branches).toHaveLength(4);
    expect(new Set(seed.branches.map((branch) => branch.organizationId)).size).toBe(2);
    for (const role of PERSONA_ROLES) expect(seed.personas.some((persona) => persona.role === role)).toBe(true);
    expect(seed.media).toHaveLength(4);
    expect(seed.media.every((media) => media.containsPersonalData === false && media.malwareStatus === "ready")).toBe(true);
    expect(existsSync(resolve(process.cwd(), "packages/test-fixtures/assets/sample-logo.svg"))).toBe(true);
  });

  it("is byte-stable and reset-safe", () => {
    expect(createDevelopmentSeed()).toEqual(createDevelopmentSeed());
    expect(resetDevelopmentSeed().order).toEqual(["media", "personas", "branches", "organizations"]);
    expect(createDevelopmentSeed("other").organizations[0].id).not.toBe(createDevelopmentSeed().organizations[0].id);
  });
});
