import { describe, expect, it } from "vitest";
import {
  assertAuthorized,
  AuthorizationError,
  canAccessResource,
  createAuthorizationContext,
  hasScope,
} from "@hnlms/authorization";
import { requireServerPrincipal } from "../../apps/api/src/shared/authz/context";
import { enforceGuard } from "../../apps/api/src/shared/authz/guard";

const context = createAuthorizationContext({
  userId: "user-1",
  organizationId: "org-1",
  branchIds: ["branch-1"],
  classIds: ["class-1"],
  studentIds: ["student-1"],
  permissions: ["students:read"],
  now: new Date("2026-08-21T00:00:00.000Z"),
});

describe("authorization foundation", () => {
  it("enforces organization, branch, class, and student scope", () => {
    expect(canAccessResource(context, { organizationId: "org-1" })).toBe(true);
    for (const resource of [
      { organizationId: "org-2" },
      { organizationId: "org-1", branchId: "branch-2" },
      { organizationId: "org-1", classId: "class-2" },
      { organizationId: "org-1", studentId: "student-2" },
    ])
      expect(canAccessResource(context, resource)).toBe(false);
    expect(() => assertAuthorized(context, "students:read", { organizationId: "org-1" })).not.toThrow();
    expect(() => assertAuthorized(context, "students:write", { organizationId: "org-1" })).toThrowError(
      new AuthorizationError("missing_permission"),
    );
    expect(() => assertAuthorized(context, "students:read", { organizationId: "org-2" })).toThrowError(
      new AuthorizationError("scope_mismatch"),
    );
  });

  it("treats delegation start as inclusive and expiry as exclusive", () => {
    const grant = { userId: "user-1", kind: "student" as const, resourceId: "student-1" };
    expect(hasScope(context, { ...grant, effectiveFrom: "2026-08-21T00:00:00.000Z" })).toBe(true);
    expect(hasScope(context, { ...grant, effectiveTo: "2026-08-21T00:00:00.000Z" })).toBe(false);
    expect(hasScope(context, { ...grant, effectiveFrom: "2026-08-22T00:00:00.000Z" })).toBe(false);
    expect(hasScope(context, { ...grant, userId: "another-user" })).toBe(false);
  });

  it("requires a server-derived principal before applying a guard", () => {
    expect(requireServerPrincipal({ userId: "user-1", organizationId: "org-1", role: "admin" })).toEqual({
      userId: "user-1",
      organizationId: "org-1",
    });
    for (const value of [undefined, null, {}, { userId: "user-1" }, { organizationId: "org-1" }])
      expect(() => requireServerPrincipal(value)).toThrow("unauthenticated");
    expect(() =>
      enforceGuard(undefined, { permission: "students:read", resource: { organizationId: "org-1" } }),
    ).toThrow("unauthenticated");
  });
});
