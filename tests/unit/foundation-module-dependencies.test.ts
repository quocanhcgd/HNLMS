import { describe, expect, it } from "vitest";
import { resolveEffectiveState, resolveModuleDependencies, type ModuleManifest } from "@hnlms/module-sdk";

const moduleManifest = (key: string, overrides: Partial<ModuleManifest> = {}): ModuleManifest => ({
  key,
  version: "1.0.0",
  dependencies: [],
  licenseFeatureKey: key,
  permissions: [`${key}-read`],
  ...overrides,
});

describe("module dependency foundation", () => {
  it("orders transitive dependencies and rejects duplicate or missing keys", () => {
    expect(
      resolveModuleDependencies([
        moduleManifest("assessment", { dependencies: ["academic"] }),
        moduleManifest("academic", { dependencies: ["identity"] }),
        moduleManifest("identity", { core: true }),
      ]).orderedModuleKeys,
    ).toEqual(["identity", "academic", "assessment"]);
    expect(() => resolveModuleDependencies([moduleManifest("identity"), moduleManifest("identity")])).toThrow(
      "duplicate_module_key: identity",
    );
    expect(() => resolveModuleDependencies([moduleManifest("assessment", { dependencies: ["missing"] })])).toThrow(
      "missing_dependency: assessment -> missing",
    );
  });

  it("reports the complete dependency cycle path", () => {
    expect(() =>
      resolveModuleDependencies([
        moduleManifest("reports", { dependencies: ["academic", "identity"] }),
        moduleManifest("academic", { dependencies: ["identity"] }),
        moduleManifest("identity", { dependencies: ["reports"] }),
      ]),
    ).toThrow("dependency_cycle: reports -> academic -> identity -> reports");
  });

  it("requires installation, configuration, entitlement, and effective dependencies", () => {
    const manifest = moduleManifest("assessment", { dependencies: ["academic"] });
    const cases = [
      [new Set<string>(), new Set<string>(), new Set<string>(), new Set<string>(), "module_not_installed"],
      [
        new Set(["assessment"]),
        new Set<string>(),
        new Set(["assessment"]),
        new Set(["academic"]),
        "disabled_by_configuration",
      ],
      [
        new Set(["assessment"]),
        new Set(["assessment"]),
        new Set<string>(),
        new Set(["academic"]),
        "missing_entitlement",
      ],
      [
        new Set(["assessment"]),
        new Set(["assessment"]),
        new Set(["assessment"]),
        new Set<string>(),
        "dependency_not_effective",
      ],
    ] as const;
    for (const [installed, configured, licensed, dependencies, reason] of cases)
      expect(resolveEffectiveState(manifest, installed, configured, licensed, dependencies)).toMatchObject({
        effectiveEnabled: false,
        reason,
      });
    expect(
      resolveEffectiveState(
        manifest,
        new Set(["assessment"]),
        new Set(["assessment"]),
        new Set(["assessment"]),
        new Set(["academic"]),
      ),
    ).toMatchObject({ effectiveEnabled: true, reason: "enabled" });
  });

  it("allows core modules without tenant configuration or entitlement", () => {
    expect(
      resolveEffectiveState(
        moduleManifest("identity", { core: true }),
        new Set(["identity"]),
        new Set(),
        new Set(),
        new Set(),
      ),
    ).toMatchObject({ configuredEnabled: true, licensedEnabled: true, effectiveEnabled: true });
  });
});
