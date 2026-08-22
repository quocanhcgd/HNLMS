
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AssessmentAttemptError, AssessmentAttemptService, type AttemptAssessmentReference, type TimedAssessmentAttempt } from "./assessment-attempt.service";
import { InMemoryAssessmentAttemptRepository } from "./in-memory-assessment-attempt-repository";

const now = new Date("2026-08-22T05:00:00.000Z");
const actor = { organizationId: "org-1", userId: "student-1", leadId: undefined };

describe("T083 timed attempt state machine", () => {
  let repository: InMemoryAssessmentAttemptRepository;
  let audit: ReturnType<typeof vi.fn>;
  let service: AssessmentAttemptService;

  beforeEach(() => {
    repository = new InMemoryAssessmentAttemptRepository();
    repository.assessments.push(timedAssessment());
    audit = vi.fn(async () => undefined);
    service = new AssessmentAttemptService(repository, audit, () => now, () => "attempt-1");
  });

  it("starts an attempt and expires according to duration window", async () => {
    const attempt = await service.start(actor, {
      assessmentId: "assessment-1",
      clientAttemptKey: "attempt-v1",
    });

    expect(attempt).toMatchObject({
      status: "in_progress",
      attemptNo: 1,
      expiresAt: new Date("2026-08-22T05:45:00.000Z"),
    });
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "assessment.attempt-started", entityId: "attempt-1" }),
    );
  });

  it("rejects duplicate start with mismatched idempotency key", async () => {
    await service.start(actor, { assessmentId: "assessment-1", clientAttemptKey: "attempt-v1" });
    await expect(
      service.start({ ...actor, userId: "student-2" }, { assessmentId: "assessment-1", clientAttemptKey: "attempt-v1" }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" } satisfies Partial<AssessmentAttemptError>);
  });

  it("autosaves answers while in_progress and respects expiration path", async () => {
    await service.start(actor, { assessmentId: "assessment-1", clientAttemptKey: "attempt-autosave" });

    const attempt = await service.autosave(actor, {
      attemptId: "attempt-1",
      answers: { q1: "A" },
      autosaveKey: "key-1",
    });

    expect(attempt.autosaveState).toMatchObject({ lastAutosaveKey: "key-1" });

    service = new AssessmentAttemptService(
      repository,
      audit,
      () => new Date("2026-08-22T06:00:00.000Z"),
      () => "attempt-1",
    );
    const timedOut = await service.autosave(actor, {
      attemptId: "attempt-1",
      answers: { q1: "B" },
      autosaveKey: "key-2",
    });

    expect(timedOut.status).toBe("auto_submitted");
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: "assessment.attempt-timeout" }),
    );
  });

  it("submits and keeps result idempotent only for the same submit payload", async () => {
    await service.start(actor, { assessmentId: "assessment-1", clientAttemptKey: "attempt-submit" });

    const first = await service.submit(actor, {
      attemptId: "attempt-1",
      answers: { q1: "A" },
      clientSubmitKey: "submit-1",
    });
    const same = await service.submit(actor, {
      attemptId: "attempt-1",
      answers: { q1: "A" },
      clientSubmitKey: "submit-1",
    });

    expect(first.id).toBe("attempt-1");
    expect(same.id).toBe("attempt-1");

    await expect(
      service.submit(actor, { attemptId: "attempt-1", answers: { q1: "B" }, clientSubmitKey: "submit-2" }),
    ).rejects.toMatchObject({ code: "idempotency_conflict" } satisfies Partial<AssessmentAttemptError>);
  });

  it("forces timeout when submitting after expiry", async () => {
    const attempt = await service.start(actor, { assessmentId: "assessment-1", clientAttemptKey: "attempt-timeout" });
    service = new AssessmentAttemptService(
      repository,
      audit,
      () => new Date("2026-08-22T06:00:00.000Z"),
      () => "attempt-1",
    );

    const timedOut = await service.submit(actor, {
      attemptId: attempt.id,
      answers: { q1: "A" },
      clientSubmitKey: "submit-after-timeout",
    });

    expect(timedOut.status).toBe("auto_submitted");
  });
});

function timedAssessment(): AttemptAssessmentReference {
  return {
    id: "assessment-1",
    organizationId: "org-1",
    status: "published",
    opensAt: new Date("2026-08-20T00:00:00.000Z"),
    closesAt: new Date("2026-08-30T00:00:00.000Z"),
    durationMinutes: 45,
    maxAttempts: 2,
  };
}
