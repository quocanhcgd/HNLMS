import { describe, expect, it } from "vitest";
import { AcademicLearningService, AcademicServiceError } from "./academic-learning.service";
import { InMemoryAcademicRepository } from "./in-memory-academic-repository";

const actor = { userId: "admin-1", organizationId: "org-1" };
function fixture() {
  const repository = new InMemoryAcademicRepository();
  let n = 0;
  const service = new AcademicLearningService(repository, (kind) => `${kind}-${++n}`);
  return { repository, service };
}

describe("Phase 7 academic learning", () => {
  it("creates the department → program → course → module hierarchy and publishes the program", () => {
    const { service } = fixture();
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
    const module = service.createModule(actor, {
      courseId: course.id,
      code: "M01",
      name: "Nền tảng học thuật",
      position: 1,
    });
    expect(service.publishProgram(actor, program.id)).toMatchObject({ status: "published", version: 2 });
    expect(module.position).toBe(1);
  });

  it("opens a class only for a published course and enforces capacity", () => {
    const { service } = fixture();
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
    expect(() =>
      service.openClass(actor, {
        courseId: course.id,
        code: "IF-2609",
        name: "IELTS Foundation tháng 9",
        modality: "onsite",
        capacity: 12,
      }),
    ).toThrow("course_not_published");
    service.publishProgram(actor, program.id);
    course.status = "published";
    const item = service.openClass(actor, {
      courseId: course.id,
      code: "IF-2609",
      name: "IELTS Foundation tháng 9",
      modality: "onsite",
      capacity: 12,
      branchId: "branch-cg",
    });
    item.enrolledCount = 12;
    expect(() => service.setEnrollmentStatus(actor, item.id, "open")).toThrow("capacity_exceeded");
  });

  it("rejects teacher, room and online-session schedule conflicts", () => {
    const { service } = fixture();
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
    const first = service.openClass(actor, {
      courseId: course.id,
      code: "A",
      name: "Lớp A",
      modality: "hybrid",
      capacity: 10,
    });
    const second = service.openClass(actor, {
      courseId: course.id,
      code: "B",
      name: "Lớp B",
      modality: "hybrid",
      capacity: 10,
    });
    service.createSchedule(actor, {
      classId: first.id,
      weekday: 2,
      startsAt: "18:00",
      endsAt: "20:00",
      roomId: "room-1",
      teacherUserId: "teacher-1",
      onlineSessionKey: "online-1",
    });
    for (const input of [
      {
        classId: second.id,
        weekday: 2,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-2",
        teacherUserId: "teacher-1",
        onlineSessionKey: "online-2",
      },
      {
        classId: second.id,
        weekday: 2,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-1",
        teacherUserId: "teacher-2",
        onlineSessionKey: "online-2",
      },
      {
        classId: second.id,
        weekday: 2,
        startsAt: "19:00",
        endsAt: "21:00",
        roomId: "room-2",
        teacherUserId: "teacher-2",
        onlineSessionKey: "online-1",
      },
    ])
      expect(() => service.createSchedule(actor, input)).toThrow("schedule_resource_conflict");
  });

  it("keeps organization and branch scope isolated", () => {
    const { service } = fixture();
    const department = service.createDepartment(actor, { code: "ENG", name: "Ngoại ngữ" });
    expect(() =>
      service.createProgram(
        { ...actor, organizationId: "org-2" },
        { departmentId: department.id, code: "X", name: "Không được truy cập" },
      ),
    ).toThrow("not_found");
    expect(() =>
      service.openClass(
        { ...actor, branchIds: new Set(["branch-hd"]) },
        { courseId: "course-1", branchId: "branch-cg", code: "X", name: "Lớp", modality: "onsite", capacity: 10 },
      ),
    ).toThrow("not_found");
  });
});
