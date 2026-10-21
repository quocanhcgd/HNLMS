import { describe, expect, it } from "vitest";
import {
  CompetencyProfileError,
  CompetencyProfileService,
  type CompetencyProfileRecord,
} from "./competency-profile.service";
import { InMemoryCompetencyProfileRepository } from "./in-memory-competency-profile-repository";

const published: CompetencyProfileRecord = {
  profileId: "profile-1",
  organizationId: "org-1",
  studentId: "student-1",
  studentName: "Nguyễn Minh Anh",
  subjectId: "subject-english",
  subjectName: "Tiếng Anh",
  programId: "program-teen-b1",
  programName: "Teen B1",
  classId: "class-en-2609",
  className: "EN-2609",
  branchId: "branch-hn",
  competencyCode: "speaking-pronunciation",
  competencyName: "Nói · phát âm",
  baseline: { label: "A1", normalizedScore: 35 },
  current: { label: "A2", normalizedScore: 58 },
  target: { label: "B1", normalizedScore: 70 },
  evidence: {
    sourceType: "teacher_review",
    sourceId: "review-1",
    sourceLabel: "Đánh giá trên lớp",
    assessedAt: "2026-08-22T08:00:00.000Z",
    summary: "Bài nói Unit 4",
  },
  confidence: 78,
  publicationStatus: "published",
  reviewStatus: "confirmed",
  teacherFeedback: "Cần luyện âm cuối.",
  version: 2,
  privateReviewerNote: "Trao đổi nội bộ với học vụ.",
  internalWorklogId: "worklog-1",
};

const draft: CompetencyProfileRecord = {
  ...published,
  profileId: "profile-2",
  competencyCode: "listening-main-idea",
  competencyName: "Nghe · ý chính",
  publicationStatus: "draft",
  reviewStatus: "pending_review",
};

const service = new CompetencyProfileService(new InMemoryCompetencyProfileRepository([published, draft]));

describe("T091/T096 competency profile read model", () => {
  it("returns scoped staff records without operational private fields", async () => {
    const rows = await service.listForStaff({
      userId: "teacher-1",
      organizationId: "org-1",
      role: "teacher",
      permissions: new Set(["competency:read"]),
      branchIds: new Set(["branch-hn"]),
      classIds: new Set(["class-en-2609"]),
      subjectIds: new Set(["subject-english"]),
      programIds: new Set(["program-teen-b1"]),
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).not.toHaveProperty("privateReviewerNote");
    expect(rows[0]).not.toHaveProperty("internalWorklogId");
  });

  it("only returns published records to the student in self scope", async () => {
    const rows = await service.listForStudent(
      { userId: "student-1", organizationId: "org-1", role: "student", studentId: "student-1" },
      "student-1",
    );

    expect(rows).toEqual([expect.objectContaining({ profileId: "profile-1", publicationStatus: "published" })]);
    await expect(
      service.listForStudent(
        { userId: "student-2", organizationId: "org-1", role: "student", studentId: "student-2" },
        "student-1",
      ),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<CompetencyProfileError>);
  });

  it("requires an independent parent competency delegation and hides drafts", async () => {
    const allowed = {
      userId: "parent-1",
      organizationId: "org-1",
      role: "parent" as const,
      parentPermissionsByStudentId: new Map([["student-1", new Set(["view_competency"])]]),
    };
    const rows = await service.listForParent(allowed, "student-1");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.publicationStatus).toBe("published");

    await expect(
      service.listForParent({ ...allowed, parentPermissionsByStudentId: new Map() }, "student-1"),
    ).rejects.toMatchObject({ code: "forbidden", message: "parent_competency_delegation_required" });
  });

  it("filters staff results by subject, program and class", async () => {
    const rows = await service.listForStaff(
      {
        userId: "staff-1",
        organizationId: "org-1",
        role: "staff",
        permissions: new Set(["competency:read"]),
      },
      { subjectId: "subject-math" },
    );
    expect(rows).toEqual([]);
  });

  it("stores a draft for the whole aggregated profile without changing its version", async () => {
    const repository = new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]);
    const reviewService = new CompetencyProfileService(repository);
    const result = await reviewService.saveDraft(
      {
        userId: "teacher-1",
        organizationId: "org-1",
        role: "teacher",
        permissions: new Set(["competency:review"]),
        classIds: new Set(["class-en-2609"]),
      },
      {
        profileIds: ["profile-1", "profile-2"],
        updates: [
          { profileId: "profile-1", current: "A2+", teacherFeedback: "Đã lưu để rà soát tiếp." },
          { profileId: "profile-2", current: { label: "B1", normalizedScore: 72 } },
        ],
      },
    );

    expect(result.action).toBe("save_draft");
    expect(repository.records.map((record) => record.version)).toEqual([2, 2]);
    expect(
      repository.records.every(
        (record) => record.publicationStatus === "draft" && record.reviewStatus === "pending_review",
      ),
    ).toBe(true);
    expect(repository.history).toHaveLength(2);
  });

  it("confirms every skill as a new version and keeps before/after history", async () => {
    const repository = new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]);
    const reviewService = new CompetencyProfileService(repository);
    const result = await reviewService.confirmReview(
      {
        userId: "teacher-1",
        organizationId: "org-1",
        role: "teacher",
        permissions: new Set(["competency:read"]),
      },
      {
        profileIds: ["profile-1", "profile-2"],
        updates: [
          { profileId: "profile-1", current: "B1", confidence: 90 },
          { profileId: "profile-2", current: "B1", confidence: 80 },
        ],
        note: "Đã đánh giá đủ các nhóm năng lực.",
      },
    );

    expect(
      result.profiles.every((profile) => profile.reviewStatus === "confirmed" && profile.publicationStatus === "draft"),
    ).toBe(true);
    expect(repository.records.map((record) => record.version)).toEqual([3, 3]);
    expect(repository.records.every((record) => record.evidence.sourceType === "teacher_review")).toBe(true);
    expect(repository.history[0]?.before.baseline).toEqual(published.baseline);
    expect(repository.history[0]?.after.baseline).toEqual(published.baseline);
  });

  it("requires all skill rows before confirming or requesting publication", async () => {
    const repository = new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]);
    const reviewService = new CompetencyProfileService(repository);
    const actor = {
      userId: "teacher-1",
      organizationId: "org-1",
      role: "teacher" as const,
      permissions: new Set(["competency:review"]),
    };

    await expect(
      reviewService.confirmReview(actor, {
        profileIds: ["profile-1"],
        updates: [{ profileId: "profile-1", current: "B1" }],
      }),
    ).rejects.toMatchObject({ message: "all_profile_skills_required" });
    await expect(
      reviewService.requestPublication(actor, { profileIds: ["profile-1", "profile-2"] }),
    ).rejects.toMatchObject({ message: "publication_requires_all_reviews_confirmed" });

    await reviewService.confirmReview(actor, {
      profileIds: ["profile-1", "profile-2"],
      updates: [
        { profileId: "profile-1", current: "B1" },
        { profileId: "profile-2", current: "B1" },
      ],
    });
    const request = await reviewService.requestPublication(actor, { profileIds: ["profile-1", "profile-2"] });
    expect(request.profiles.every((profile) => profile.publicationStatus === "pending_publication")).toBe(true);
  });

  it("denies review outside the teacher scope", async () => {
    const reviewService = new CompetencyProfileService(
      new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]),
    );
    await expect(
      reviewService.saveDraft(
        {
          userId: "teacher-1",
          organizationId: "org-1",
          role: "teacher",
          permissions: new Set(["competency:review"]),
          classIds: new Set(["another-class"]),
        },
        { profileIds: ["profile-1", "profile-2"] },
      ),
    ).rejects.toMatchObject({ message: "competency_scope_denied" });
  });

  it("lets academic affairs publish only a fully confirmed publication request", async () => {
    const repository = new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]);
    const reviewService = new CompetencyProfileService(repository);
    const teacher = {
      userId: "teacher-1",
      organizationId: "org-1",
      role: "teacher" as const,
      permissions: new Set(["competency:review"]),
    };
    const academic = {
      userId: "academic-1",
      organizationId: "org-1",
      role: "academic_affairs" as const,
      permissions: new Set(["competency:publish"]),
    };
    const ids = ["profile-1", "profile-2"];
    await reviewService.confirmReview(teacher, {
      profileIds: ids,
      updates: ids.map((profileId) => ({ profileId, current: "B1" })),
    });
    await reviewService.requestPublication(teacher, { profileIds: ids });
    const result = await reviewService.approvePublication(academic, { profileIds: ids, note: "Đã kiểm tra hồ sơ." });
    expect(result.profiles.every((profile) => profile.publicationStatus === "published")).toBe(true);
    expect(repository.history.filter((entry) => entry.action === "publication_approved")).toHaveLength(2);
  });

  it("does not allow a teacher to perform final publication", async () => {
    const reviewService = new CompetencyProfileService(
      new InMemoryCompetencyProfileRepository([structuredClone(published), structuredClone(draft)]),
    );
    await expect(
      reviewService.approvePublication(
        { userId: "teacher-1", organizationId: "org-1", role: "teacher", permissions: new Set(["competency:publish"]) },
        { profileIds: ["profile-1", "profile-2"] },
      ),
    ).rejects.toMatchObject({ message: "academic_publication_role_required" });
  });
});
