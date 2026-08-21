import { describe, expect, it } from "vitest";
import type { LicenseDocument, LicenseVerifier } from "@hnlms/license-contracts";
import type { ModuleManifest } from "@hnlms/module-sdk";
import { LicenseRuntime } from "../../apps/api/src/modules/license-runtime";
import { ModuleRegistry } from "../../apps/api/src/modules/module-registry";
import {
  ModuleGuardDeniedError,
  ModuleLicenseGuard,
  type ModuleGuardContext,
} from "../../apps/api/src/shared/module-guard";

const manifests: ModuleManifest[] = [
  { key: "identity", version: "1.0.0", core: true, dependencies: [], licenseFeatureKey: "identity", permissions: [] },
  {
    key: "academic",
    version: "1.0.0",
    dependencies: ["identity"],
    licenseFeatureKey: "academic",
    permissions: [],
    routes: ["/academic"],
    navigation: [{ key: "academic", route: "/academic", label: "Academic" }],
  },
  {
    key: "assessment",
    version: "1.0.0",
    dependencies: ["academic"],
    licenseFeatureKey: "assessment",
    permissions: [],
    routes: ["/assessment"],
    navigation: [{ key: "assessment", route: "/assessment", label: "Assessment" }],
  },
];

const license: LicenseDocument = {
  licenseId: "license-1",
  organizationId: "organization-1",
  term: "yearly",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-12-31T00:00:00.000Z",
  entitlements: { academic: { enabled: true, quota: 2 }, assessment: { enabled: true } },
  signature: "valid",
};

function guard(now = new Date("2026-06-01T00:00:00.000Z")): ModuleLicenseGuard {
  const verifier: LicenseVerifier = { verify: () => ({ valid: true }) };
  return new ModuleLicenseGuard(
    new ModuleRegistry(manifests),
    new LicenseRuntime(verifier, undefined, { now: () => now }),
  );
}

function context(overrides: Partial<ModuleGuardContext> = {}): ModuleGuardContext {
  return {
    organizationId: "organization-1",
    license,
    installedModuleKeys: new Set(["identity", "academic", "assessment"]),
    configuredModuleKeys: new Set(["academic", "assessment"]),
    ...overrides,
  };
}

describe("API module/license guard", () => {
  it("allows an effective route and returns only effective navigation", () => {
    const policy = guard();
    expect(policy.assertRoute("/academic/classes", context())).toBe("academic");
    expect(policy.navigation(context())).toEqual([
      { key: "academic", route: "/academic", label: "Academic" },
      { key: "assessment", route: "/assessment", label: "Assessment" },
    ]);
  });

  it("rejects routes and navigation when a module has no license entitlement", () => {
    const policy = guard();
    const withoutAcademic = context({ license: { ...license, entitlements: { assessment: { enabled: true } } } });
    expect(policy.evaluate("academic", withoutAcademic)).toMatchObject({
      allowed: false,
      reason: "missing_entitlement",
    });
    expect(policy.navigation(withoutAcademic)).toEqual([]);
    expect(() => policy.assertRoute("/academic", withoutAcademic)).toThrow(ModuleGuardDeniedError);
  });

  it("rejects an enabled module when its licensed quota is exhausted", () => {
    const decision = guard().evaluate("academic", context({ quotaUsedByFeatureKey: new Map([["academic", 2]]) }));
    expect(decision).toMatchObject({ allowed: false, reason: "quota_exhausted", state: { effectiveEnabled: true } });
  });

  it("propagates a disabled dependency and rejects routes with no module owner", () => {
    const policy = guard();
    const dependencyDisabled = context({ configuredModuleKeys: new Set(["assessment"]) });
    expect(policy.evaluate("assessment", dependencyDisabled)).toMatchObject({
      allowed: false,
      reason: "dependency_not_effective",
    });
    expect(() => policy.assertRoute("/unowned", context())).toThrow(/module_not_registered/);
  });

  it("does not accept a license belonging to another organization", () => {
    const decision = guard().evaluate(
      "academic",
      context({ license: { ...license, organizationId: "organization-2" } }),
    );
    expect(decision).toMatchObject({ allowed: false, reason: "missing_entitlement" });
  });
});
