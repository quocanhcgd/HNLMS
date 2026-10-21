import { BadRequestException, Body, Controller, Get, Headers, Param, Patch, Post, Query } from "@nestjs/common";
import { demoStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";
import { demoLearningAssignmentRepository, type AssignmentLifecycle, type LearningAssignment } from "./in-memory-learning-assignment-repository";
import { notifyTeacherOfLearningSubmission } from "../communication/teacher-communication.controller";
import { ensureLearningAssignmentsLoaded, ensureLearningOutputLoaded, persistLearningAssignments, persistLearningOutput } from "./durable-workflow-state";

type HeaderMap = Record<string, string | string[] | undefined>;
const header = (headers: HeaderMap, key: string) => Array.isArray(headers[key]) ? headers[key]?.[0] ?? "" : String(headers[key] ?? "");
function requireActor(headers: HeaderMap, role: "teacher" | "student") {
  const userId = header(headers, "x-user-id");
  if (!userId) throw new BadRequestException(role + "_identity_required");
  return { organizationId: header(headers, "x-organization-id") || "org-1", userId };
}
function assignmentInput(body: Partial<LearningAssignment>) {
  const maxScore = Number(body.maxScore ?? 10); const attempts = Number(body.attempts ?? 1);
  if (!body.title?.trim() || !body.type?.trim() || !body.instructions?.trim() || !Number.isFinite(maxScore) || maxScore <= 0 || !Number.isInteger(attempts) || attempts < 1) throw new BadRequestException("assignment_input_invalid");
  return { title: body.title.trim(), type: body.type.trim(), instructions: body.instructions.trim(), rubric: body.rubric?.trim() || undefined, dueAt: body.dueAt?.trim() || undefined, sessionId: body.sessionId?.trim() || undefined, programId: body.programId?.trim() || undefined, maxScore, attempts, attachmentName: body.attachmentName?.trim() || undefined };
}

@Controller()
export class TeacherLearningAssignmentController {
  @Get("teacher/learning/assignments")
  async listTeacher(@Headers() headers: HeaderMap, @Query("classId") classId?: string) {
    const { organizationId } = requireActor(headers, "teacher");
    if (!classId?.trim()) throw new BadRequestException("assignment_class_required");
    await ensureLearningAssignmentsLoaded(organizationId);
    return demoLearningAssignmentRepository.listAssignments({ organizationId, classId: classId.trim() }).map((assignment) => ({ ...assignment, submissions: demoLearningAssignmentRepository.listSubmissions({ organizationId, assignmentId: assignment.id }) }));
  }
  @Post("teacher/learning/assignments")
  async create(@Headers() headers: HeaderMap, @Body() body: Partial<LearningAssignment> & { classId?: string }) {
    const { organizationId } = requireActor(headers, "teacher");
    if (!body.classId?.trim()) throw new BadRequestException("assignment_class_required");
    await ensureLearningAssignmentsLoaded(organizationId);
    const created = demoLearningAssignmentRepository.createAssignment({ id: "assignment-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7), organizationId, classId: body.classId.trim(), lifecycle: "draft", createdAt: new Date().toISOString(), ...assignmentInput(body) });
    await persistLearningAssignments(organizationId);
    return created;
  }
  @Patch("teacher/learning/assignments/:id")
  async update(@Headers() headers: HeaderMap, @Param("id") id: string, @Body() body: Partial<LearningAssignment>) {
    const { organizationId } = requireActor(headers, "teacher");
    await ensureLearningAssignmentsLoaded(organizationId);
    const updated = demoLearningAssignmentRepository.updateAssignment({ organizationId, id, changes: assignmentInput(body) });
    if (!updated) throw new BadRequestException("assignment_not_found");
    await persistLearningAssignments(organizationId);
    return updated;
  }
  @Post("teacher/learning/assignments/:id/publish")
  async publish(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const { organizationId } = requireActor(headers, "teacher");
    await ensureLearningAssignmentsLoaded(organizationId);
    const updated = demoLearningAssignmentRepository.updateAssignment({ organizationId, id, changes: { lifecycle: "assigned" as AssignmentLifecycle, publishedAt: new Date().toISOString() } });
    if (!updated) throw new BadRequestException("assignment_not_found");
    await persistLearningAssignments(organizationId);
    return updated;
  }
  @Post("teacher/learning/assignments/:id/archive")
  async archive(@Headers() headers: HeaderMap, @Param("id") id: string) {
    const { organizationId } = requireActor(headers, "teacher");
    await ensureLearningAssignmentsLoaded(organizationId);
    const updated = demoLearningAssignmentRepository.updateAssignment({ organizationId, id, changes: { lifecycle: "archived" as AssignmentLifecycle } });
    if (!updated) throw new BadRequestException("assignment_not_found");
    await persistLearningAssignments(organizationId);
    return updated;
  }
  @Post("teacher/learning/assignments/:id/submissions/:submissionId/grade")
  async grade(@Headers() headers: HeaderMap, @Param("id") assignmentId: string, @Param("submissionId") submissionId: string, @Body() body: { score?: number; feedback?: string; publicationStatus?: "draft" | "published" }) {
    const { organizationId, userId } = requireActor(headers, "teacher");
    await ensureLearningAssignmentsLoaded(organizationId);
    const assignment = demoLearningAssignmentRepository.findAssignment({ organizationId, id: assignmentId }); const score = Number(body.score);
    if (!assignment || !Number.isFinite(score) || score < 0 || score > assignment.maxScore) throw new BadRequestException("grade_input_invalid");
    const publicationStatus = body.publicationStatus === "published" ? "published" as const : "draft" as const;
    const submission = demoLearningAssignmentRepository.gradeSubmission({ organizationId, assignmentId, submissionId, score, feedback: body.feedback, publicationStatus, actorUserId: userId });
    if (!submission) throw new BadRequestException("submission_not_found");
    await persistLearningAssignments(organizationId);
    if (publicationStatus === "published") {
      await ensureLearningOutputLoaded(organizationId);
      await demoStudentLearningOutputRepository.upsertScore({ organizationId, enrollmentId: submission.enrollmentId, id: "score-assignment-" + assignmentId + "-" + submission.studentId, assessmentId: "assignment:" + assignmentId + ":" + submission.studentId, title: assignment.title, score, maxScore: assignment.maxScore, recordedAt: new Date().toISOString(), publicationStatus: "published" });
      await persistLearningOutput(organizationId);
    }
    return submission;
  }
  @Post("teacher/learning/assignments/:id/submissions/:submissionId/void")
  async voidGrade(@Headers() headers: HeaderMap, @Param("id") assignmentId: string, @Param("submissionId") submissionId: string) {
    const { organizationId, userId } = requireActor(headers, "teacher");
    await ensureLearningAssignmentsLoaded(organizationId);
    const submission = demoLearningAssignmentRepository.voidGrade({ organizationId, assignmentId, submissionId, actorUserId: userId });
    if (!submission) throw new BadRequestException("published_grade_not_found");
    const assignment = demoLearningAssignmentRepository.findAssignment({ organizationId, id: assignmentId });
    if (assignment) {
      await ensureLearningOutputLoaded(organizationId);
      await demoStudentLearningOutputRepository.upsertScore({ organizationId, enrollmentId: submission.enrollmentId, id: "score-assignment-" + assignmentId + "-" + submission.studentId, assessmentId: "assignment:" + assignmentId + ":" + submission.studentId, title: assignment.title, score: submission.score ?? 0, maxScore: assignment.maxScore, recordedAt: new Date().toISOString(), publicationStatus: "draft" });
      await persistLearningOutput(organizationId);
    }
    await persistLearningAssignments(organizationId);
    return submission;
  }
  @Get("student/learning/assignments")
  async listStudent(@Headers() headers: HeaderMap, @Query("studentId") studentId?: string, @Query("classId") classId?: string) {
    const { organizationId } = requireActor(headers, "student"); const effectiveStudentId = header(headers, "x-student-id") || studentId;
    if (!effectiveStudentId?.trim()) throw new BadRequestException("student_identity_required");
    await ensureLearningAssignmentsLoaded(organizationId);
    return demoLearningAssignmentRepository.listAssignments({ organizationId, classId: classId?.trim() || "if-2609" }).filter((item) => item.lifecycle === "assigned").map((assignment) => ({ ...assignment, submission: demoLearningAssignmentRepository.listSubmissions({ organizationId, assignmentId: assignment.id, studentId: effectiveStudentId })[0] ?? null }));
  }
  @Post("student/learning/assignments/:id/submission")
  async submit(@Headers() headers: HeaderMap, @Param("id") assignmentId: string, @Body() body: { studentId?: string; enrollmentId?: string; answer?: string; lifecycle?: "draft" | "submitted" }) {
    const { organizationId } = requireActor(headers, "student"); const studentId = header(headers, "x-student-id") || body.studentId;
    await ensureLearningAssignmentsLoaded(organizationId);
    const assignment = demoLearningAssignmentRepository.findAssignment({ organizationId, id: assignmentId });
    if (!studentId?.trim() || !body.enrollmentId?.trim() || !assignment || assignment.lifecycle !== "assigned" || !body.answer?.trim()) throw new BadRequestException("submission_input_invalid");
    const lifecycle = body.lifecycle === "draft" ? "draft" as const : "submitted" as const;
    const submission = demoLearningAssignmentRepository.saveSubmission({ organizationId, assignmentId, studentId: studentId.trim(), enrollmentId: body.enrollmentId.trim(), answer: body.answer.trim(), lifecycle, ...(lifecycle === "submitted" ? { submittedAt: new Date().toISOString() } : {}) });
    await persistLearningAssignments(organizationId);
    if (lifecycle === "submitted") await notifyTeacherOfLearningSubmission({ organizationId, assignmentId, assignmentTitle: assignment.title, classId: assignment.classId, studentId: studentId.trim() });
    return submission;
  }
}
