import { describe, expect, it } from "vitest";
import type { ModuleManifest } from "@hnlms/module-sdk";
import { UnknownModuleJobError, WorkerModuleGuard } from "../../worker/src/shared/module-guard";

const manifests: ModuleManifest[] = [
  { key: "identity", version: "1.0.0", core: true, dependencies: [], licenseFeatureKey: "identity", permissions: [] },
  {
    key: "reporting",
    version: "1.0.0",
    dependencies: ["identity"],
    licenseFeatureKey: "reporting",
    permissions: [],
    jobs: [{ key: "report-export" }],
  },
];

describe("worker module guard", () => {
  it("delegates a declared job to the shared module access policy", () => {
    const calls: Array<[string, { organizationId: string }]> = [];
    const guard = new WorkerModuleGuard(manifests, {
      assertModule: (moduleKey, context: { organizationId: string }) => calls.push([moduleKey, context]),
    });
    const context = { organizationId: "organization-1" };

    expect(guard.assertJob("report-export", context)).toBe("reporting");
    expect(calls).toEqual([["reporting", context]]);
  });

  it("does not execute unknown jobs", () => {
    const guard = new WorkerModuleGuard(manifests, { assertModule: () => undefined });
    expect(() => guard.assertJob("unowned-job", {})).toThrow(UnknownModuleJobError);
  });

  it("propagates access-policy denial before a worker can run a job", () => {
    const guard = new WorkerModuleGuard(manifests, {
      assertModule: () => {
        throw new Error("missing_entitlement");
      },
    });
    expect(() => guard.assertJob("report-export", {})).toThrow("missing_entitlement");
  });
});
