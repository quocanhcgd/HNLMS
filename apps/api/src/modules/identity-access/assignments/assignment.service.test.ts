import { describe, expect, it, vi } from "vitest";
import { AssignmentService, type AssignmentRepository } from "./assignment.service";

function repository(): AssignmentRepository {
  return {
    listRoles: vi.fn(async () => []),
    listUserRoleIds: vi.fn(async () => ["role.viewer"]),
    replaceUserRoles: vi.fn(async () => undefined),
    listScopeGrants: vi.fn(async () => []),
    createScopeGrant: vi.fn(async (input) => ({ id: "grant-1", ...input })),
    revokeScopeGrant: vi.fn(async () => undefined),
  };
}

describe("AssignmentService", () => {
  it("rejects mutations outside the actor organization", async () => {
    const repo = repository();
    const service = new AssignmentService(repo);
    await expect(
      service.createScopeGrant(
        { userId: "admin", organizationId: "org-a" },
        {
          userId: "member",
          organizationId: "org-b",
          kind: "branch",
          resourceId: "branch-1",
        },
      ),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(repo.createScopeGrant).not.toHaveBeenCalled();
  });

  it("writes role replacements and audits the before/after values", async () => {
    const repo = repository();
    const audit = vi.fn(async () => undefined);
    const service = new AssignmentService(repo, audit);
    await service.replaceUserRoles(
      { userId: "admin", organizationId: "org-a" },
      {
        userId: "member",
        roleIds: ["role.manager"],
      },
    );
    expect(repo.replaceUserRoles).toHaveBeenCalledWith({
      organizationId: "org-a",
      userId: "member",
      roleIds: ["role.manager"],
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "roles.replaced",
        before: ["role.viewer"],
        after: ["role.manager"],
      }),
    );
  });

  it("rejects an invalid grant period before persistence", async () => {
    const repo = repository();
    const service = new AssignmentService(repo);
    const from = new Date("2026-08-22T00:00:00Z");
    await expect(
      service.createScopeGrant(
        { userId: "admin", organizationId: "org-a" },
        {
          userId: "member",
          organizationId: "org-a",
          kind: "student",
          resourceId: "student-1",
          effectiveFrom: from,
          effectiveTo: new Date("2026-08-21T00:00:00Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "invalid_scope" });
    expect(repo.createScopeGrant).not.toHaveBeenCalled();
  });
});
