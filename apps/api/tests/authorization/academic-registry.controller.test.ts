import { describe, expect, it } from "vitest";
import { AcademicRegistryController } from "../../src/modules/academic-learning/academic-registry.controller.js";

describe("AcademicRegistryController", () => {
  const controller = new AcademicRegistryController();
  it("does not expose another branch to branch manager", async () => {
    const result = await controller.list({ "x-role": "branch_manager", "x-organization-id": "org-demo", "x-branch-ids": "b1" }, "students");
    expect(result.data.every((row) => row.branchId === "b1")).toBe(true);
  });
  it("rejects missing branch scope", async () => {
    await expect(controller.list({ "x-role": "branch_manager", "x-organization-id": "org-demo" }, "classes")).rejects.toThrow("branch_scope_required");
  });
  it("returns branch-scoped form options", async () => {
    const result = await controller.options({ "x-role": "branch_manager", "x-organization-id": "org-demo", "x-branch-ids": "b1" });
    expect(result.data.classes.every((item) => item.branchId === "b1")).toBe(true);
    expect(result.data.employees.every((item) => item.status === "active")).toBe(true);
  });
  it("supports demo CRUD for classes and enrollment while enforcing branch scope", async () => {
    const headers = { "x-role": "branch_manager", "x-organization-id": "org-demo", "x-branch-ids": "b1", "x-branch-id": "b1" };
    const code = `QA-${Date.now()}`;
    const created = await controller.create(headers, "classes", { branchId: "b1", courseId: "course-class-if-2609", code, name: "Lớp kiểm thử", capacity: 2 });
    expect(created).toMatchObject({ code, branchId: "b1", learners: 0 });
    await expect(controller.create(headers, "classes", { branchId: "b2", courseId: "course-class-if-2609", code: `${code}-B2`, name: "Sai cơ sở", capacity: 2 })).rejects.toThrow("branch_scope_denied");
    const student = await controller.create(headers, "students", { classId: created.id, studentCode: `HV-${Date.now()}`, fullName: "Học viên kiểm thử" });
    expect(student).toMatchObject({ classId: created.id, name: "Học viên kiểm thử" });
    const updated = await controller.update(headers, "classes", created.id, { name: "Lớp đã chỉnh sửa" });
    expect(updated).toMatchObject({ id: created.id, name: "Lớp đã chỉnh sửa" });
    await expect(controller.update({ ...headers, "x-branch-ids": "b2" }, "classes", created.id, { name: "Không được phép" })).rejects.toThrow("branch_scope_denied");
    const archived = await controller.archive(headers, "classes", created.id);
    expect(archived).toMatchObject({ id: created.id, status: "cancelled" });
  });
});
