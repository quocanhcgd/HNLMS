import { describe, expect, it } from "vitest";
import { assertAuthorized, AuthorizationError, createAuthorizationContext, hasScope } from "@hnlms/authorization";
import { enforceGuard } from "../../apps/api/src/shared/authz/guard";

const context = createAuthorizationContext({
  userId: "u-a",
  organizationId: "org-a",
  branchIds: ["branch-a"],
  classIds: ["class-a"],
  studentIds: ["student-a"],
  permissions: ["students:read", "classes:update"],
  roles: ["branch_manager"],
  now: new Date("2026-08-21T00:00:00Z"),
});

describe("authorization scope matrix", () => {
  it.each([
    ["cross tenant", { organizationId: "org-b" }],
    ["cross branch", { organizationId: "org-a", branchId: "branch-b" }],
    ["cross class", { organizationId: "org-a", classId: "class-b" }],
    ["cross student", { organizationId: "org-a", studentId: "student-b" }],
  ])("rejects %s access", (_name, resource) => {
    expect(() => assertAuthorized(context, "students:read", resource)).toThrowError(AuthorizationError);
    expect(() => assertAuthorized(context, "students:read", resource)).toThrow("scope_mismatch");
  });
  it("rejects missing permissions before resource access", () => {
    expect(() => assertAuthorized(context, "finance:export", { organizationId: "org-a" })).toThrow(
      "missing_permission",
    );
  });
  it("accepts an authorized resource and guard", () => {
    expect(
      enforceGuard(context, {
        permission: "students:read",
        resource: { organizationId: "org-a", branchId: "branch-a", studentId: "student-a" },
      }),
    ).toBe(true);
  });
  it("rejects expired delegation grants", () => {
    expect(
      hasScope(context, {
        userId: "u-a",
        kind: "student",
        resourceId: "student-a",
        effectiveTo: "2026-08-20T00:00:00Z",
      }),
    ).toBe(false);
  });
  it("requires server-derived context", () => {
    expect(() =>
      enforceGuard(undefined, { permission: "students:read", resource: { organizationId: "org-a" } }),
    ).toThrow("unauthenticated");
  });
});
