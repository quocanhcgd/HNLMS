
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentPolicyError, AssessmentPolicyService, type AssessmentPolicyReference } from "./assessment-policy.service";
import { InMemoryAssessmentPolicyRepository } from "./in-memory-assessment-policy-repository";

const now = new Date("2026-08-22T04:00:00.000Z");
const actor = { userId: "academic-manager-1", organizationId: "org-1", canManageAssessments: true };

describe("T082 assessment policy service", () => {
  let repository: InMemoryAssessmentPolicyRepository;
  let audit: ReturnType<typeof vi.fn>;
  let service: AssessmentPolicyService;

  beforeEach(() => {
    repository = new InMemoryAssessmentPolicyRepository();
    repository.banks.push({ id: "bank-1", organizationId: "org-1", status: "active" });
    repository.questions.push(
      {
        id: "q-listen-1",
        organizationId: "org-1",
        bankId: "bank-1",
        type: "listening",
        skill: "listening",
        level: "A2",
        status: "in_review",
        currentVersion: 1,
        createdByUserId: "teacher-1",
        approvedByUserId: null,
        approvedAt: null,
      },
      {
        id: "q-read-1",
        organizationId: "org-1",
        bankId: "bank-1",
        type: "single_choice",
        skill: "reading",
        level: "A2",
        status: "approved",
        currentVersion: 1,
        createdByUserId: "teacher-1",
        approvedByUserId: "academic-manager-1",
        approvedAt: now,
      },
    );
    repository.questionVersionCounts.set("org-1:q-listen-1", 1);
    repository.questionVersionCounts.set("org-1:q-read-1", 1);
    repository.assessments.push(validAssessment());
    audit = vi.fn(async () => undefined);
    service = new AssessmentPolicyService(repository, audit, () => now, () => "policy-key-1");
  });

  it("approves an in-review question with at least one version", async () => {
    const approved = await service.approveQuestion(actor, "q-listen-1");

    expect(approved).toMatchObject({ status: "approved", approvedByUserId: "academic-manager-1" });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "assessment.question-approved", entityId: "q-listen-1" }),
    );
  });

  it("rejects approval without manager privilege, in-review status or version", async () => {
    await expect(service.approveQuestion({ ...actor, canManageAssessments: false }, "q-listen-1")).rejects.toMatchObject({
      code: "forbidden",
    } satisfies Partial<AssessmentPolicyError>);

    await expect(service.approveQuestion(actor, "q-read-1")).rejects.toMatchObject({
      code: "invalid_question_status",
    } satisfies Partial<AssessmentPolicyError>);

    repository.questions[0] = { ...repository.questions[0]!, id: "q-listen-2" };
    await expect(service.approveQuestion(actor, "q-listen-2")).rejects.toMatchObject({
      code: "invalid_question_version",
    } satisfies Partial<AssessmentPolicyError>);
  });

  it("publishes a draft assessment when blueprint, time window, attempt limit and scoring policy are valid", async () => {
    await service.approveQuestion(actor, "q-listen-1");

    const published = await service.publishAssessment(actor, "assessment-1");

    expect(published.status).toBe("published");
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: "assessment.published",
        entityId: "assessment-1",
        after: expect.objectContaining({ totalQuestions: 2, totalPoints: 20, maxAttempts: 2 }),
      }),
    );
  });

  it("rejects publishing with invalid time window and attempt limits", async () => {
    repository.assessments[0] = { ...validAssessment(), closesAt: new Date("2026-08-21T00:00:00.000Z") };
    await expect(service.publishAssessment(actor, "assessment-1")).rejects.toMatchObject({
      code: "invalid_time_window",
    } satisfies Partial<AssessmentPolicyError>);

    repository.assessments[0] = { ...validAssessment(), maxAttempts: 0 };
    await expect(service.publishAssessment(actor, "assessment-1")).rejects.toMatchObject({
      code: "invalid_attempt_limit",
    } satisfies Partial<AssessmentPolicyError>);
  });

  it("rejects publishing when approved question supply does not satisfy the blueprint", async () => {
    await expect(service.publishAssessment(actor, "assessment-1")).rejects.toMatchObject({
      code: "insufficient_approved_questions",
      message: "listening_requires_1_approved_questions",
    } satisfies Partial<AssessmentPolicyError>);
  });

  it("rejects scoring policies that do not match blueprint total points", async () => {
    await service.approveQuestion(actor, "q-listen-1");
    repository.assessments[0] = {
      ...validAssessment(),
      scoringPolicy: { version: 1, publishMode: "manual", totalPoints: 99 },
    };

    await expect(service.publishAssessment(actor, "assessment-1")).rejects.toMatchObject({
      code: "invalid_scoring_policy",
    } satisfies Partial<AssessmentPolicyError>);
  });
});

function validAssessment(): AssessmentPolicyReference {
  return {
    id: "assessment-1",
    organizationId: "org-1",
    bankId: "bank-1",
    kind: "entrance",
    status: "draft",
    title: "Bài kiểm tra đầu vào A2",
    opensAt: new Date("2026-08-23T00:00:00.000Z"),
    closesAt: new Date("2026-08-30T00:00:00.000Z"),
    durationMinutes: 45,
    maxAttempts: 2,
    blueprint: {
      version: 1,
      rules: [
        { skill: "listening", questionType: "listening", level: "A2", count: 1, pointsPerQuestion: 10 },
        { skill: "reading", questionType: "single_choice", level: "A2", count: 1, pointsPerQuestion: 10 },
      ],
    },
    scoringPolicy: {
      version: 1,
      publishMode: "manual",
      totalPoints: 20,
      passingScore: 12,
      recommendationBands: [{ minScore: 0, maxScore: 20, recommendedLevel: "A2", recommendedProgramId: "program-a2" }],
    },
    publicationPolicy: { visibleToStudent: true, visibleToParent: false },
  };
}
