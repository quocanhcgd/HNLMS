import { describe, expect, it } from "vitest";
import {
  assertValidModuleManifest,
  resolveModuleDependencies,
  validateModuleManifest,
  type ModuleManifest,
} from "@hnlms/module-sdk";

const manifest = (overrides: Partial<ModuleManifest> = {}): ModuleManifest => ({
  key: "academic",
  version: "1.0.0",
  dependencies: [],
  licenseFeatureKey: "academic",
  permissions: ["academic-read"],
  routes: ["/admin/academic"],
  navigation: [{ key: "academic", route: "/admin/academic", label: "Academic" }],
  migrations: [{ id: "academic-initial", version: "1.0.0" }],
  jobs: [{ key: "academic-sync" }],
  events: [{ key: "academic-published" }],
  ...overrides,
});

describe("module manifest validation and dependency resolution", () => {
  it("accepts a complete valid business module manifest", () => {
    expect(validateModuleManifest(manifest())).toEqual([]);
    expect(assertValidModuleManifest(manifest())).toMatchObject({ key: "academic" });
  });

  it("reports invalid and duplicate manifest contributions", () => {
    const issues = validateModuleManifest(
      manifest({
        key: "Academic Module",
        dependencies: ["identity", "identity", "Academic Module"],
        permissions: ["academic-read", "academic-read"],
        routes: ["admin/academic", "admin/academic"],
        navigation: [
          { key: "academic", route: "admin/academic", label: "Academic" },
          { key: "academic", route: "/admin/academic", label: "Duplicate" },
        ],
      }),
    );
    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "invalid_module_key",
        "duplicate_dependency",
        "self_dependency",
        "duplicate_permission",
        "invalid_route",
        "duplicate_route",
        "invalid_navigation_route",
        "duplicate_navigation_key",
      ]),
    );
  });

  it("orders dependencies before their dependents", () => {
    const result = resolveModuleDependencies([
      manifest({ key: "assessment", dependencies: ["academic"], licenseFeatureKey: "assessment" }),
      manifest({ key: "identity", core: true, licenseFeatureKey: "identity" }),
      manifest({ key: "academic", dependencies: ["identity"] }),
    ]);
    expect(result.orderedModuleKeys).toEqual(["identity", "academic", "assessment"]);
  });

  it("rejects missing dependencies and reports a deterministic dependency cycle", () => {
    expect(() => resolveModuleDependencies([manifest({ dependencies: ["identity"] })])).toThrow(
      "missing_dependency: academic -> identity",
    );
    expect(() =>
      resolveModuleDependencies([
        manifest({ key: "academic", dependencies: ["assessment"] }),
        manifest({ key: "assessment", dependencies: ["academic"], licenseFeatureKey: "assessment" }),
      ]),
    ).toThrow("dependency_cycle: academic -> assessment -> academic");
  });
});
