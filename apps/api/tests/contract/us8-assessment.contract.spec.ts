import { describe, expect, it, vi } from "vitest";
import { AssessmentAttemptError, AssessmentAttemptService } from "../../src/modules/assessment-english/assessment-attempt.service.js";
import { InMemoryAssessmentAttemptRepository } from "../../src/modules/assessment-english/in-memory-assessment-attempt-repository.js";
import { AssessmentPolicyService } from "../../src/modules/assessment-english/assessment-policy.service.js";
import { InMemoryAssessmentPolicyRepository } from "../../src/modules/assessment-english/in-memory-assessment-policy-repository.js";

const now = new Date("2026-08-22T07:00:00.000Z");
const student = { organizationId: "org-1", userId: "student-1" };
const manager = { organizationId: "org-1", userId: "academic-manager-1", canManageAssessments: true };

describe("US8 assessment contract", () => {
  it("publishes only valid assessment policy, creates a timed attempt and makes duplicate start retry idempotent", async () => {
    const policyRepository = new InMemoryAssessmentPolicyRepository();
    policyRepository.banks.push({ id: "bank-1", organizationId: "org-1", status: "active" });
    policyRepository.questions.push({
      id: "q-1",
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
    });
    policyRepository.questionVersionCounts.set("org-1:q-1", 1);
    policyRepository.assessments.push({
      id: "assessment-1",
      organizationId: "org-1",
      bankId: "bank-1",
      kind: "entrance",
      status: "draft",
      title: "Kiểm tra đầu vào A2",
      opensAt: new Date("2026-08-22T00:00:00.000Z"),
      closesAt: new Date("2026-08-30T00:00:00.000Z"),
      durationMinutes: 45,
      maxAttempts: 1,
      blueprint: { version: 1, rules: [{ skill: "reading", questionType: "single_choice", level: "A2", count: 1, pointsPerQuestion: 10 }] },
      scoringPolicy: { version: 1, publishMode: "manual", totalPoints: 10, passingScore: 6 },
      publicationPolicy: { visibleToStudent: true },
    });
    const policyService = new AssessmentPolicyService(policyRepository, vi.fn(), () => now);
    const published = await policyService.publishAssessment(manager, "assessment-1");
    expect(published.status).toBe("published");

    const attemptRepository = new InMemoryAssessmentAttemptRepository();
    attemptRepository.assessments.push({
      id: "assessment-1",
      organizationId: "org-1",
      status: "published",
      opensAt: new Date("2026-08-22T00:00:00.000Z"),
      closesAt: new Date("2026-08-30T00:00:00.000Z"),
      durationMinutes: 45,
      maxAttempts: 1,
    });
    const attemptService = new AssessmentAttemptService(attemptRepository, vi.fn(), () => now, () => "attempt-1");
    const first = await attemptService.start(student, { assessmentId: "assessment-1", clientAttemptKey: "start-key-1" });
    const retry = await attemptService.start(student, { assessmentId: "assessment-1", clientAttemptKey: "start-key-1" });

    expect(retry).toEqual(first);
    expect(first.expiresAt?.toISOString()).toBe("2026-08-22T07:45:00.000Z");
    await expect(attemptService.start(student, { assessmentId: "assessment-1", clientAttemptKey: "start-key-2" })).rejects.toMatchObject({
      code: "attempt_limit_exceeded",
    } satisfies Partial<AssessmentAttemptError>);
  });

  it("autosaves, rejects conflicting submit retry and auto-submits on timeout", async () => {
    const repository = new InMemoryAssessmentAttemptRepository();
    repository.assessments.push({
      id: "assessment-1",
      organizationId: "org-1",
      status: "published",
      opensAt: new Date("2026-08-22T00:00:00.000Z"),
      closesAt: new Date("2026-08-30T00:00:00.000Z"),
      durationMinutes: 1,
      maxAttempts: 2,
    });
    let clock = now;
    const service = new AssessmentAttemptService(repository, vi.fn(), () => clock, () => "attempt-1");
    await service.start(student, { assessmentId: "assessment-1", clientAttemptKey: "start-key" });
    const saved = await service.autosave(student, { attemptId: "attempt-1", autosaveKey: "autosave-1", answers: { q1: "A" } });
    expect(saved.autosaveState).toMatchObject({ lastAutosaveKey: "autosave-1" });

    const submitted = await service.submit(student, { attemptId: "attempt-1", clientSubmitKey: "submit-1", answers: { q1: "A" } });
    expect(submitted.status).toBe("submitted");
    await expect(service.submit(student, { attemptId: "attempt-1", clientSubmitKey: "submit-2", answers: { q1: "B" } })).rejects.toMatchObject({
      code: "idempotency_conflict",
    } satisfies Partial<AssessmentAttemptError>);

    const timeoutService = new AssessmentAttemptService(repository, vi.fn(), () => clock, () => "attempt-2");
    await timeoutService.start(student, { assessmentId: "assessment-1", clientAttemptKey: "start-key-timeout" });
    clock = new Date("2026-08-22T07:02:00.000Z");
    const timedOut = await timeoutService.timeout(student, "attempt-2");
    expect(timedOut.status).toBe("auto_submitted");
  });
});
