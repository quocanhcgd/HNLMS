export type AcademicStatus = "draft" | "published" | "retired";
export type ClassStatus = "draft" | "open" | "full" | "in_progress" | "closed" | "cancelled";
export type Modality = "onsite" | "online" | "hybrid";
export type ScheduleStatus = "draft" | "confirmed" | "cancelled";

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

export type AcademicActor = { userId: string; organizationId: string; branchIds?: ReadonlySet<string> };
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
  private require<T>(item: T | undefined): asserts item is T {
    if (!item) throw new AcademicServiceError("not_found");
  }
}
