import { describe, expect, it, vi } from "vitest";
import {
  CompetencyProfileService,
  EnglishPathwayService,
  EntranceAssessmentService,
  InMemoryCompetencyProfileRepository,
  InMemoryEnglishPathwayRepository,
  InMemoryEntranceAssessmentRepository,
  InMemoryLegacyEnglishMigrationRepository,
  LegacyEnglishMigrationService,
} from "../../src/modules/assessment-english";
import { InMemoryAcademicRepository, AcademicLearningService } from "../../src/modules/academic-learning";
import { InMemoryLeadRepository, LeadService } from "../../src/modules/marketing-admission/lead";
import type { LeadRoutingRule } from "../../src/modules/marketing-admission/lead/lead.service";

const now = new Date("2026-08-25T08:00:00.000Z");
const organizationId = "org-1";
const branchId = "branch-hn";
const teacherId = "teacher-1";
const studentId = "student-1";

describe("T094 US9 cross-module competency contract", () => {
  it("propagates admission → entrance assessment → placement → class → teacher review → student/parent output", async () => {
    const academicRepository = new InMemoryAcademicRepository();
    const academic = new AcademicLearningService(academicRepository, (kind) => `${kind}-1`);
    const academicActor = { userId: "academic-1", organizationId, branchIds: new Set([branchId]) };
    const department = academic.createDepartment(academicActor, { code: "LANG", name: "Ngoại ngữ" });
    const program = academic.createProgram(academicActor, {
      departmentId: department.id,
      code: "EN-B1",
      name: "English B1",
      description: "Chương trình tiếng Anh B1",
    });
    academic.publishProgram(academicActor, program.id);
    const course = academic.createCourse(academicActor, {
      programId: program.id,
      code: "EN-B1-CORE",
      name: "English B1 Core",
      durationWeeks: 12,
    });
    // Course publication is represented by the academic release boundary in this fixture.
    course.status = "published";
    const academicClass = academic.openClass(academicActor, {
      courseId: course.id,
      branchId,
      code: "EN-B1-2609",
      name: "English B1 tháng 09",
      modality: "onsite",
      capacity: 20,
      leadTeacherUserId: teacherId,
    });
    const student = academic.createStudent(academicActor, {
      studentCode: "HV-0001",
      userId: studentId,
      fullName: "Nguyễn Minh Anh",
    });

    const leadRepository = new InMemoryLeadRepository();
    const leadService = new LeadService(leadRepository, async () => undefined, (kind) => `${kind}-1`, () => now);
    const routingRule: LeadRoutingRule = {
      id: "route-english-hn",
      priority: 1,
      interest: "English",
      branchId,
      consultantUserId: "consultant-1",
    };
    const created = await leadService.createAndRoute(
      { userId: "admission-1", organizationId, canManageAllLeads: true },
      {
        fullName: student.fullName,
        phone: "090 123 4567",
        email: "minhanh@example.vn",
        source: "public-consultation-form",
        interest: "English",
        interestedBranchId: branchId,
        programInterestId: program.id,
        consent: true,
        consentSource: "public-form",
        clientSubmissionKey: "us9-cross-module-lead-1",
      },
      [routingRule],
    );

    const assessmentRepository = new InMemoryEntranceAssessmentRepository();
    assessmentRepository.assessments.push({
      id: "entrance-english-b1",
      organizationId,
      kind: "entrance",
      status: "published",
      title: "English B1 đầu vào",
      subjectId: "english",
      programId: program.id,
      branchId,
      classId: academicClass.id,
      opensAt: new Date("2026-08-20T00:00:00.000Z"),
      closesAt: new Date("2026-08-31T00:00:00.000Z"),
    });
    assessmentRepository.leads.push({
      id: created.lead.id,
      organizationId,
      status: created.lead.status,
      activeConsultantUserId: created.assignment.consultantUserId,
    });
    const assessment = new EntranceAssessmentService(assessmentRepository, vi.fn(), () => "assignment-1", () => now);
    const assessmentActor = {
      userId: "consultant-1",
      organizationId,
      subjectIds: new Set(["english"]),
      programIds: new Set([program.id]),
      branchIds: new Set([branchId]),
      classIds: new Set([academicClass.id]),
    };
    const assignment = await assessment.assign(assessmentActor, {
      leadId: created.lead.id,
      assessmentId: "entrance-english-b1",
      invitationChannel: "manual",
      expiresAt: new Date("2026-08-30T08:00:00.000Z"),
      clientAssignmentKey: "us9-cross-module-assignment-1",
    });
    await leadService.transition({ userId: "consultant-1", organizationId }, created.lead.id, "awaiting_assessment");
    const linked = await assessment.linkPublishedResult(assessmentActor, assignment.id, {
      id: "result-1",
      organizationId,
      assessmentId: "entrance-english-b1",
      subjectId: "english",
      programId: program.id,
      branchId,
      classId: academicClass.id,
      publicationStatus: "published",
      recommendedProgramId: program.id,
      recommendedClassId: academicClass.id,
    });
    expect(linked).toMatchObject({ status: "completed", resultId: "result-1" });
    expect(assessmentRepository.leads[0]?.status).toBe("class_proposed");

    await leadService.transition({ userId: "consultant-1", organizationId }, created.lead.id, "class_proposed");
    const enrolledLead = await leadService.transition(
      { userId: "consultant-1", organizationId },
      created.lead.id,
      "enrolled",
    );
    const enrollment = academic.enrollStudent(academicActor, {
      studentId: student.id,
      classId: academicClass.id,
      enrollmentCode: "ENR-0001",
    });
    expect(enrolledLead.status).toBe("enrolled");
    expect(enrollment).toMatchObject({ studentId, classId: academicClass.id, status: "active" });

    const pathwayRepository = new InMemoryEnglishPathwayRepository();
    pathwayRepository.placementRules.push({
      id: "rule-english-b1",
      organizationId,
      pathwayId: "pathway-english-b1",
      status: "active",
      thresholds: [
        { levelCode: "B1", minPercent: 70 },
        { levelCode: "A2", minPercent: 45 },
        { levelCode: "A1", minPercent: 0 },
      ],
    });
    const pathway = new EnglishPathwayService(pathwayRepository, vi.fn(), (() => {
      let sequence = 0;
      return () => `legacy-${++sequence}`;
    })(), () => now);
    await pathway.calculatePlacement(
      {
        userId: teacherId,
        organizationId,
        canReviewEnglishPathway: true,
        branchIds: new Set([branchId]),
        classIds: new Set([academicClass.id]),
      },
      {
        studentId,
        ruleId: "rule-english-b1",
        sourceRef: assignment.id,
        skills: [
          { skill: "listening", score: 8, maxScore: 10 },
          { skill: "speaking", score: 7, maxScore: 10 },
          { skill: "reading", score: 8, maxScore: 10 },
          { skill: "writing", score: 6, maxScore: 10 },
        ],
      },
    );
    // A second, unreviewed record must remain internal and never reach student/parent output.
    pathwayRepository.skillRecords.push({
      id: "legacy-draft",
      organizationId,
      studentId,
      skill: "writing",
      levelCode: "A2",
      score: 45,
      confidence: 55,
      source: "assessment",
      sourceRef: "mock-writing-1",
      notes: { rawScore: 4.5, maxScore: 10 },
      capturedAt: now,
      reviewedByUserId: null,
      reviewedAt: null,
    });

    const migrationRepository = new InMemoryLegacyEnglishMigrationRepository(pathwayRepository.skillRecords);
    const migration = new LegacyEnglishMigrationService(migrationRepository, vi.fn(), (() => {
      let sequence = 0;
      return () => `generic-${++sequence}`;
    })(), () => now);
    const migrationReport = await migration.migrate(
      { userId: "system-1", organizationId },
      {
        contextByStudentId: new Map([[studentId, {
          studentName: student.fullName,
          subjectId: "english",
          subjectName: "Tiếng Anh",
          programId: program.id,
          programName: program.name,
          classId: academicClass.id,
          className: academicClass.name,
          branchId,
          blueprintVersion: 1,
          target: { label: "B1", normalizedScore: 70 },
        }]]),
      },
    );
    expect(migrationReport).toMatchObject({ scanned: 5, migrated: 5, failed: [] });

    const profileService = new CompetencyProfileService(new InMemoryCompetencyProfileRepository(migrationRepository.profiles));
    const teacherRows = await profileService.listForStaff({
      userId: teacherId,
      organizationId,
      role: "teacher",
      permissions: new Set(["competency:read"]),
      branchIds: new Set([branchId]),
      classIds: new Set([academicClass.id]),
      subjectIds: new Set(["english"]),
      programIds: new Set([program.id]),
    }, { classId: academicClass.id });
    expect(teacherRows).toHaveLength(5);
    expect(teacherRows.every((row) => row.classId === academicClass.id && row.programId === program.id)).toBe(true);
    expect(teacherRows.some((row) => row.reviewStatus === "pending_review")).toBe(true);

    const studentRows = await profileService.listForStudent(
      { userId: studentId, organizationId, role: "student", studentId },
      studentId,
    );
    expect(studentRows).toHaveLength(4);
    expect(studentRows.every((row) => row.publicationStatus === "published")).toBe(true);
    expect(studentRows.map((row) => row.competencyCode).sort()).toEqual(["listening", "reading", "speaking", "writing"]);

    const parentRows = await profileService.listForParent(
      {
        userId: "parent-1",
        organizationId,
        role: "parent",
        parentPermissionsByStudentId: new Map([[studentId, new Set(["view_competency"])]]),
      },
      studentId,
    );
    expect(parentRows).toEqual(studentRows);
    await expect(profileService.listForParent({ userId: "parent-2", organizationId, role: "parent", parentPermissionsByStudentId: new Map() }, studentId)).rejects.toMatchObject({
      code: "forbidden",
      message: "parent_competency_delegation_required",
    });
  });

  it("blocks cross-tenant and out-of-scope profile reads after the handoff", async () => {
    const profile = {
      profileId: "profile-scope-1",
      organizationId,
      studentId,
      studentName: "Nguyễn Minh Anh",
      subjectId: "math",
      subjectName: "Toán",
      programId: "math-foundation",
      programName: "Nền tảng THCS",
      classId: "math-2609",
      className: "MATH-2609",
      branchId,
      competencyCode: "algebra",
      competencyName: "Đại số",
      baseline: { label: "Cần hỗ trợ", normalizedScore: 40 },
      current: { label: "Đạt", normalizedScore: 65 },
      target: { label: "Vượt", normalizedScore: 80 },
      evidence: {
        sourceType: "entrance" as const,
        sourceId: "math-result-1",
        sourceLabel: "Thi đầu vào",
        assessedAt: "2026-08-25T08:00:00.000Z",
        summary: "Đánh giá đại số đầu vào",
      },
      confidence: 90,
      publicationStatus: "published" as const,
      reviewStatus: "confirmed" as const,
      version: 1,
    };
    const service = new CompetencyProfileService(new InMemoryCompetencyProfileRepository([profile]));

    await expect(service.listForStaff({
      userId: "teacher-1",
      organizationId,
      role: "teacher",
      permissions: new Set(["competency:read"]),
      classIds: new Set(["english-2609"]),
      subjectIds: new Set(["english"]),
    })).resolves.toEqual([]);
    await expect(service.listForStaff({
      userId: "teacher-1",
      organizationId: "org-2",
      role: "teacher",
      permissions: new Set(["competency:read"]),
    })).resolves.toEqual([]);
  });
});
