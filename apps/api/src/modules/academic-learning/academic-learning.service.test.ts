import { describe, expect, it } from "vitest";
import { AcademicLearningService, AcademicServiceError } from "./academic-learning.service";
import { InMemoryPrivateObjectStorage } from "../../shared/storage";
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

  it("approves and versions learning content with class-scope protection", () => {
    const { service, repository } = fixture();
    const scopedActor = { ...actor, classIds: new Set(["class-1"]) };
    const { content, version } = service.createLearningContentDraft(scopedActor, {
      title: "Bài học IELTS Listening",
      contentType: "lesson",
      accessScope: "class",
      classId: "class-1",
      document: { blocks: [{ type: "text", value: "Warm-up" }] },
    });

    expect(content.status).toBe("draft");
    expect(version.version).toBe(1);
    expect(service.submitLearningContentForReview(scopedActor, content.id).status).toBe("in_review");
    expect(service.publishLearningContent(scopedActor, content.id)).toMatchObject({
      status: "published",
      publishedByUserId: actor.userId,
    });

    const next = service.createLearningContentVersion(scopedActor, content.id, {
      document: { blocks: [{ type: "text", value: "Updated" }] },
      changeSummary: "Cập nhật nội dung nghe",
    });
    expect(next.version).toBe(2);
    expect(repository.learningContents[0].currentVersion).toBe(2);
    expect(() =>
      service.createLearningContentDraft(actor, {
        title: "Không đúng scope",
        contentType: "lesson",
        accessScope: "class",
        classId: "class-1",
        document: {},
      }),
    ).toThrow("class_outside_scope");
  });

  it("publishes library resources and creates private signed URLs for scoped files", () => {
    const { service } = fixture();
    const scopedActor = { ...actor, classIds: new Set(["class-1"]) };
    const file = service.createFileAsset(scopedActor, {
      storageKey: "org-1/library/listening.pdf",
      originalFilename: "listening.pdf",
      mimeType: "application/pdf",
      sizeBytes: 4,
      checksumSha256: "checksum-1",
    });
    const storage = new InMemoryPrivateObjectStorage({ signingSecret: "test-secret", baseUrl: "https://files.test" });
    storage.put({
      id: file.id,
      storageKey: file.storageKey,
      filename: file.originalFilename,
      contentType: file.mimeType,
      sizeBytes: 4,
      checksum: file.checksumSha256,
      ownerId: actor.userId,
      organizationId: actor.organizationId,
      classId: "class-1",
      body: new Uint8Array([1, 2, 3, 4]),
    });

    const { resource } = service.createLibraryResourceDraft(scopedActor, {
      title: "Listening handout",
      kind: "document",
      category: "IELTS",
      accessScope: "class",
      classId: "class-1",
      fileAssetId: file.id,
    });
    service.submitLibraryResourceForReview(scopedActor, resource.id);
    service.publishLibraryResource(scopedActor, resource.id);

    const signed = service.createLibraryResourceSignedUrl(scopedActor, resource.id, storage, 60);
    expect(signed.url).toContain("https://files.test");
    expect(signed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(() => service.createLibraryResourceSignedUrl(actor, resource.id, storage, 60)).toThrow(
      "class_outside_scope",
    );
  });
});
