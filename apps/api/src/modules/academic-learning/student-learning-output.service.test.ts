import { describe, expect, it } from "vitest";
import { parseStudentLearningOutput } from "@hnlms/domain-contracts";
import { InMemoryStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";
import { StudentLearningOutputError, StudentLearningOutputService } from "./student-learning-output.service";

const repository = new InMemoryStudentLearningOutputRepository();
repository.enrollments.push({
  organizationId: "org-1",
  studentId: "student-1",
  enrollmentId: "enrollment-1",
  enrollmentStatus: "active",
  classId: "class-en-2609",
  className: "EN-2609",
  branchId: "branch-hn",
  subjectId: "english",
  subjectName: "Tiếng Anh",
  programId: "program-teen-b1",
  programName: "Teen B1",
  progressPercent: 42,
});
repository.schedules.push(
  {
    organizationId: "org-1",
    classId: "class-en-2609",
    id: "schedule-published",
    weekday: 2,
    startsAt: "18:00",
    endsAt: "19:30",
    roomId: "room-2",
    teacherUserId: "teacher-1",
    publicationStatus: "published",
  },
  {
    organizationId: "org-1",
    classId: "class-en-2609",
    id: "schedule-draft",
    weekday: 4,
    startsAt: "18:00",
    endsAt: "19:30",
    roomId: "room-4",
    teacherUserId: "teacher-1",
    publicationStatus: "draft",
  },
);
repository.materials.push(
  {
    organizationId: "org-1",
    id: "material-published",
    title: "Listening clinic",
    contentType: "lesson",
    version: 2,
    locale: "vi",
    publishedAt: "2026-08-25T08:00:00.000Z",
    estimatedDurationMinutes: 45,
    publicationStatus: "published",
    classId: "class-en-2609",
  },
  {
    organizationId: "org-1",
    id: "material-private",
    title: "Teacher answer key",
    contentType: "document",
    version: 1,
    locale: "vi",
    publishedAt: "2026-08-25T08:00:00.000Z",
    publicationStatus: "draft",
    classId: "class-en-2609",
  },
);
repository.scores.push(
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "score-published",
    assessmentId: "mock-1",
    title: "Thi thử giữa kỳ",
    score: 82,
    maxScore: 100,
    weight: 1,
    recordedAt: "2026-08-24T08:00:00.000Z",
    publicationStatus: "published",
  },
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "score-draft",
    assessmentId: "writing-1",
    title: "Bài viết đang chấm",
    score: 70,
    maxScore: 100,
    recordedAt: "2026-08-25T08:00:00.000Z",
    publicationStatus: "draft",
  },
);
repository.attendance.push(
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "attendance-published",
    sessionId: "session-5",
    occurredAt: "2026-08-22T11:00:00.000Z",
    status: "present",
    publicationStatus: "published",
  },
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "attendance-draft",
    sessionId: "session-6",
    occurredAt: "2026-08-24T11:00:00.000Z",
    status: "absent",
    publicationStatus: "draft",
  },
);
repository.feedback.push(
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "feedback-published",
    authorName: "Cô Lan",
    summary: "Cần luyện nghe ý chính thêm trong tuần này.",
    publishedAt: "2026-08-24T12:00:00.000Z",
    publicationStatus: "published",
  },
  {
    organizationId: "org-1",
    enrollmentId: "enrollment-1",
    id: "feedback-internal",
    authorName: "Cô Lan",
    summary: "Trao đổi nội bộ với học vụ.",
    publishedAt: "2026-08-24T12:00:00.000Z",
    publicationStatus: "draft",
  },
);
repository.competencies.push({
  organizationId: "org-1",
  studentId: "student-1",
  enrollmentId: "enrollment-1",
  classId: "class-en-2609",
  programId: "program-teen-b1",
  profileId: "profile-1",
  competencyCode: "listening-main-idea",
  competencyName: "Nghe · ý chính",
  baseline: { label: "A1", normalizedScore: 35 },
  current: { label: "A2", normalizedScore: 58 },
  target: { label: "B1", normalizedScore: 70 },
  confidence: 78,
  assessedAt: "2026-08-24T12:00:00.000Z",
  publicationStatus: "published",
});

const service = new StudentLearningOutputService(repository);

describe("T095 student learning-output read model", () => {
  it("returns one enrollment output with only published learning records", async () => {
    const rows = await service.listForStudent(
      { userId: "student-1", organizationId: "org-1", role: "student", studentId: "student-1" },
      "student-1",
    );
    expect(rows).toHaveLength(1);
    const output = parseStudentLearningOutput(rows[0]);
    expect(output).toMatchObject({
      enrollmentId: "enrollment-1",
      classId: "class-en-2609",
      programId: "program-teen-b1",
      progressPercent: 42,
    });
    expect(output.schedule).toHaveLength(1);
    expect(output.materials).toHaveLength(1);
    expect(output.scores).toHaveLength(1);
    expect(output.attendance).toHaveLength(1);
    expect(output.feedback).toHaveLength(1);
    expect(output.competencySummaries).toHaveLength(1);
    expect(JSON.stringify(output)).not.toContain("Teacher answer key");
    expect(JSON.stringify(output)).not.toContain("Trao đổi nội bộ");
  });

  it("filters by enrollment/program/class without crossing student or tenant scope", async () => {
    await expect(service.listForStudent(
      { userId: "student-2", organizationId: "org-1", role: "student", studentId: "student-2" },
      "student-1",
    )).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<StudentLearningOutputError>);
    await expect(service.listForStudent(
      { userId: "student-1", organizationId: "org-2", role: "student", studentId: "student-1" },
      "student-1",
    )).resolves.toEqual([]);
    await expect(service.listForStudent(
      { userId: "student-1", organizationId: "org-1", role: "student", studentId: "student-1" },
      "student-1",
      { classId: "class-other" },
    )).resolves.toEqual([]);
    await expect(service.listForStudent(
      { userId: "student-1", organizationId: "org-1", role: "student", studentId: "student-1" },
      "student-1",
      { programId: "program-teen-b1", enrollmentId: "enrollment-1" },
    )).resolves.toHaveLength(1);
  });

  it("whitelists public fields even when source records contain operational secrets", async () => {
    Object.assign(repository.scores[0]!, { privateReviewerNote: "review-only", internalWorklogId: "worklog-secret" });
    Object.assign(repository.feedback[0]!, { internalHandoff: { queue: "academic" } });
    const rows = await service.listForStudent({ userId: "student-1", organizationId: "org-1", role: "student", studentId: "student-1" }, "student-1");
    expect(JSON.stringify(rows)).not.toContain("review-only");
    expect(JSON.stringify(rows)).not.toContain("worklog-secret");
    expect(JSON.stringify(rows)).not.toContain("internalHandoff");
  });
});
