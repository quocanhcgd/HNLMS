import type {
  StudentLearningAttendanceRecord,
  StudentLearningCompetencyRecord,
  StudentLearningEnrollmentRecord,
  StudentLearningFeedbackRecord,
  StudentLearningMaterialRecord,
  StudentLearningOutputRepository,
  StudentLearningScheduleRecord,
  StudentLearningScoreRecord,
} from "./student-learning-output.service";

export class InMemoryStudentLearningOutputRepository implements StudentLearningOutputRepository {
  readonly enrollments: StudentLearningEnrollmentRecord[] = [];
  readonly schedules: StudentLearningScheduleRecord[] = [];
  readonly materials: StudentLearningMaterialRecord[] = [];
  readonly scores: StudentLearningScoreRecord[] = [];
  readonly attendance: StudentLearningAttendanceRecord[] = [];
  readonly feedback: StudentLearningFeedbackRecord[] = [];
  readonly competencies: StudentLearningCompetencyRecord[] = [];

  constructor(seedDemoData = false) {
    if (seedDemoData) this.seedDemoData();
  }

  private seedDemoData(): void {
    const organizationId = "org-1";
    this.enrollments.push(
      {
        organizationId,
        studentId: "student-minh-anh",
        enrollmentId: "enrollment-if-2609-minh-anh",
        enrollmentStatus: "active",
        classId: "if-2609",
        className: "IF-2609",
        branchId: "branch-hn",
        subjectId: "english",
        subjectName: "Tiếng Anh",
        programId: "ielts-foundation-a2",
        programName: "IELTS Foundation A2+",
        progressPercent: 62,
      },
      {
        organizationId,
        studentId: "student-minh-anh",
        enrollmentId: "enrollment-toeic-2609-minh-anh",
        enrollmentStatus: "active",
        classId: "toeic-2609",
        className: "TOEIC-2609",
        branchId: "branch-hn",
        subjectId: "english",
        subjectName: "Tiếng Anh",
        programId: "toeic-700-reading",
        programName: "TOEIC 700+ Reading",
        progressPercent: 18,
      },
      {
        organizationId,
        studentId: "student-gia-huy",
        enrollmentId: "enrollment-math-2609-gia-huy",
        enrollmentStatus: "active",
        classId: "math-2609",
        className: "MATH-2609",
        branchId: "branch-hn",
        subjectId: "math",
        subjectName: "Toán",
        programId: "math-thcs-foundation",
        programName: "Nền tảng THCS",
        progressPercent: 44,
      },
    );

    const schedules: Array<[string, string, number, string, string, string]> = [
      ["if-2609", "if-2609-schedule-1", 2, "18:00", "19:30", "teacher-lan-anh"],
      ["if-2609", "if-2609-schedule-2", 4, "18:00", "19:30", "teacher-lan-anh"],
      ["if-2609", "if-2609-schedule-3", 6, "18:00", "19:30", "teacher-lan-anh"],
      ["toeic-2609", "toeic-2609-schedule-1", 2, "19:45", "21:15", "teacher-minh-tuan"],
      ["toeic-2609", "toeic-2609-schedule-2", 4, "19:45", "21:15", "teacher-minh-tuan"],
      ["math-2609", "math-2609-schedule-1", 3, "17:30", "19:00", "teacher-thu-ha"],
      ["math-2609", "math-2609-schedule-2", 6, "17:30", "19:00", "teacher-thu-ha"],
    ];
    this.schedules.push(
      ...schedules.map(([classId, id, weekday, startsAt, endsAt, teacherUserId]) => ({
        organizationId,
        classId,
        id,
        weekday,
        startsAt,
        endsAt,
        roomId: classId === "if-2609" ? "room-if-2609" : `room-${classId}`,
        teacherUserId,
        publicationStatus: "published" as const,
      })),
    );

    const publishedAt = "2026-08-25T08:00:00.000Z";
    this.materials.push(
      { organizationId, id: "material-if-reading", title: "Reading clinic và chiến lược làm bài", contentType: "document", version: 1, locale: "vi", publishedAt, estimatedDurationMinutes: 45, publicationStatus: "published", classId: "if-2609", programId: "ielts-foundation-a2", sessionId: "session-5", source: "internal://materials/reading-clinic.docx" },
      { organizationId, id: "material-if-listening", title: "Video luyện nghe Unit 5", contentType: "video", version: 1, locale: "vi", publishedAt, estimatedDurationMinutes: 30, publicationStatus: "published", classId: "if-2609", programId: "ielts-foundation-a2", sessionId: "session-5", source: "https://www.youtube.com/watch?v=aqz-KE-bpKQ" },
      { organizationId, id: "material-toeic-reading", title: "Mini test Reading 01", contentType: "pdf", version: 1, locale: "vi", publishedAt, estimatedDurationMinutes: 40, publicationStatus: "published", classId: "toeic-2609", programId: "toeic-700-reading", sessionId: "session-5", source: "internal://materials/mini-test-reading.pdf" },
      { organizationId, id: "material-math-algebra", title: "Chuyên đề đại số", contentType: "slides", version: 1, locale: "vi", publishedAt, estimatedDurationMinutes: 35, publicationStatus: "published", classId: "math-2609", programId: "math-thcs-foundation", sessionId: "session-4", source: "internal://materials/math-algebra.pptx" },
    );

    this.scores.push(
      { organizationId, enrollmentId: "enrollment-if-2609-minh-anh", id: "score-if-1", assessmentId: "assessment-if-1", title: "Kiểm tra Listening Unit 4", score: 8.1, maxScore: 10, recordedAt: "2026-08-24T08:00:00.000Z", publicationStatus: "published" },
      { organizationId, enrollmentId: "enrollment-toeic-2609-minh-anh", id: "score-toeic-1", assessmentId: "assessment-toeic-1", title: "Mini test Reading", score: 560, maxScore: 990, recordedAt: "2026-08-24T08:00:00.000Z", publicationStatus: "published" },
      { organizationId, enrollmentId: "enrollment-math-2609-gia-huy", id: "score-math-1", assessmentId: "assessment-math-1", title: "Kiểm tra đại số", score: 7.8, maxScore: 10, recordedAt: "2026-08-24T08:00:00.000Z", publicationStatus: "published" },
    );

    this.attendance.push(
      ...[
        ["enrollment-if-2609-minh-anh", "if-2609-session-1", "present"],
        ["enrollment-if-2609-minh-anh", "if-2609-session-2", "present"],
        ["enrollment-if-2609-minh-anh", "if-2609-session-3", "late"],
        ["enrollment-toeic-2609-minh-anh", "toeic-2609-session-1", "present"],
        ["enrollment-toeic-2609-minh-anh", "toeic-2609-session-2", "present"],
        ["enrollment-math-2609-gia-huy", "math-2609-session-1", "present"],
        ["enrollment-math-2609-gia-huy", "math-2609-session-2", "absent"],
      ].map(([enrollmentId, sessionId, status], index) => ({
        organizationId,
        enrollmentId,
        id: `attendance-demo-${index + 1}`,
        sessionId,
        occurredAt: `2026-08-${String(10 + index).padStart(2, "0")}T12:00:00.000Z`,
        status: status as StudentLearningAttendanceRecord["status"],
        publicationStatus: "published" as const,
      })),
    );

    this.feedback.push(
      { organizationId, enrollmentId: "enrollment-if-2609-minh-anh", id: "feedback-if-1", authorName: "Nguyễn Lan Anh", summary: "Tiến bộ tốt ở kỹ năng nghe; tiếp tục luyện bắt ý chính.", publishedAt, publicationStatus: "published" },
      { organizationId, enrollmentId: "enrollment-toeic-2609-minh-anh", id: "feedback-toeic-1", authorName: "Minh Tuấn", summary: "Cần tăng tốc độ đọc và rà soát từ vựng theo chủ đề.", publishedAt, publicationStatus: "published" },
      { organizationId, enrollmentId: "enrollment-math-2609-gia-huy", id: "feedback-math-1", authorName: "Thu Hà", summary: "Nắm được phương pháp; cần kiểm tra lại bước biến đổi.", publishedAt, publicationStatus: "published" },
    );

    this.competencies.push(
      { organizationId, studentId: "student-minh-anh", enrollmentId: "enrollment-if-2609-minh-anh", classId: "if-2609", programId: "ielts-foundation-a2", profileId: "profile-minh-anh-if", competencyCode: "listening", competencyName: "Nghe hiểu", baseline: { label: "A1", normalizedScore: 42 }, current: { label: "A2", normalizedScore: 62 }, target: { label: "B1", normalizedScore: 75 }, confidence: 82, assessedAt: publishedAt, publicationStatus: "published" },
      { organizationId, studentId: "student-gia-huy", enrollmentId: "enrollment-math-2609-gia-huy", classId: "math-2609", programId: "math-thcs-foundation", profileId: "profile-gia-huy-math", competencyCode: "algebra", competencyName: "Tư duy đại số", baseline: { label: "Đang hình thành", normalizedScore: 48 }, current: { label: "Đạt", normalizedScore: 66 }, target: { label: "Tốt", normalizedScore: 80 }, confidence: 78, assessedAt: publishedAt, publicationStatus: "published" },
    );
  }

  async listEnrollments(input: { organizationId: string; studentId: string }) {
    return structuredClone(this.enrollments.filter((item) => item.organizationId === input.organizationId && item.studentId === input.studentId));
  }

  async listSchedules(input: { organizationId: string; classIds: ReadonlySet<string> }) {
    return structuredClone(this.schedules.filter((item) => item.organizationId === input.organizationId && input.classIds.has(item.classId)));
  }

  async listMaterials(input: { organizationId: string; classIds: ReadonlySet<string>; programIds: ReadonlySet<string> }) {
    return structuredClone(this.materials.filter((item) => item.organizationId === input.organizationId && (!item.classId || input.classIds.has(item.classId)) && (!item.programId || input.programIds.size === 0 || input.programIds.has(item.programId))));
  }

  async listScores(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }) {
    return structuredClone(this.scores.filter((item) => item.organizationId === input.organizationId && input.enrollmentIds.has(item.enrollmentId)));
  }

  async listAttendance(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }) {
    return structuredClone(this.attendance.filter((item) => item.organizationId === input.organizationId && input.enrollmentIds.has(item.enrollmentId)));
  }

  async listFeedback(input: { organizationId: string; enrollmentIds: ReadonlySet<string> }) {
    return structuredClone(this.feedback.filter((item) => item.organizationId === input.organizationId && input.enrollmentIds.has(item.enrollmentId)));
  }

  async listCompetencies(input: { organizationId: string; studentId: string; enrollmentIds: ReadonlySet<string>; classIds: ReadonlySet<string>; programIds: ReadonlySet<string> }) {
    return structuredClone(this.competencies.filter((item) => item.organizationId === input.organizationId && item.studentId === input.studentId && (!item.enrollmentId || input.enrollmentIds.has(item.enrollmentId)) && (!item.classId || input.classIds.has(item.classId)) && (!item.programId || input.programIds.has(item.programId))));
  }

  async addMaterial(record: StudentLearningMaterialRecord) {
    this.materials.push(structuredClone(record));
    return structuredClone(record);
  }

  async updateMaterialPublication(input: { organizationId: string; id: string; publicationStatus: "draft" | "published"; publishedAt?: string }) {
    const item = this.materials.find((entry) => entry.organizationId === input.organizationId && entry.id === input.id);
    if (!item) return null;
    item.publicationStatus = input.publicationStatus;
    if (input.publishedAt) item.publishedAt = input.publishedAt;
    return structuredClone(item);
  }

  async updateMaterial(input: { organizationId: string; id: string; changes: Partial<Omit<StudentLearningMaterialRecord, "organizationId" | "id">> }) {
    const item = this.materials.find((entry) => entry.organizationId === input.organizationId && entry.id === input.id);
    if (!item) return null;
    Object.assign(item, structuredClone(input.changes));
    return structuredClone(item);
  }

  async addScore(record: StudentLearningScoreRecord) {
    this.scores.push(structuredClone(record));
    return structuredClone(record);
  }

  async upsertScore(record: StudentLearningScoreRecord) {
    const existing = this.scores.find((item) => item.organizationId === record.organizationId && item.enrollmentId === record.enrollmentId && item.assessmentId === record.assessmentId);
    if (existing) { Object.assign(existing, structuredClone(record)); return structuredClone(existing); }
    return this.addScore(record);
  }
}

// Keep the demo read and command APIs on the same in-process read model.
export const demoStudentLearningOutputRepository = new InMemoryStudentLearningOutputRepository(true);
