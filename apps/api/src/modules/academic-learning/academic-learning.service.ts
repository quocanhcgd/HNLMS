export type AcademicStatus = "draft" | "published" | "retired";
export type ClassStatus = "draft" | "open" | "full" | "in_progress" | "closed" | "cancelled";
export type Modality = "onsite" | "online" | "hybrid";
export type ScheduleStatus = "draft" | "confirmed" | "cancelled";
export type LearningContentType = "lesson" | "video" | "exercise" | "document" | "quiz" | "assignment";
export type LearningContentStatus = "draft" | "in_review" | "published" | "retired";
export type LibraryResourceKind = "document" | "video" | "audio" | "image" | "slide" | "link" | "attachment";
export type LibraryResourceStatus = "draft" | "in_review" | "published" | "retired";
export type ResourceAccessScope = "organization" | "department" | "program" | "course" | "class" | "restricted";
export type FileProcessingStatus = "pending" | "processing" | "ready" | "failed" | "quarantined";
export type StudentStatus = "prospective" | "active" | "paused" | "graduated" | "archived";
export type EnrollmentStatus = "pending" | "active" | "completed" | "cancelled" | "withdrawn";
export type EnrollmentCompletionState = "not_started" | "in_progress" | "completed" | "at_risk";
export type AttendanceStatus = "present" | "late" | "absent" | "excused";
export type SavedLibraryResource = {
  id: string;
  organizationId: string;
  userId: string;
  libraryResourceId: string;
  savedAt: string;
};

export type Department = { id: string; organizationId: string; code: string; name: string; status: AcademicStatus };
export type Program = Department & { departmentId: string; description: string; version: number };
export type Course = {
  id: string;
  organizationId: string;
  programId: string;
  code: string;
  name: string;
  durationWeeks: number;
  status: AcademicStatus;
};
export type AcademicModule = {
  id: string;
  organizationId: string;
  courseId: string;
  code: string;
  name: string;
  position: number;
};
export type AcademicClass = {
  id: string;
  organizationId: string;
  courseId: string;
  branchId: string | null;
  code: string;
  name: string;
  modality: Modality;
  capacity: number;
  enrolledCount: number;
  leadTeacherUserId: string | null;
  status: ClassStatus;
};
export type AcademicSchedule = {
  id: string;
  organizationId: string;
  classId: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  roomId: string | null;
  teacherUserId: string | null;
  onlineSessionKey: string | null;
  status: ScheduleStatus;
};

export type Student = {
  id: string;
  organizationId: string;
  userId?: string;
  studentCode: string;
  fullName: string;
  displayName?: string;
  dateOfBirth?: string;
  guardianContact?: unknown;
  privacyFlags?: unknown;
  status: StudentStatus;
  createdByUserId: string;
};
export type EnrollmentAttendance = {
  sessionId: string;
  occurredAt: string;
  status: AttendanceStatus;
  note?: string;
  recordedByUserId: string;
};
export type EnrollmentScore = {
  assessmentId: string;
  title: string;
  score: number;
  maxScore: number;
  weight?: number;
  recordedAt: string;
  recordedByUserId: string;
};
export type Enrollment = {
  id: string;
  organizationId: string;
  studentId: string;
  classId: string;
  enrollmentCode: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completionState: EnrollmentCompletionState;
  attendance: EnrollmentAttendance[];
  scores: EnrollmentScore[];
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  financeReferenceId?: string;
  createdByUserId: string;
};

export type FileAsset = {
  id: string;
  organizationId: string;
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string;
  processingStatus: FileProcessingStatus;
  uploadedByUserId: string;
};
export type LearningContent = {
  id: string;
  organizationId: string;
  ownerUserId: string;
  title: string;
  locale: string;
  contentType: LearningContentType;
  currentVersion: number;
  status: LearningContentStatus;
  accessScope: ResourceAccessScope;
  departmentId?: string;
  programId?: string;
  courseId?: string;
  classId?: string;
  estimatedDurationMinutes?: number;
  publishedByUserId?: string;
  publishedAt?: string;
};
export type LearningContentVersion = {
  id: string;
  organizationId: string;
  learningContentId: string;
  version: number;
  title: string;
  schemaVersion: number;
  document: unknown;
  assetRefs?: unknown;
  changeSummary?: string;
  status: LearningContentStatus;
  createdByUserId: string;
};
export type LibraryResource = {
  id: string;
  organizationId: string;
  title: string;
  description?: string;
  kind: LibraryResourceKind;
  category: string;
  subject?: string;
  locale: string;
  currentVersion: number;
  status: LibraryResourceStatus;
  accessScope: ResourceAccessScope;
  departmentId?: string;
  programId?: string;
  courseId?: string;
  classId?: string;
  usagePolicy?: unknown;
  tags?: string[];
  publishedByUserId?: string;
  publishedAt?: string;
  createdByUserId: string;
};
export type LibraryResourceVersion = {
  id: string;
  organizationId: string;
  libraryResourceId: string;
  version: number;
  fileAssetId?: string;
  externalUrl?: string;
  metadata?: unknown;
  changeSummary?: string;
  status: LibraryResourceStatus;
  createdByUserId: string;
};
export type AcademicActor = {
  userId: string;
  organizationId: string;
  branchIds?: ReadonlySet<string>;
  classIds?: ReadonlySet<string>;
};
export type LibraryResourceFilter = {
  query?: string;
  kinds?: LibraryResourceKind[];
  statuses?: LibraryResourceStatus[];
  categories?: string[];
  subjects?: string[];
  classId?: string;
  courseId?: string;
  programId?: string;
  departmentId?: string;
  includeSavedByUser?: boolean;
  excludeSavedByUser?: boolean;
};
export type LibraryResourceStats = {
  total: number;
  byKind: Record<string, number>;
  byCategory: Record<string, number>;
  bySubject: Record<string, number>;
};
export type AcademicErrorCode =
  "not_found" | "forbidden" | "invalid_input" | "invalid_status" | "capacity_exceeded" | "schedule_conflict" | string;
export class AcademicServiceError extends Error {
  constructor(
    public readonly code: AcademicErrorCode,
    message = code,
  ) {
    super(message);
    this.name = "AcademicServiceError";
  }
}

export type AcademicRepository = {
  departments: Department[];
  programs: Program[];
  courses: Course[];
  modules: AcademicModule[];
  classes: AcademicClass[];
  schedules: AcademicSchedule[];
  fileAssets: FileAsset[];
  learningContents: LearningContent[];
  learningContentVersions: LearningContentVersion[];
  libraryResources: LibraryResource[];
  libraryResourceVersions: LibraryResourceVersion[];
  savedLibraryResources: SavedLibraryResource[];
  students: Student[];
  enrollments: Enrollment[];
};

const text = (value: string, field: string) => {
  const normalized = value.trim();
  if (!normalized) throw new AcademicServiceError("invalid_input", `${field}_required`);
  return normalized;
};
const overlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;

export class AcademicLearningService {
  constructor(
    private readonly repository: AcademicRepository,
    private readonly newId: (kind: string) => string = (kind) => `${kind}-${crypto.randomUUID()}`,
  ) {}

  list(actor: AcademicActor) {
    return {
      departments: this.repository.departments.filter((x) => x.organizationId === actor.organizationId),
      programs: this.repository.programs.filter((x) => x.organizationId === actor.organizationId),
      courses: this.repository.courses.filter((x) => x.organizationId === actor.organizationId),
      modules: this.repository.modules.filter((x) => x.organizationId === actor.organizationId),
      classes: this.repository.classes.filter((x) => x.organizationId === actor.organizationId),
      schedules: this.repository.schedules.filter((x) => x.organizationId === actor.organizationId),
      students: this.repository.students.filter((x) => x.organizationId === actor.organizationId),
      enrollments: this.repository.enrollments.filter((x) => x.organizationId === actor.organizationId),
      learningContents: this.repository.learningContents.filter((x) => x.organizationId === actor.organizationId),
      libraryResources: this.repository.libraryResources.filter((x) => x.organizationId === actor.organizationId),
      savedLibraryResources: this.repository.savedLibraryResources.filter(
        (x) => x.organizationId === actor.organizationId,
      ),
    };
  }

  createDepartment(actor: AcademicActor, input: { code: string; name: string }): Department {
    const item = {
      id: this.newId("department"),
      organizationId: actor.organizationId,
      code: text(input.code, "code"),
      name: text(input.name, "name"),
      status: "draft" as const,
    };
    this.repository.departments.push(item);
    return item;
  }
  createProgram(
    actor: AcademicActor,
    input: { departmentId: string; code: string; name: string; description?: string },
  ): Program {
    this.require(
      this.repository.departments.find((x) => x.id === input.departmentId && x.organizationId === actor.organizationId),
    );
    const item = {
      id: this.newId("program"),
      organizationId: actor.organizationId,
      departmentId: input.departmentId,
      code: text(input.code, "code"),
      name: text(input.name, "name"),
      description: input.description?.trim() ?? "",
      status: "draft" as const,
      version: 1,
    };
    this.repository.programs.push(item);
    return item;
  }
  createCourse(
    actor: AcademicActor,
    input: { programId: string; code: string; name: string; durationWeeks: number },
  ): Course {
    this.require(
      this.repository.programs.find((x) => x.id === input.programId && x.organizationId === actor.organizationId),
    );
    if (!Number.isInteger(input.durationWeeks) || input.durationWeeks < 1)
      throw new AcademicServiceError("invalid_input", "duration_weeks_invalid");
    const item = {
      id: this.newId("course"),
      organizationId: actor.organizationId,
      programId: input.programId,
      code: text(input.code, "code"),
      name: text(input.name, "name"),
      durationWeeks: input.durationWeeks,
      status: "draft" as const,
    };
    this.repository.courses.push(item);
    return item;
  }
  createModule(
    actor: AcademicActor,
    input: { courseId: string; code: string; name: string; position: number },
  ): AcademicModule {
    this.require(
      this.repository.courses.find((x) => x.id === input.courseId && x.organizationId === actor.organizationId),
    );
    if (!Number.isInteger(input.position) || input.position < 1)
      throw new AcademicServiceError("invalid_input", "position_invalid");
    const item = {
      id: this.newId("module"),
      organizationId: actor.organizationId,
      courseId: input.courseId,
      code: text(input.code, "code"),
      name: text(input.name, "name"),
      position: input.position,
    };
    this.repository.modules.push(item);
    return item;
  }
  publishProgram(actor: AcademicActor, id: string): Program {
    const item = this.program(actor, id);
    if (item.status === "retired") throw new AcademicServiceError("invalid_status", "retired_program");
    item.status = "published";
    item.version += 1;
    return item;
  }
  retireProgram(actor: AcademicActor, id: string): Program {
    const item = this.program(actor, id);
    item.status = "retired";
    return item;
  }

  openClass(
    actor: AcademicActor,
    input: {
      courseId: string;
      branchId?: string;
      code: string;
      name: string;
      modality: Modality;
      capacity: number;
      leadTeacherUserId?: string;
    },
  ): AcademicClass {
    const course = this.repository.courses.find(
      (x) => x.id === input.courseId && x.organizationId === actor.organizationId,
    );
    this.require(course);
    if (course.status !== "published") throw new AcademicServiceError("invalid_status", "course_not_published");
    if (!Number.isInteger(input.capacity) || input.capacity < 1)
      throw new AcademicServiceError("invalid_input", "capacity_invalid");
    if (input.branchId && actor.branchIds && !actor.branchIds.has(input.branchId))
      throw new AcademicServiceError("forbidden", "branch_outside_scope");
    const item = {
      id: this.newId("class"),
      organizationId: actor.organizationId,
      courseId: input.courseId,
      branchId: input.branchId ?? null,
      code: text(input.code, "code"),
      name: text(input.name, "name"),
      modality: input.modality,
      capacity: input.capacity,
      enrolledCount: 0,
      leadTeacherUserId: input.leadTeacherUserId ?? null,
      status: "open" as const,
    };
    this.repository.classes.push(item);
    return item;
  }
  setEnrollmentStatus(actor: AcademicActor, id: string, status: ClassStatus): AcademicClass {
    const item = this.class(actor, id);
    if (item.status === "cancelled" && status !== "cancelled")
      throw new AcademicServiceError("invalid_status", "cancelled_class");
    if (status === "open" && item.enrolledCount >= item.capacity) throw new AcademicServiceError("capacity_exceeded");
    item.status = status;
    return item;
  }

  createSchedule(
    actor: AcademicActor,
    input: Omit<AcademicSchedule, "id" | "organizationId" | "status"> & { status?: ScheduleStatus },
  ): AcademicSchedule {
    const item = {
      ...input,
      id: this.newId("schedule"),
      organizationId: actor.organizationId,
      status: input.status ?? "draft",
    };
    if (item.weekday < 1 || item.weekday > 7 || item.startsAt >= item.endsAt)
      throw new AcademicServiceError("invalid_input", "schedule_time_invalid");
    this.class(actor, item.classId);
    const conflicts = this.repository.schedules.filter(
      (x) =>
        x.organizationId === actor.organizationId &&
        x.status !== "cancelled" &&
        x.weekday === item.weekday &&
        overlap(x.startsAt, x.endsAt, item.startsAt, item.endsAt) &&
        ((item.teacherUserId && x.teacherUserId === item.teacherUserId) ||
          (item.roomId && x.roomId === item.roomId) ||
          (item.onlineSessionKey && x.onlineSessionKey === item.onlineSessionKey)),
    );
    if (conflicts.length) throw new AcademicServiceError("schedule_conflict", "schedule_resource_conflict");
    this.repository.schedules.push(item);
    return item;
  }
  confirmSchedule(actor: AcademicActor, id: string): AcademicSchedule {
    const item = this.repository.schedules.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "schedule_not_found");
    item.status = "confirmed";
    return item;
  }

  createStudent(
    actor: AcademicActor,
    input: {
      studentCode: string;
      fullName: string;
      userId?: string;
      displayName?: string;
      dateOfBirth?: string;
      guardianContact?: unknown;
      privacyFlags?: unknown;
      status?: StudentStatus;
    },
  ): Student {
    const studentCode = text(input.studentCode, "student_code");
    if (
      this.repository.students.some((x) => x.organizationId === actor.organizationId && x.studentCode === studentCode)
    ) {
      throw new AcademicServiceError("invalid_input", "student_code_duplicated");
    }
    if (
      input.userId &&
      this.repository.students.some((x) => x.organizationId === actor.organizationId && x.userId === input.userId)
    ) {
      throw new AcademicServiceError("invalid_input", "student_user_duplicated");
    }
    const item: Student = {
      id: this.newId("student"),
      organizationId: actor.organizationId,
      userId: input.userId,
      studentCode,
      fullName: text(input.fullName, "full_name"),
      displayName: input.displayName?.trim(),
      dateOfBirth: input.dateOfBirth?.trim(),
      guardianContact: input.guardianContact,
      privacyFlags: input.privacyFlags,
      status: input.status ?? "active",
      createdByUserId: actor.userId,
    };
    this.repository.students.push(item);
    return item;
  }

  enrollStudent(
    actor: AcademicActor,
    input: {
      studentId: string;
      classId: string;
      enrollmentCode: string;
      financeReferenceId?: string;
      enrolledAt?: string;
    },
  ): Enrollment {
    const student = this.student(actor, input.studentId);
    if (student.status !== "active" && student.status !== "prospective")
      throw new AcademicServiceError("invalid_status", "student_not_enrollable");
    const academicClass = this.class(actor, input.classId);
    if (academicClass.status !== "open" && academicClass.status !== "in_progress")
      throw new AcademicServiceError("invalid_status", "class_not_open");
    if (academicClass.enrolledCount >= academicClass.capacity) throw new AcademicServiceError("capacity_exceeded");
    if (
      this.repository.enrollments.some(
        (x) =>
          x.organizationId === actor.organizationId &&
          x.studentId === input.studentId &&
          x.classId === input.classId &&
          x.status !== "cancelled" &&
          x.status !== "withdrawn",
      )
    ) {
      throw new AcademicServiceError("invalid_input", "student_already_enrolled");
    }
    const enrollmentCode = text(input.enrollmentCode, "enrollment_code");
    if (
      this.repository.enrollments.some(
        (x) => x.organizationId === actor.organizationId && x.enrollmentCode === enrollmentCode,
      )
    ) {
      throw new AcademicServiceError("invalid_input", "enrollment_code_duplicated");
    }
    const item: Enrollment = {
      id: this.newId("enrollment"),
      organizationId: actor.organizationId,
      studentId: input.studentId,
      classId: input.classId,
      enrollmentCode,
      status: "active",
      progressPercent: 0,
      completionState: "not_started",
      attendance: [],
      scores: [],
      enrolledAt: input.enrolledAt ?? new Date().toISOString(),
      startedAt: new Date().toISOString(),
      financeReferenceId: input.financeReferenceId,
      createdByUserId: actor.userId,
    };
    academicClass.enrolledCount += 1;
    if (academicClass.enrolledCount >= academicClass.capacity && academicClass.status === "open")
      academicClass.status = "full";
    this.repository.enrollments.push(item);
    return item;
  }

  updateEnrollmentProgress(actor: AcademicActor, enrollmentId: string, progressPercent: number): Enrollment {
    const enrollment = this.enrollment(actor, enrollmentId);
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100)
      throw new AcademicServiceError("invalid_input", "progress_percent_invalid");
    enrollment.progressPercent = Math.round(progressPercent);
    this.refreshCompletionState(enrollment);
    return enrollment;
  }

  recordAttendance(
    actor: AcademicActor,
    enrollmentId: string,
    input: Omit<EnrollmentAttendance, "recordedByUserId">,
  ): Enrollment {
    const enrollment = this.enrollment(actor, enrollmentId);
    const existing = enrollment.attendance.find((x) => x.sessionId === input.sessionId);
    const item: EnrollmentAttendance = { ...input, recordedByUserId: actor.userId };
    if (existing) Object.assign(existing, item);
    else enrollment.attendance.push(item);
    this.refreshCompletionState(enrollment);
    return enrollment;
  }

  recordScore(
    actor: AcademicActor,
    enrollmentId: string,
    input: Omit<EnrollmentScore, "recordedAt" | "recordedByUserId"> & { recordedAt?: string },
  ): Enrollment {
    const enrollment = this.enrollment(actor, enrollmentId);
    if (
      !Number.isFinite(input.score) ||
      !Number.isFinite(input.maxScore) ||
      input.maxScore <= 0 ||
      input.score < 0 ||
      input.score > input.maxScore
    )
      throw new AcademicServiceError("invalid_input", "score_invalid");
    const item: EnrollmentScore = {
      ...input,
      title: text(input.title, "title"),
      recordedAt: input.recordedAt ?? new Date().toISOString(),
      recordedByUserId: actor.userId,
    };
    const existing = enrollment.scores.find((x) => x.assessmentId === input.assessmentId);
    if (existing) Object.assign(existing, item);
    else enrollment.scores.push(item);
    this.refreshCompletionState(enrollment);
    return enrollment;
  }

  completeEnrollment(actor: AcademicActor, enrollmentId: string): Enrollment {
    const enrollment = this.enrollment(actor, enrollmentId);
    if (enrollment.status !== "active") throw new AcademicServiceError("invalid_status", "enrollment_not_active");
    enrollment.status = "completed";
    enrollment.progressPercent = 100;
    enrollment.completionState = "completed";
    enrollment.completedAt = new Date().toISOString();
    return enrollment;
  }

  cancelEnrollment(
    actor: AcademicActor,
    enrollmentId: string,
    status: Extract<EnrollmentStatus, "cancelled" | "withdrawn"> = "cancelled",
  ): Enrollment {
    const enrollment = this.enrollment(actor, enrollmentId);
    if (enrollment.status === "completed") throw new AcademicServiceError("invalid_status", "completed_enrollment");
    if (enrollment.status !== status) {
      enrollment.status = status;
      const academicClass = this.class(actor, enrollment.classId);
      academicClass.enrolledCount = Math.max(0, academicClass.enrolledCount - 1);
      if (academicClass.status === "full" && academicClass.enrolledCount < academicClass.capacity)
        academicClass.status = "open";
    }
    return enrollment;
  }

  createFileAsset(
    actor: AcademicActor,
    input: Omit<FileAsset, "id" | "organizationId" | "processingStatus" | "uploadedByUserId"> & {
      processingStatus?: FileProcessingStatus;
    },
  ): FileAsset {
    if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 0)
      throw new AcademicServiceError("invalid_input", "file_size_invalid");
    const item: FileAsset = {
      id: this.newId("file"),
      organizationId: actor.organizationId,
      storageKey: text(input.storageKey, "storage_key"),
      originalFilename: text(input.originalFilename, "original_filename"),
      mimeType: text(input.mimeType, "mime_type"),
      sizeBytes: input.sizeBytes,
      checksumSha256: text(input.checksumSha256, "checksum_sha256"),
      processingStatus: input.processingStatus ?? "ready",
      uploadedByUserId: actor.userId,
    };
    this.repository.fileAssets.push(item);
    return item;
  }

  createLearningContentDraft(
    actor: AcademicActor,
    input: {
      title: string;
      contentType: LearningContentType;
      document: unknown;
      accessScope?: ResourceAccessScope;
      locale?: string;
      classId?: string;
      courseId?: string;
      programId?: string;
      departmentId?: string;
      estimatedDurationMinutes?: number;
    },
  ): { content: LearningContent; version: LearningContentVersion } {
    this.assertScope(actor, input);
    const content: LearningContent = {
      id: this.newId("learning-content"),
      organizationId: actor.organizationId,
      ownerUserId: actor.userId,
      title: text(input.title, "title"),
      locale: input.locale ?? "vi",
      contentType: input.contentType,
      currentVersion: 1,
      status: "draft",
      accessScope: input.accessScope ?? "organization",
      departmentId: input.departmentId,
      programId: input.programId,
      courseId: input.courseId,
      classId: input.classId,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
    };
    const version = this.createLearningVersion(actor, content, {
      title: content.title,
      document: input.document,
      status: "draft",
      changeSummary: "Initial draft",
    });
    this.repository.learningContents.push(content);
    this.repository.learningContentVersions.push(version);
    return { content, version };
  }

  createLearningContentVersion(
    actor: AcademicActor,
    contentId: string,
    input: { title?: string; document: unknown; assetRefs?: unknown; changeSummary?: string },
  ): LearningContentVersion {
    const content = this.learningContent(actor, contentId);
    if (content.status === "retired") throw new AcademicServiceError("invalid_status", "retired_content");
    this.assertScope(actor, content);
    const version = this.createLearningVersion(actor, content, {
      title: input.title ?? content.title,
      document: input.document,
      assetRefs: input.assetRefs,
      changeSummary: input.changeSummary,
      status: "draft",
      version: content.currentVersion + 1,
    });
    content.currentVersion = version.version;
    content.status = "draft";
    content.title = version.title;
    this.repository.learningContentVersions.push(version);
    return version;
  }

  submitLearningContentForReview(actor: AcademicActor, contentId: string): LearningContent {
    const content = this.learningContent(actor, contentId);
    if (content.status !== "draft") throw new AcademicServiceError("invalid_status", "content_not_draft");
    content.status = "in_review";
    this.currentLearningVersion(content).status = "in_review";
    return content;
  }

  publishLearningContent(actor: AcademicActor, contentId: string): LearningContent {
    const content = this.learningContent(actor, contentId);
    if (content.status !== "in_review") throw new AcademicServiceError("invalid_status", "content_not_in_review");
    content.status = "published";
    content.publishedByUserId = actor.userId;
    content.publishedAt = new Date().toISOString();
    this.currentLearningVersion(content).status = "published";
    return content;
  }

  createLibraryResourceDraft(
    actor: AcademicActor,
    input: {
      title: string;
      kind: LibraryResourceKind;
      category: string;
      fileAssetId?: string;
      externalUrl?: string;
      description?: string;
      subject?: string;
      accessScope?: ResourceAccessScope;
      locale?: string;
      classId?: string;
      courseId?: string;
      programId?: string;
      departmentId?: string;
      usagePolicy?: unknown;
      tags?: string[];
      metadata?: unknown;
    },
  ): { resource: LibraryResource; version: LibraryResourceVersion } {
    this.assertScope(actor, input);
    if (input.fileAssetId) this.fileAsset(actor, input.fileAssetId);
    if (!input.fileAssetId && !input.externalUrl)
      throw new AcademicServiceError("invalid_input", "resource_target_required");
    const resource: LibraryResource = {
      id: this.newId("library-resource"),
      organizationId: actor.organizationId,
      title: text(input.title, "title"),
      description: input.description?.trim(),
      kind: input.kind,
      category: text(input.category, "category"),
      subject: input.subject?.trim(),
      locale: input.locale ?? "vi",
      currentVersion: 1,
      status: "draft",
      accessScope: input.accessScope ?? "organization",
      departmentId: input.departmentId,
      programId: input.programId,
      courseId: input.courseId,
      classId: input.classId,
      usagePolicy: input.usagePolicy,
      tags: input.tags,
      createdByUserId: actor.userId,
    };
    const version: LibraryResourceVersion = {
      id: this.newId("library-resource-version"),
      organizationId: actor.organizationId,
      libraryResourceId: resource.id,
      version: 1,
      fileAssetId: input.fileAssetId,
      externalUrl: input.externalUrl,
      metadata: input.metadata,
      status: "draft",
      createdByUserId: actor.userId,
    };
    this.repository.libraryResources.push(resource);
    this.repository.libraryResourceVersions.push(version);
    return { resource, version };
  }

  submitLibraryResourceForReview(actor: AcademicActor, resourceId: string): LibraryResource {
    const resource = this.libraryResource(actor, resourceId);
    if (resource.status !== "draft") throw new AcademicServiceError("invalid_status", "resource_not_draft");
    resource.status = "in_review";
    this.currentLibraryVersion(resource).status = "in_review";
    return resource;
  }

  publishLibraryResource(actor: AcademicActor, resourceId: string): LibraryResource {
    const resource = this.libraryResource(actor, resourceId);
    if (resource.status !== "in_review") throw new AcademicServiceError("invalid_status", "resource_not_in_review");
    resource.status = "published";
    resource.publishedByUserId = actor.userId;
    resource.publishedAt = new Date().toISOString();
    this.currentLibraryVersion(resource).status = "published";
    return resource;
  }

  createLibraryResourceVersion(
    actor: AcademicActor,
    resourceId: string,
    input: { fileAssetId?: string; externalUrl?: string; metadata?: unknown; changeSummary?: string },
  ): LibraryResourceVersion {
    const resource = this.libraryResource(actor, resourceId);
    if (resource.status === "retired") throw new AcademicServiceError("invalid_status", "retired_resource");
    this.assertScope(actor, resource);
    if (input.fileAssetId) this.fileAsset(actor, input.fileAssetId);
    if (!input.fileAssetId && !input.externalUrl)
      throw new AcademicServiceError("invalid_input", "resource_target_required");
    const version: LibraryResourceVersion = {
      id: this.newId("library-resource-version"),
      organizationId: actor.organizationId,
      libraryResourceId: resource.id,
      version: resource.currentVersion + 1,
      fileAssetId: input.fileAssetId,
      externalUrl: input.externalUrl,
      metadata: input.metadata,
      changeSummary: input.changeSummary,
      status: "draft",
      createdByUserId: actor.userId,
    };
    resource.currentVersion = version.version;
    resource.status = "draft";
    this.repository.libraryResourceVersions.push(version);
    return version;
  }

  createLibraryResourceSignedUrl(
    actor: AcademicActor,
    resourceId: string,
    storage: {
      createSignedUrl(input: { objectId: string; context: any; operation: "download"; expiresInSeconds?: number }): {
        url: string;
        token: string;
        expiresAt: Date;
      };
    },
    expiresInSeconds?: number,
  ) {
    const resource = this.libraryResource(actor, resourceId);
    if (resource.status !== "published") throw new AcademicServiceError("invalid_status", "resource_not_published");
    this.assertScope(actor, resource);
    const version = this.currentLibraryVersion(resource);
    if (!version.fileAssetId) throw new AcademicServiceError("invalid_input", "resource_has_no_file");
    const file = this.fileAsset(actor, version.fileAssetId);
    return storage.createSignedUrl({
      objectId: file.id,
      operation: "download",
      expiresInSeconds,
      context: {
        userId: actor.userId,
        organizationId: actor.organizationId,
        branchIds: actor.branchIds ?? new Set(),
        classIds: actor.classIds ?? new Set(),
        studentIds: new Set(),
        permissions: new Set(),
        roles: new Set(),
      },
    });
  }

  private createLearningVersion(
    actor: AcademicActor,
    content: LearningContent,
    input: {
      title: string;
      document: unknown;
      assetRefs?: unknown;
      changeSummary?: string;
      status: LearningContentStatus;
      version?: number;
    },
  ): LearningContentVersion {
    return {
      id: this.newId("learning-content-version"),
      organizationId: actor.organizationId,
      learningContentId: content.id,
      version: input.version ?? content.currentVersion,
      title: text(input.title, "title"),
      schemaVersion: 1,
      document: input.document,
      assetRefs: input.assetRefs,
      changeSummary: input.changeSummary,
      status: input.status,
      createdByUserId: actor.userId,
    };
  }

  searchLibraryResources(actor: AcademicActor, filters: LibraryResourceFilter): LibraryResource[] {
    let items = this.repository.libraryResources.filter(
      (x) => x.organizationId === actor.organizationId && x.status === "published",
    );
    if (filters.query) {
      const query = filters.query.toLowerCase();
      items = items.filter(
        (x) =>
          x.title.toLowerCase().includes(query) ||
          x.description?.toLowerCase().includes(query) ||
          x.subject?.toLowerCase().includes(query) ||
          x.tags?.toString().toLowerCase().includes(query),
      );
    }
    if (filters.kinds?.length) items = items.filter((x) => filters.kinds!.includes(x.kind));
    if (filters.statuses?.length) items = items.filter((x) => filters.statuses!.includes(x.status));
    if (filters.categories?.length) items = items.filter((x) => filters.categories!.includes(x.category));
    if (filters.subjects?.length) items = items.filter((x) => x.subject && filters.subjects!.includes(x.subject));
    if (filters.classId) items = items.filter((x) => x.classId === filters.classId);
    if (filters.courseId) items = items.filter((x) => x.courseId === filters.courseId);
    if (filters.programId) items = items.filter((x) => x.programId === filters.programId);
    if (filters.departmentId) items = items.filter((x) => x.departmentId === filters.departmentId);
    const savedIds = new Set(
      this.repository.savedLibraryResources
        .filter((x) => x.organizationId === actor.organizationId && x.userId === actor.userId)
        .map((x) => x.libraryResourceId),
    );
    if (filters.includeSavedByUser) items = items.filter((x) => savedIds.has(x.id));
    if (filters.excludeSavedByUser) items = items.filter((x) => !savedIds.has(x.id));
    return items;
  }

  listLibraryResourceStats(
    actor: AcademicActor,
    filters: Omit<LibraryResourceFilter, "includeSavedByUser" | "excludeSavedByUser"> = {},
  ): LibraryResourceStats {
    const resources = this.searchLibraryResources(actor, { ...filters, statuses: filters.statuses ?? ["published"] });
    const byKind: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySubject: Record<string, number> = {};
    for (const resource of resources) {
      byKind[resource.kind] = (byKind[resource.kind] ?? 0) + 1;
      byCategory[resource.category] = (byCategory[resource.category] ?? 0) + 1;
      if (resource.subject) bySubject[resource.subject] = (bySubject[resource.subject] ?? 0) + 1;
    }
    return { total: resources.length, byKind, byCategory, bySubject };
  }

  listLibraryResourceCategories(actor: AcademicActor): string[] {
    const categories = new Set(
      this.repository.libraryResources
        .filter((x) => x.organizationId === actor.organizationId && x.status === "published")
        .map((x) => x.category),
    );
    return [...categories].sort();
  }

  toggleSavedLibraryResource(actor: AcademicActor, resourceId: string): { saved: boolean } {
    const resource = this.libraryResource(actor, resourceId);
    if (resource.status !== "published") throw new AcademicServiceError("invalid_status", "resource_not_published");
    this.assertScope(actor, resource);
    const existing = this.repository.savedLibraryResources.find(
      (x) =>
        x.organizationId === actor.organizationId && x.userId === actor.userId && x.libraryResourceId === resourceId,
    );
    if (existing) {
      this.repository.savedLibraryResources = this.repository.savedLibraryResources.filter((x) => x.id !== existing.id);
      return { saved: false };
    }
    const item: SavedLibraryResource = {
      id: this.newId("saved-library-resource"),
      organizationId: actor.organizationId,
      userId: actor.userId,
      libraryResourceId: resourceId,
      savedAt: new Date().toISOString(),
    };
    this.repository.savedLibraryResources.push(item);
    return { saved: true };
  }

  listSavedLibraryResources(actor: AcademicActor): LibraryResource[] {
    const ids = new Set(
      this.repository.savedLibraryResources
        .filter((x) => x.organizationId === actor.organizationId && x.userId === actor.userId)
        .map((x) => x.libraryResourceId),
    );
    return this.repository.libraryResources.filter(
      (x) => x.organizationId === actor.organizationId && x.status === "published" && ids.has(x.id),
    );
  }

  private program(actor: AcademicActor, id: string) {
    const item = this.repository.programs.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "program_not_found");
    return item;
  }
  private class(actor: AcademicActor, id: string) {
    const item = this.repository.classes.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "class_not_found");
    return item;
  }

  private student(actor: AcademicActor, id: string) {
    const item = this.repository.students.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "student_not_found");
    return item;
  }
  private enrollment(actor: AcademicActor, id: string) {
    const item = this.repository.enrollments.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "enrollment_not_found");
    if (item.classId && actor.classIds && !actor.classIds.has(item.classId))
      throw new AcademicServiceError("forbidden", "class_outside_scope");
    return item;
  }
  private refreshCompletionState(enrollment: Enrollment) {
    if (enrollment.status === "completed") {
      enrollment.completionState = "completed";
      return;
    }
    if (enrollment.progressPercent >= 100) {
      enrollment.completionState = "completed";
      return;
    }
    const absentCount = enrollment.attendance.filter((x) => x.status === "absent").length;
    const scoreAverage = this.weightedScorePercent(enrollment.scores);
    if (absentCount >= 3 || (scoreAverage !== null && scoreAverage < 50)) {
      enrollment.completionState = "at_risk";
      return;
    }
    enrollment.completionState =
      enrollment.progressPercent > 0 || enrollment.attendance.length > 0 || enrollment.scores.length > 0
        ? "in_progress"
        : "not_started";
  }
  private weightedScorePercent(scores: EnrollmentScore[]) {
    if (!scores.length) return null;
    let totalWeight = 0;
    let weighted = 0;
    for (const score of scores) {
      const weight = score.weight ?? 1;
      totalWeight += weight;
      weighted += (score.score / score.maxScore) * 100 * weight;
    }
    return totalWeight > 0 ? weighted / totalWeight : null;
  }
  private learningContent(actor: AcademicActor, id: string) {
    const item = this.repository.learningContents.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "learning_content_not_found");
    return item;
  }
  private currentLearningVersion(content: LearningContent) {
    const item = this.repository.learningContentVersions.find(
      (x) => x.learningContentId === content.id && x.version === content.currentVersion,
    );
    if (!item) throw new AcademicServiceError("not_found", "learning_content_version_not_found");
    return item;
  }
  private libraryResource(actor: AcademicActor, id: string) {
    const item = this.repository.libraryResources.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "library_resource_not_found");
    return item;
  }
  private currentLibraryVersion(resource: LibraryResource) {
    const item = this.repository.libraryResourceVersions.find(
      (x) => x.libraryResourceId === resource.id && x.version === resource.currentVersion,
    );
    if (!item) throw new AcademicServiceError("not_found", "library_resource_version_not_found");
    return item;
  }
  private fileAsset(actor: AcademicActor, id: string) {
    const item = this.repository.fileAssets.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new AcademicServiceError("not_found", "file_asset_not_found");
    return item;
  }
  private assertScope(actor: AcademicActor, item: { classId?: string; accessScope?: ResourceAccessScope }) {
    if (item.classId && (!actor.classIds || !actor.classIds.has(item.classId))) {
      throw new AcademicServiceError("forbidden", "class_outside_scope");
    }
  }

  private require<T>(item: T | undefined): asserts item is T {
    if (!item) throw new AcademicServiceError("not_found");
  }
}
