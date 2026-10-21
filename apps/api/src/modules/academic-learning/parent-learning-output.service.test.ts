import { describe, expect, it } from "vitest";
import { parseParentLearningOutput } from "@hnlms/domain-contracts";
import { InMemoryStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";
import { ParentLearningOutputError, ParentLearningOutputService } from "./parent-learning-output.service";
import { StudentLearningOutputService } from "./student-learning-output.service";

function fixture() {
  const repository = new InMemoryStudentLearningOutputRepository();
  repository.enrollments.push({
    organizationId: "org-1", studentId: "student-1", enrollmentId: "enrollment-1", enrollmentStatus: "active",
    classId: "class-1", className: "Lớp 1", branchId: "branch-1", subjectId: "math", subjectName: "Toán",
    programId: "program-1", programName: "Toán nền tảng", progressPercent: 60,
  });
  repository.schedules.push({ organizationId: "org-1", classId: "class-1", id: "schedule-1", weekday: 2, startsAt: "18:00", endsAt: "19:30", roomId: "room-1", teacherUserId: "teacher-1", publicationStatus: "published" });
  repository.materials.push({ organizationId: "org-1", id: "material-1", title: "Đại số căn bản", contentType: "lesson", version: 1, locale: "vi", publishedAt: "2026-08-25T08:00:00.000Z", publicationStatus: "published", classId: "class-1" });
  repository.scores.push({ organizationId: "org-1", enrollmentId: "enrollment-1", id: "score-1", assessmentId: "assessment-1", title: "Kiểm tra đại số", score: 8, maxScore: 10, recordedAt: "2026-08-25T08:00:00.000Z", publicationStatus: "published" });
  repository.attendance.push({ organizationId: "org-1", enrollmentId: "enrollment-1", id: "attendance-1", sessionId: "session-1", occurredAt: "2026-08-25T08:00:00.000Z", status: "present", publicationStatus: "published" });
  repository.feedback.push({ organizationId: "org-1", enrollmentId: "enrollment-1", id: "feedback-1", authorName: "Thầy Minh", summary: "Tiến bộ tốt.", publishedAt: "2026-08-25T08:00:00.000Z", publicationStatus: "published" });
  repository.competencies.push({ organizationId: "org-1", studentId: "student-1", enrollmentId: "enrollment-1", classId: "class-1", programId: "program-1", profileId: "profile-1", competencyCode: "algebra", competencyName: "Đại số", baseline: { label: "Cần hỗ trợ", normalizedScore: 40 }, current: { label: "Đạt", normalizedScore: 65 }, target: { label: "Vượt", normalizedScore: 80 }, confidence: 90, assessedAt: "2026-08-25T08:00:00.000Z", publicationStatus: "published" });
  return new ParentLearningOutputService(new StudentLearningOutputService(repository));
}

describe("T096 parent learning-output delegation", () => {
  it("reveals only output types granted for the selected student", async () => {
    const rows = await fixture().listForParent({
      userId: "parent-1", organizationId: "org-1", role: "parent",
      parentPermissionsByStudentId: new Map([["student-1", new Set(["view_progress", "view_scores", "view_feedback"] as const)]]),
    }, "student-1");
    const output = parseParentLearningOutput(rows[0]);
    expect(output.progressPercent).toBe(60);
    expect(output.scores).toHaveLength(1);
    expect(output.feedback).toHaveLength(1);
    expect(output.schedule).toEqual([]);
    expect(output.materials).toEqual([]);
    expect(output.attendance).toEqual([]);
    expect(output.competencySummaries).toEqual([]);
    expect(output.visibility).toEqual({ schedule: false, progress: true, scores: true, attendance: false, feedback: true, competency: false });
  });

  it("keeps schedule, attendance and competency permissions independent", async () => {
    const rows = await fixture().listForParent({
      userId: "parent-1", organizationId: "org-1", role: "parent",
      parentPermissionsByStudentId: new Map([["student-1", new Set(["view_schedule", "view_attendance", "view_competency"] as const)]]),
    }, "student-1");
    const output = parseParentLearningOutput(rows[0]);
    expect(output.progressPercent).toBeNull();
    expect(output.schedule).toHaveLength(1);
    expect(output.materials).toHaveLength(1);
    expect(output.attendance).toHaveLength(1);
    expect(output.competencySummaries).toHaveLength(1);
    expect(output.scores).toEqual([]);
    expect(output.feedback).toEqual([]);
  });

  it("rejects missing, wrong-student and cross-tenant delegation", async () => {
    const service = fixture();
    await expect(service.listForParent({ userId: "parent-1", organizationId: "org-1", role: "parent", parentPermissionsByStudentId: new Map() }, "student-1")).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<ParentLearningOutputError>);
    await expect(service.listForParent({ userId: "parent-1", organizationId: "org-1", role: "parent", parentPermissionsByStudentId: new Map([["student-2", new Set(["view_progress"] as const)]]) }, "student-1")).rejects.toMatchObject({ message: "parent_learning_output_delegation_required" });
    await expect(service.listForParent({ userId: "parent-1", organizationId: "org-2", role: "parent", parentPermissionsByStudentId: new Map([["student-1", new Set(["view_progress"] as const)]]) }, "student-1")).resolves.toEqual([]);
  });

  it("enforces an optional class scope on delegated access", async () => {
    const service = fixture();
    const actor = {
      userId: "parent-1",
      organizationId: "org-1",
      role: "parent" as const,
      parentPermissionsByStudentId: new Map([["student-1", new Set(["view_progress"] as const)]]),
      parentClassIdsByStudentId: new Map([["student-1", new Set(["class-1"])]]),
    };
    await expect(service.listForParent(actor, "student-1", { classId: "class-1" })).resolves.toHaveLength(1);
    await expect(service.listForParent(actor, "student-1", { classId: "class-other" })).rejects.toMatchObject({
      code: "forbidden",
      message: "parent_class_delegation_required",
    });
  });
});
