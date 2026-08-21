import { describe, expect, it, vi } from "vitest";
import { BranchService, type BranchRepository } from "../../src/modules/organization-branch/branch.service";
import {
  AssignmentService,
  type AssignmentRepository,
} from "../../src/modules/identity-access/assignments/assignment.service";
import {
  InMemoryOrganizationBranchRepository,
  OrganizationBranchService,
} from "../../src/modules/organization-branch/service";

describe("US1 organization contract", () => {
  it("keeps branch data inside organization scope", async () => {
    const repository = {
      findById: vi.fn(async () => null),
      list: vi.fn(async () => []),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as BranchRepository;
    await expect(
      new BranchService(repository).get({ userId: "admin", organizationId: "org-a" }, "branch-b"),
    ).rejects.toMatchObject({ code: "not_found" });
  });
  it("rejects cross-organization scope grant mutation", async () => {
    const repository = {
      listRoles: vi.fn(),
      listUserRoleIds: vi.fn(),
      replaceUserRoles: vi.fn(),
      listScopeGrants: vi.fn(),
      createScopeGrant: vi.fn(),
      revokeScopeGrant: vi.fn(),
    } as unknown as AssignmentRepository;
    await expect(
      new AssignmentService(repository).createScopeGrant(
        { userId: "admin", organizationId: "org-a" },
        { userId: "u", organizationId: "org-b", kind: "branch", resourceId: "b" },
      ),
    ).rejects.toMatchObject({ code: "forbidden" });
  });
  it("enforces optimistic version on organization settings", async () => {
    const service = new OrganizationBranchService(new InMemoryOrganizationBranchRepository());
    const context = { organizationId: "org-a", userId: "admin" };
    await service.saveSetting(context, "timezone", "UTC");
    await expect(service.saveSetting(context, "timezone", "Asia/Ho_Chi_Minh", 0)).rejects.toThrow(
      "setting_version_conflict",
    );
  });
});
