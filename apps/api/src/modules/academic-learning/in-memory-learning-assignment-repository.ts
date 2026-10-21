export type AssignmentLifecycle = "draft" | "assigned" | "archived";
export type SubmissionLifecycle = "draft" | "submitted" | "graded";

export type LearningAssignment = {
  id: string;
  organizationId: string;
  classId: string;
  programId?: string;
  sessionId?: string;
  title: string;
  type: string;
  instructions: string;
  rubric?: string;
  dueAt?: string;
  maxScore: number;
  attempts: number;
  attachmentName?: string;
  lifecycle: AssignmentLifecycle;
  createdAt: string;
  publishedAt?: string;
};

export type LearningSubmission = {
  id: string;
  organizationId: string;
  assignmentId: string;
  studentId: string;
  enrollmentId: string;
  answer: string;
  lifecycle: SubmissionLifecycle;
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradePublicationStatus?: "draft" | "published" | "voided";
  gradedAt?: string;
};

export type LearningGradeAudit = {
  id: string;
  organizationId: string;
  assignmentId: string;
  submissionId: string;
  action: "graded" | "published" | "voided";
  actorUserId?: string;
  occurredAt: string;
  snapshot: { score?: number; feedback?: string; gradePublicationStatus?: "draft" | "published" | "voided" };
};

const seededAt = "2026-08-25T08:00:00.000Z";

export class InMemoryLearningAssignmentRepository {
  readonly assignments: LearningAssignment[] = [
    { id: "assignment-if-writing", organizationId: "org-1", classId: "if-2609", programId: "ielts-foundation-a2", sessionId: "session-5", title: "Writing Task 1", type: "Bài tập về nhà", instructions: "Viết một đoạn văn 120-150 từ theo yêu cầu của buổi học.", rubric: "Đúng yêu cầu 6 điểm; diễn đạt 2 điểm; trình bày 2 điểm.", dueAt: "2026-09-03T14:00:00.000Z", maxScore: 10, attempts: 1, attachmentName: "writing-task-1.pdf", lifecycle: "assigned", createdAt: seededAt, publishedAt: seededAt },
    { id: "assignment-if-listening", organizationId: "org-1", classId: "if-2609", programId: "ielts-foundation-a2", sessionId: "session-5", title: "Listening practice Unit 3", type: "Bài luyện tập", instructions: "Nghe học liệu đã công bố, ghi lại ý chính và ba thông tin chi tiết.", rubric: "Ý chính 4 điểm; chi tiết 4 điểm; trình bày 2 điểm.", dueAt: "2026-08-24T14:00:00.000Z", maxScore: 10, attempts: 1, lifecycle: "assigned", createdAt: seededAt, publishedAt: seededAt },
  ];
  readonly submissions: LearningSubmission[] = [
    { id: "submission-if-listening-minh-anh", organizationId: "org-1", assignmentId: "assignment-if-listening", studentId: "student-minh-anh", enrollmentId: "enrollment-if-2609-minh-anh", answer: "Ý chính: nhận diện thông tin trọng tâm. Chi tiết: thời gian, địa điểm và hành động.", lifecycle: "graded", submittedAt: "2026-08-24T12:30:00.000Z", score: 8.5, feedback: "Đã nắm ý chính; cần ghi chú thông tin chi tiết đầy đủ hơn.", gradePublicationStatus: "published", gradedAt: seededAt },
    { id: "submission-if-writing-gia-huy", organizationId: "org-1", assignmentId: "assignment-if-writing", studentId: "student-gia-huy", enrollmentId: "enrollment-if-2609-gia-huy", answer: "Bài làm kiểm thử: mô tả biểu đồ theo cấu trúc mở bài, tổng quan và chi tiết.", lifecycle: "submitted", submittedAt: "2026-09-01T08:40:00.000Z" },
  ];
  readonly gradeAudits: LearningGradeAudit[] = [];

  listAssignments(input: { organizationId: string; classId: string; includeArchived?: boolean }) {
    return structuredClone(this.assignments.filter((item) => item.organizationId === input.organizationId && item.classId === input.classId && (input.includeArchived || item.lifecycle !== "archived")));
  }
  findAssignment(input: { organizationId: string; id: string }) {
    const item = this.assignments.find((entry) => entry.organizationId === input.organizationId && entry.id === input.id);
    return item ? structuredClone(item) : null;
  }
  createAssignment(record: LearningAssignment) { this.assignments.unshift(structuredClone(record)); return structuredClone(record); }
  updateAssignment(input: { organizationId: string; id: string; changes: Partial<Omit<LearningAssignment, "id" | "organizationId" | "classId" | "createdAt">> }) {
    const item = this.assignments.find((entry) => entry.organizationId === input.organizationId && entry.id === input.id);
    if (!item) return null;
    Object.assign(item, structuredClone(input.changes));
    return structuredClone(item);
  }
  listSubmissions(input: { organizationId: string; assignmentId?: string; studentId?: string }) {
    return structuredClone(this.submissions.filter((item) => item.organizationId === input.organizationId && (!input.assignmentId || item.assignmentId === input.assignmentId) && (!input.studentId || item.studentId === input.studentId)));
  }
  saveSubmission(input: Omit<LearningSubmission, "id"> & { id?: string }) {
    const existing = this.submissions.find((item) => item.organizationId === input.organizationId && item.assignmentId === input.assignmentId && item.studentId === input.studentId);
    if (existing) { Object.assign(existing, structuredClone(input)); return structuredClone(existing); }
    const created = { ...input, id: input.id ?? "submission-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) } as LearningSubmission;
    this.submissions.push(structuredClone(created));
    return structuredClone(created);
  }
  gradeSubmission(input: { organizationId: string; assignmentId: string; submissionId: string; score: number; feedback?: string; publicationStatus: "draft" | "published"; actorUserId?: string }) {
    const item = this.submissions.find((entry) => entry.organizationId === input.organizationId && entry.assignmentId === input.assignmentId && entry.id === input.submissionId);
    if (!item) return null;
    Object.assign(item, { lifecycle: "graded" as const, score: input.score, feedback: input.feedback?.trim() || undefined, gradePublicationStatus: input.publicationStatus, gradedAt: new Date().toISOString() });
    this.gradeAudits.push({ id: `grade-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, organizationId: input.organizationId, assignmentId: input.assignmentId, submissionId: input.submissionId, action: input.publicationStatus === "published" ? "published" : "graded", actorUserId: input.actorUserId, occurredAt: new Date().toISOString(), snapshot: { score: item.score, feedback: item.feedback, gradePublicationStatus: item.gradePublicationStatus } });
    return structuredClone(item);
  }
  voidGrade(input: { organizationId: string; assignmentId: string; submissionId: string; actorUserId?: string }) {
    const item = this.submissions.find((entry) => entry.organizationId === input.organizationId && entry.assignmentId === input.assignmentId && entry.id === input.submissionId);
    if (!item || item.lifecycle !== "graded" || item.gradePublicationStatus !== "published") return null;
    // Keep the graded submission immutable for audit/history while removing it from learner-facing output.
    item.gradePublicationStatus = "voided";
    this.gradeAudits.push({ id: `grade-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, organizationId: input.organizationId, assignmentId: input.assignmentId, submissionId: input.submissionId, action: "voided", actorUserId: input.actorUserId, occurredAt: new Date().toISOString(), snapshot: { score: item.score, feedback: item.feedback, gradePublicationStatus: item.gradePublicationStatus } });
    return structuredClone(item);
  }
}

export const demoLearningAssignmentRepository = new InMemoryLearningAssignmentRepository();
