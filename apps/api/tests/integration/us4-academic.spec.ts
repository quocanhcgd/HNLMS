import { describe, expect, it } from "vitest";
import { AcademicLearningService, AcademicServiceError } from "../../src/modules/academic-learning";
import { InMemoryAcademicRepository } from "../../src/modules/academic-learning/in-memory-academic-repository";

const actor = { userId: "admin-1", organizationId: "org-1" } as const;
function setup() {
  const repository = new InMemoryAcademicRepository();
  let id = 0;
  const service = new AcademicLearningService(repository, (kind) => `${kind}-${++id}`);
  return { repository, service };
}

describe("US4 academic management contract", () => {
  it("publishes a program, opens a branch class and confirms a non-conflicting schedule", () => {
    const { service } = setup();
    const department = service.createDepartment(actor, { code: "ENG", name: "Ngoại ngữ" });
    const program = service.createProgram(actor, {
      departmentId: department.id,
      code: "IELTS",
      name: "Lộ trình IELTS",
    });
    const course = service.createCourse(actor, {
      programId: program.id,
      code: "IELTS-F",
      name: "IELTS Foundation",
      durationWeeks: 24,
    });
    service.publishProgram(actor, program.id);
    course.status = "published";
    const academicClass = service.openClass(actor, {
      courseId: course.id,
      branchId: "branch-cg",
      code: "IF-2609",
      name: "IELTS Foundation tháng 9",
      modality: "onsite",
      capacity: 12,
      leadTeacherUserId: "teacher-1",
    });
    const schedule = service.createSchedule(actor, {
      classId: academicClass.id,
      weekday: 2,
      startsAt: "18:00",
      endsAt: "19:30",
      roomId: "room-1",
      teacherUserId: "teacher-1",
      onlineSessionKey: null,
    });
    expect(academicClass).toMatchObject({ status: "open", capacity: 12, branchId: "branch-cg" });
    expect(service.confirmSchedule(actor, schedule.id)).toMatchObject({ status: "confirmed" });
  });

  it("rejects all schedule resource conflicts before confirmation", () => {
    const { service } = setup();
    const department = service.createDepartment(actor, { code: "ENG", name: "Ngoại ngữ" });
    const program = service.createProgram(actor, {
      departmentId: department.id,
      code: "IELTS",
      name: "Lộ trình IELTS",
    });
    const course = service.createCourse(actor, {
      programId: program.id,
      code: "IELTS-F",
      name: "IELTS Foundation",
      durationWeeks: 24,
    });
    service.publishProgram(actor, program.id);
    course.status = "published";
    const a = service.openClass(actor, {
      courseId: course.id,
      code: "A",
      name: "Lớp A",
      modality: "hybrid",
      capacity: 10,
    });
    const b = service.openClass(actor, {
      courseId: course.id,
      code: "B",
      name: "Lớp B",
      modality: "hybrid",
      capacity: 10,
    });
    service.createSchedule(actor, {
      classId: a.id,
      weekday: 3,
      startsAt: "18:00",
      endsAt: "20:00",
      roomId: "room-1",
      teacherUserId: "teacher-1",
      onlineSessionKey: "online-1",
    });
    expect(() =>
      service.createSchedule(actor, {
        classId: b.id,
        weekday: 3,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-2",
        teacherUserId: "teacher-1",
        onlineSessionKey: "online-2",
      }),
    ).toThrow("schedule_resource_conflict");
    expect(() =>
      service.createSchedule(actor, {
        classId: b.id,
        weekday: 3,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-1",
        teacherUserId: "teacher-2",
        onlineSessionKey: "online-2",
      }),
    ).toThrow("schedule_resource_conflict");
    expect(() =>
      service.createSchedule(actor, {
        classId: b.id,
        weekday: 3,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-2",
        teacherUserId: "teacher-2",
        onlineSessionKey: "online-1",
      }),
    ).toThrow("schedule_resource_conflict");
  });

  it("keeps tenant and branch scope isolated", () => {
    const { service } = setup();
    const department = service.createDepartment(actor, { code: "ENG", name: "Ngoại ngữ" });
    expect(() =>
      service.createProgram(
        { userId: "other", organizationId: "org-2" },
        { departmentId: department.id, code: "X", name: "Không được truy cập" },
      ),
    ).toThrow("not_found");
    expect(() =>
      service.openClass(
        { ...actor, branchIds: new Set(["branch-hd"]) },
        { courseId: "missing", branchId: "branch-cg", code: "X", name: "Lớp", modality: "onsite", capacity: 10 },
      ),
    ).toThrow("not_found");
  });
});
