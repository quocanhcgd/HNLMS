import { describe, expect, it } from "vitest";
import {
  assertAuthorized,
  AuthorizationError,
  createAuthorizationContext,
  hasScope,
  type PermissionKey,
  type ScopedResource,
} from "@hnlms/authorization";
import type { LicenseDocument, LicenseVerifier } from "@hnlms/license-contracts";
import type { ModuleManifest } from "@hnlms/module-sdk";
import { LicenseRuntime } from "../../src/modules/license-runtime";
import { ModuleRegistry } from "../../src/modules/module-registry";
import { enforceGuard } from "../../src/shared/authz/guard";
import { ModuleGuardDeniedError, ModuleLicenseGuard, type ModuleGuardContext } from "../../src/shared/module-guard";

const now = new Date("2026-08-21T00:00:00.000Z");
const permission = "students:read" as PermissionKey;
const permittedContext = createAuthorizationContext({
  userId: "user-a",
  organizationId: "organization-a",
  branchIds: ["branch-a"],
  classIds: ["class-a"],
  studentIds: ["student-a"],
  permissions: [permission],
  now,
});

const accessManifests: ModuleManifest[] = [
  { key: "identity", version: "1.0.0", core: true, dependencies: [], licenseFeatureKey: "identity", permissions: [] },
  {
    key: "academic",
    version: "1.0.0",
    dependencies: ["identity"],
    licenseFeatureKey: "academic",
    permissions: ["students-read"],
    routes: ["/academic"],
  },
];

const license: LicenseDocument = {
  licenseId: "license-a",
  organizationId: "organization-a",
  term: "yearly",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-12-31T00:00:00.000Z",
  entitlements: { academic: { enabled: true } },
  signature: "valid",
};

function moduleGuard(): ModuleLicenseGuard {
  const verifier: LicenseVerifier = { verify: () => ({ valid: true }) };
  return new ModuleLicenseGuard(
    new ModuleRegistry(accessManifests),
    new LicenseRuntime(verifier, undefined, { now: () => now }),
  );
}

function moduleContext(overrides: Partial<ModuleGuardContext> = {}): ModuleGuardContext {
  return {
    organizationId: "organization-a",
    license,
    installedModuleKeys: new Set(["identity", "academic"]),
    configuredModuleKeys: new Set(["academic"]),
    ...overrides,
  };
}

describe("T039 authorization negative-access matrix", () => {
  it.each<[string, ScopedResource]>([
    [
      "another organization",
      { organizationId: "organization-b", branchId: "branch-a", classId: "class-a", studentId: "student-a" },
    ],
    [
      "an unassigned branch",
      { organizationId: "organization-a", branchId: "branch-b", classId: "class-a", studentId: "student-a" },
    ],
    [
      "an unassigned class",
      { organizationId: "organization-a", branchId: "branch-a", classId: "class-b", studentId: "student-a" },
    ],
    [
      "an unassigned student",
      { organizationId: "organization-a", branchId: "branch-a", classId: "class-a", studentId: "student-b" },
    ],
  ])("denies a caller with a valid permission from accessing %s", (_caseName, resource) => {
    expect(() => enforceGuard(permittedContext, { permission, resource })).toThrow(
      new AuthorizationError("scope_mismatch"),
    );
  });

  it("does not let a matching scope compensate for a missing permission", () => {
    const noPermission = createAuthorizationContext({
      userId: "user-a",
      organizationId: "organization-a",
      branchIds: ["branch-a"],
      classIds: ["class-a"],
      studentIds: ["student-a"],
      now,
    });

    expect(() =>
      enforceGuard(noPermission, {
        permission,
        resource: {
          organizationId: "organization-a",
          branchId: "branch-a",
          classId: "class-a",
          studentId: "student-a",
        },
      }),
    ).toThrow(new AuthorizationError("missing_permission"));
  });

  it.each([
    ["a grant for a different user", { userId: "user-b", kind: "student", resourceId: "student-a" }],
    [
      "a future delegation",
      { userId: "user-a", kind: "student", resourceId: "student-a", effectiveFrom: "2026-08-22T00:00:00.000Z" },
    ],
    [
      "an expired delegation",
      { userId: "user-a", kind: "student", resourceId: "student-a", effectiveTo: "2026-08-21T00:00:00.000Z" },
    ],
    ["a delegation for another student", { userId: "user-a", kind: "student", resourceId: "student-b" }],
  ] as const)("rejects %s", (_caseName, grant) => {
    expect(hasScope(permittedContext, grant)).toBe(false);
  });

  it("does not treat a student delegation as organization, branch, or class access", () => {
    const parentContext = createAuthorizationContext({
      userId: "parent-a",
      organizationId: "organization-a",
      studentIds: ["student-a"],
      permissions: [permission],
      now,
    });

    expect(hasScope(parentContext, { userId: "parent-a", kind: "student", resourceId: "student-a" })).toBe(true);
    expect(hasScope(parentContext, { userId: "parent-a", kind: "organization", resourceId: "organization-a" })).toBe(
      true,
    );
    expect(hasScope(parentContext, { userId: "parent-a", kind: "branch", resourceId: "branch-a" })).toBe(false);
    expect(hasScope(parentContext, { userId: "parent-a", kind: "class", resourceId: "class-a" })).toBe(false);
    expect(() =>
      assertAuthorized(parentContext, permission, {
        organizationId: "organization-a",
        branchId: "branch-a",
        classId: "class-a",
        studentId: "student-a",
      }),
    ).toThrow(new AuthorizationError("scope_mismatch"));
  });

  it("denies a disabled module even after a caller passes permission and scope checks", () => {
    const resource = {
      organizationId: "organization-a",
      branchId: "branch-a",
      classId: "class-a",
      studentId: "student-a",
    };
    expect(enforceGuard(permittedContext, { permission, resource })).toBe(true);

    const disabledByConfiguration = moduleContext({ configuredModuleKeys: new Set() });
    expect(() => moduleGuard().assertRoute("/academic/students", disabledByConfiguration)).toThrow(
      ModuleGuardDeniedError,
    );
    expect(() => moduleGuard().assertRoute("/academic/students", disabledByConfiguration)).toThrow(
      /disabled_by_configuration/,
    );
  });

  it("keeps authorization denial effective even when the requested module is licensed and enabled", () => {
    expect(moduleGuard().assertRoute("/academic/students", moduleContext())).toBe("academic");
    expect(() =>
      enforceGuard(permittedContext, {
        permission,
        resource: {
          organizationId: "organization-a",
          branchId: "branch-b",
          classId: "class-a",
          studentId: "student-a",
        },
      }),
    ).toThrow(new AuthorizationError("scope_mismatch"));
  });

  it.each([
    ["a missing entitlement", moduleContext({ license: { ...license, entitlements: {} } }), "missing_entitlement"],
    [
      "a license from another organization",
      moduleContext({ license: { ...license, organizationId: "organization-b" } }),
      "missing_entitlement",
    ],
    ["an uninstalled module", moduleContext({ installedModuleKeys: new Set(["identity"]) }), "module_not_installed"],
  ] as const)("does not expose an academic route with %s", (_caseName, context, reason) => {
    expect(() => moduleGuard().assertRoute("/academic/students", context)).toThrow(ModuleGuardDeniedError);
    expect(() => moduleGuard().assertRoute("/academic/students", context)).toThrow(new RegExp(reason));
  });
});
