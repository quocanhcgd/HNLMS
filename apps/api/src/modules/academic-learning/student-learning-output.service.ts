import type { StudentLearningOutput } from "@hnlms/domain-contracts";

export type StudentLearningOutputActor = {
  userId: string;
  organizationId: string;
  role: "student";
  studentId: string;
};

export type StudentLearningOutputFilters = {
  enrollmentId?: string;
  classId?: string;
  programId?: string;
};

export type StudentLearningEnrollmentRecord = {
  organizationId: string;
  studentId: string;
  enrollmentId: string;
  enrollmentStatus: StudentLearningOutput["enrollmentStatus"];
  classId: string;
  className: string;
  branchId: string | null;
  subjectId: string;
  subjectName: string;
  programId: string;
  programName: string;
  progressPercent: number;
};

export type StudentLearningScheduleRecord = {
  organizationId: string;
  classId: string;
  id: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  teacherUserId: string | null;
  publicationStatus: "draft" | "published";
};

export type StudentLearningMaterialRecord = {
  organizationId: string;
  id: string;
  title: string;
  contentType: string;
  version: number;
  locale: string;
  publishedAt: string;
  estimatedDurationMinutes?: number;
  publicationStatus: "draft" | "published";
  classId?: string;
  programId?: string;
  sessionId?: string;
  source?: string;
};

export type StudentLearningScoreRecord = {
  organizationId: string;
  enrollmentId: string;
  id: string;
  assessmentId: string;
  title: string;
  score: number;
  maxScore: number;
  weight?: number;
  recordedAt: string;
  publicationStatus: "draft" | "published";
};

export type StudentLearningAttendanceRecord = {
  organizationId: string;
  enrollmentId: string;
  id: string;
  sessionId: string;
  occurredAt: string;
  status: "present" | "late" | "absent" | "excused";
  publicationStatus: "draft" | "published";
};

export type StudentLearningFeedbackRecord = {
  organizationId: string;
  enrollmentId: string;
  id: string;
  authorName: string;
  summary: string;
  publishedAt: string;
  publicationStatus: "draft" | "published";
};

export type StudentLearningCompetencyRecord = StudentLearningOutput["competencySummaries"][number] & {
  organizationId: string;
  studentId: string;
  enrollmentId?: string;
  classId?: string;
  programId?: string;
  publicationStatus: "draft" | "published";
};

export type StudentLearningOutputRepository = {
  listEnrollments(input: { organizationId: string; studentId: string }): Promise<StudentLearningEnrollmentRecord[]>;
  listSchedules(input: { organizationId: string; classIds: ReadonlySet<string> }): Promise<StudentLearningScheduleRecord[]>;
  listMaterials(input: { organizationId: string; classIds: ReadonlySet<string>; programIds: ReadonlySet<string> }): Promise<StudentLearningMaterialRecord[]>;
  listScores(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }): Promise<StudentLearningScoreRecord[]>;
  listAttendance(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }): Promise<StudentLearningAttendanceRecord[]>;
  listFeedback(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }): Promise<StudentLearningFeedbackRecord[]>;
  listCompetencies(input: { organizationId: string; studentId: string; enrollmentIds: ReadonlySet<string>; classIds: ReadonlySet<string>; programIds: ReadonlySet<string> }): Promise<StudentLearningCompetencyRecord[]>;
  addMaterial?(record: StudentLearningMaterialRecord): Promise<StudentLearningMaterialRecord>;
  updateMaterialPublication?(input: { organizationId: string; id: string; publicationStatus: "draft" | "published"; publishedAt?: string }): Promise<StudentLearningMaterialRecord | null>;
  updateMaterial?(input: { organizationId: string; id: string; changes: Partial<Omit<StudentLearningMaterialRecord, "organizationId" | "id">> }): Promise<StudentLearningMaterialRecord | null>;
  addScore?(record: StudentLearningScoreRecord): Promise<StudentLearningScoreRecord>;
  upsertScore?(record: StudentLearningScoreRecord): Promise<StudentLearningScoreRecord>;
};

export class StudentLearningOutputError extends Error {
  constructor(public readonly code: "forbidden" | "invalid_input" | string, message = code) {
    super(message);
    this.name = "StudentLearningOutputError";
  }
}

function assertStudentScope(actor: StudentLearningOutputActor, studentId: string): void {
  if (actor.role !== "student" || actor.studentId !== studentId) {
    throw new StudentLearningOutputError("forbidden", "student_self_scope_required");
  }
}

function inScope<T extends { organizationId: string }>(items: T[], organizationId: string): T[] {
  return items.filter((item) => item.organizationId === organizationId);
}

export class StudentLearningOutputService {
  constructor(private readonly repository: StudentLearningOutputRepository) {}

  async listForStudent(
    actor: StudentLearningOutputActor,
    studentId: string,
    filters: StudentLearningOutputFilters = {},
  ): Promise<StudentLearningOutput[]> {
    assertStudentScope(actor, studentId);
    const enrollments = inScope(await this.repository.listEnrollments({ organizationId: actor.organizationId, studentId }), actor.organizationId)
      .filter((enrollment) => enrollment.studentId === studentId)
      .filter((enrollment) => !filters.enrollmentId || enrollment.enrollmentId === filters.enrollmentId)
      .filter((enrollment) => !filters.classId || enrollment.classId === filters.classId)
      .filter((enrollment) => !filters.programId || enrollment.programId === filters.programId);
    if (enrollments.length === 0) return [];

    const enrollmentIds = new Set(enrollments.map((enrollment) => enrollment.enrollmentId));
    const classIds = new Set(enrollments.map((enrollment) => enrollment.classId));
    const programIds = new Set(enrollments.map((enrollment) => enrollment.programId));
    const [schedules, materials, scores, attendance, feedback, competencies] = await Promise.all([
      this.repository.listSchedules({ organizationId: actor.organizationId, classIds }),
      this.repository.listMaterials({ organizationId: actor.organizationId, classIds, programIds }),
      this.repository.listScores({ organizationId: actor.organizationId, enrollmentIds }),
      this.repository.listAttendance({ organizationId: actor.organizationId, enrollmentIds }),
      this.repository.listFeedback({ organizationId: actor.organizationId, enrollmentIds }),
      this.repository.listCompetencies({ organizationId: actor.organizationId, studentId, enrollmentIds, classIds, programIds }),
    ]);

    const publishedSchedules = inScope(schedules, actor.organizationId).filter((item) => item.publicationStatus === "published");
    const publishedMaterials = inScope(materials, actor.organizationId).filter((item) => item.publicationStatus === "published");
    const publishedScores = inScope(scores, actor.organizationId).filter((item) => item.publicationStatus === "published");
    const publishedAttendance = inScope(attendance, actor.organizationId).filter((item) => item.publicationStatus === "published");
    const publishedFeedback = inScope(feedback, actor.organizationId).filter((item) => item.publicationStatus === "published");
    const publishedCompetencies = inScope(competencies, actor.organizationId)
      .filter((item) => item.studentId === studentId && item.publicationStatus === "published");

    return enrollments.map((enrollment) => ({
      organizationId: actor.organizationId,
      studentId,
      enrollmentId: enrollment.enrollmentId,
      enrollmentStatus: enrollment.enrollmentStatus,
      classId: enrollment.classId,
      className: enrollment.className,
      branchId: enrollment.branchId,
      subjectId: enrollment.subjectId,
      subjectName: enrollment.subjectName,
      programId: enrollment.programId,
      programName: enrollment.programName,
      progressPercent: Math.min(100, Math.max(0, enrollment.progressPercent)),
      schedule: publishedSchedules
        .filter((item) => item.classId === enrollment.classId)
        .map((item) => ({ id: item.id, weekday: item.weekday, startsAt: item.startsAt, endsAt: item.endsAt, roomId: item.roomId, teacherUserId: item.teacherUserId })),
      materials: publishedMaterials
        .filter((item) => (!item.classId || item.classId === enrollment.classId) && (!item.programId || item.programId === enrollment.programId))
        .map((item) => ({ id: item.id, title: item.title, contentType: item.contentType, version: item.version, locale: item.locale, publishedAt: item.publishedAt, ...(item.estimatedDurationMinutes === undefined ? {} : { estimatedDurationMinutes: item.estimatedDurationMinutes }), ...(item.sessionId === undefined ? {} : { sessionId: item.sessionId }), ...(item.source === undefined ? {} : { source: item.source }) })),
      scores: publishedScores
        .filter((item) => item.enrollmentId === enrollment.enrollmentId)
        .map((item) => ({ id: item.id, assessmentId: item.assessmentId, title: item.title, score: item.score, maxScore: item.maxScore, ...(item.weight === undefined ? {} : { weight: item.weight }), recordedAt: item.recordedAt })),
      attendance: publishedAttendance
        .filter((item) => item.enrollmentId === enrollment.enrollmentId)
        .map((item) => ({ id: item.id, sessionId: item.sessionId, occurredAt: item.occurredAt, status: item.status })),
      feedback: publishedFeedback
        .filter((item) => item.enrollmentId === enrollment.enrollmentId)
        .map((item) => ({ id: item.id, authorName: item.authorName, summary: item.summary, publishedAt: item.publishedAt })),
      competencySummaries: publishedCompetencies
        .filter((item) => (!item.enrollmentId || item.enrollmentId === enrollment.enrollmentId) && (!item.classId || item.classId === enrollment.classId) && (!item.programId || item.programId === enrollment.programId))
        .map((item) => ({ profileId: item.profileId, competencyCode: item.competencyCode, competencyName: item.competencyName, baseline: structuredClone(item.baseline), current: structuredClone(item.current), target: structuredClone(item.target), confidence: item.confidence, assessedAt: item.assessedAt })),
    }));
  }
}
