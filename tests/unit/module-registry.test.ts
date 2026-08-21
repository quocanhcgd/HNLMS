import { describe, expect, it } from "vitest";
import type { ModuleManifest } from "@hnlms/module-sdk";
import { ModuleRegistry } from "../../apps/api/src/modules/module-registry";

const manifest = (overrides: Partial<ModuleManifest> = {}): ModuleManifest => ({
  key: "academic",
  version: "1.0.0",
  dependencies: [],
  licenseFeatureKey: "academic",
  permissions: [],
  routes: [],
  navigation: [],
  migrations: [],
  jobs: [],
  events: [],
  ...overrides,
});

describe("effective module registry", () => {
  const registry = new ModuleRegistry([
    manifest({ key: "identity", core: true, licenseFeatureKey: "identity" }),
    manifest({ key: "academic", dependencies: ["identity"] }),
    manifest({ key: "assessment", dependencies: ["academic"], licenseFeatureKey: "assessment" }),
  ]);

  it("keeps core modules effective without tenant configuration or entitlements", () => {
    const state = registry.resolveEffectiveState("identity", {
      installedModuleKeys: new Set(["identity"]),
      configuredModuleKeys: new Set(),
      licensedFeatureKeys: new Set(),
    });
    expect(state).toMatchObject({ effectiveEnabled: true, reason: "enabled" });
  });

  it("evaluates the full graph so disabled dependencies disable their dependents", () => {
    const states = registry.resolveEffectiveStates({
      installedModuleKeys: new Set(["identity", "academic", "assessment"]),
      configuredModuleKeys: new Set(["academic", "assessment"]),
      licensedFeatureKeys: new Set(["academic", "assessment"]),
    });
    expect(states).toEqual([
      expect.objectContaining({ moduleKey: "identity", effectiveEnabled: true }),
      expect.objectContaining({ moduleKey: "academic", effectiveEnabled: true }),
      expect.objectContaining({ moduleKey: "assessment", effectiveEnabled: true }),
    ]);

    const missingAcademicEntitlement = registry.resolveEffectiveStates({
      installedModuleKeys: new Set(["identity", "academic", "assessment"]),
      configuredModuleKeys: new Set(["academic", "assessment"]),
      licensedFeatureKeys: new Set(["assessment"]),
    });
    expect(missingAcademicEntitlement).toEqual([
      expect.objectContaining({ moduleKey: "identity", effectiveEnabled: true }),
      expect.objectContaining({ moduleKey: "academic", reason: "missing_entitlement" }),
      expect.objectContaining({ moduleKey: "assessment", reason: "dependency_not_effective" }),
    ]);
  });

  it("does not allow a core module to bypass installation", () => {
    const state = registry.resolveEffectiveState("identity", {
      installedModuleKeys: new Set(),
      configuredModuleKeys: new Set(),
      licensedFeatureKeys: new Set(),
    });
    expect(state).toMatchObject({ effectiveEnabled: false, reason: "module_not_installed" });
  });
});
