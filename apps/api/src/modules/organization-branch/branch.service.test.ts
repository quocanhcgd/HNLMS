import { describe, expect, it, vi } from "vitest";
import { BranchService, type Branch, type BranchRepository } from "./branch.service";

const baseBranch = (overrides: Partial<Branch> = {}): Branch => ({
  id: "branch-1",
  organizationId: "org-a",
  code: "HN",
  name: "Ha Noi",
  address: null,
  phone: null,
  email: null,
  managerUserId: null,
  status: "active",
  openedOn: null,
  closedOn: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

function repository(branch = baseBranch()): BranchRepository {
  return {
    list: vi.fn(async () => [branch]),
    findById: vi.fn(async () => branch),
    create: vi.fn(async (input) => baseBranch({ ...input, id: "branch-new" })),
    update: vi.fn(async ({ changes }) => baseBranch({ ...branch, ...changes, updatedAt: new Date() })),
  };
}

const orgActor = { userId: "admin", organizationId: "org-a" };

describe("BranchService", () => {
  it("passes the actor organization and branch scope to list", async () => {
    const repo = repository();
    await new BranchService(repo).list({ ...orgActor, branchIds: new Set(["branch-1"]) });
    expect(repo.list).toHaveBeenCalledWith({
      organizationId: "org-a",
      branchIds: new Set(["branch-1"]),
      includeArchived: undefined,
    });
  });

  it("rejects reads outside the actor branch scope", async () => {
    const repo = repository();
    await expect(
      new BranchService(repo).get({ ...orgActor, branchIds: new Set(["branch-2"]) }, "branch-1"),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("creates an organization-owned branch and audits it", async () => {
    const repo = repository();
    const audit = vi.fn(async () => undefined);
    const branch = await new BranchService(repo, audit).create(orgActor, { code: " HN ", name: " Ha Noi " });
    expect(repo.create).toHaveBeenCalledWith({ organizationId: "org-a", code: "HN", name: "Ha Noi" });
    expect(branch.id).toBe("branch-new");
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "created", entityId: "branch-new" }));
  });

  it("deactivates and archives without physically deleting the branch", async () => {
    const repo = repository();
    const service = new BranchService(repo);
    await service.deactivate(orgActor, "branch-1");
    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-a",
        branchId: "branch-1",
        changes: expect.objectContaining({ status: "inactive" }),
      }),
    );
    await service.remove(orgActor, "branch-1");
    expect(repo.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ changes: expect.objectContaining({ status: "archived" }) }),
    );
  });

  it("does not reactivate an archived branch or update it", async () => {
    const repo = repository(baseBranch({ status: "archived" }));
    const service = new BranchService(repo);
    await expect(service.activate(orgActor, "branch-1")).rejects.toMatchObject({ code: "invalid_status" });
    await expect(service.update(orgActor, "branch-1", { name: "New" })).rejects.toMatchObject({
      code: "invalid_status",
    });
    expect(repo.update).not.toHaveBeenCalled();
  });
});
