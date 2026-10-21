import { describe, expect, it } from "vitest";
import { AcademicRegistryController } from "../../src/modules/academic-learning/academic-registry.controller.js";

describe("academic registry scope", () => {
  const controller = new AcademicRegistryController();
  const headers = { "x-role": "branch_manager", "x-organization-id": "org-demo", "x-branch-id": "b1", "x-branch-ids": "b1" };
  it("returns only records from the assigned branch", async () => {
    expect((await controller.list(headers, "classes")).data).toHaveLength(1);
    expect((await controller.list(headers, "students")).data[0]).toMatchObject({ branchId: "b1" });
  });
  it("rejects a requested branch outside the assignment", async () => {
    await expect(controller.list({ ...headers, "x-branch-id": "b2" }, "classes")).rejects.toThrow("branch_scope_denied");
  });
  it("keeps organization roles cross-branch", async () => {
    expect((await controller.list({ "x-role": "academic_manager", "x-organization-id": "org-demo" }, "assignments")).data).toHaveLength(2);
  });
});
