import { beforeEach, describe, expect, it, vi } from "vitest";
import { EntranceAssessmentError, EntranceAssessmentService } from "./entrance-assessment.service";
import { InMemoryEntranceAssessmentRepository } from "./in-memory-entrance-assessment-repository";

const now = new Date("2026-08-22T03:00:00.000Z");
const actor = { userId: "consultant-1", organizationId: "org-1" };

describe("T056 entrance assessment assignment", () => {
  let repository: InMemoryEntranceAssessmentRepository;
  let audit: ReturnType<typeof vi.fn>;
  let service: EntranceAssessmentService;

  beforeEach(() => {
    repository = new InMemoryEntranceAssessmentRepository();
    repository.leads.push({
      id: "lead-1",
      organizationId: "org-1",
      status: "consulting",
      activeConsultantUserId: "consultant-1",
    });
    repository.assessments.push({
      id: "assessment-1",
      organizationId: "org-1",
      kind: "entrance",
      status: "published",
      title: "IELTS placement",
      opensAt: new Date("2026-08-20T00:00:00.000Z"),
      closesAt: new Date("2026-08-30T00:00:00.000Z"),
    });
    audit = vi.fn(async () => undefined);
    service = new EntranceAssessmentService(
      repository,
      audit,
      () => "assignment-1",
      () => now,
    );
  });

  const input = () => ({
    leadId: "lead-1",
    assessmentId: "assessment-1",
    invitationChannel: "sms" as const,
    expiresAt: new Date("2026-08-25T03:00:00.000Z"),
    clientAssignmentKey: "lead-1-placement-v1",
  });

  it("assigns a published entrance assessment and moves the lead to awaiting assessment", async () => {
    const assignment = await service.assign(actor, input());

    expect(assignment).toMatchObject({
      id: "assignment-1",
      organizationId: "org-1",
      leadId: "lead-1",
      assessmentId: "assessment-1",
      status: "assigned",
    });
    expect(repository.leads[0]?.status).toBe("awaiting_assessment");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "entrance-assessment.assigned", entityId: "assignment-1" }),
    );
  });

  it("returns the same assignment for an identical idempotency key", async () => {
    const first = await service.assign(actor, input());
    const second = await service.assign(actor, input());

    expect(second).toEqual(first);
    expect(repository.assignments).toHaveLength(1);
    expect(audit).toHaveBeenCalledTimes(1);
  });

  it("rejects reusing an idempotency key with a different request", async () => {
    await service.assign(actor, input());

    await expect(service.assign(actor, { ...input(), invitationChannel: "email" })).rejects.toMatchObject({
      code: "idempotency_conflict",
    } satisfies Partial<EntranceAssessmentError>);
  });

  it("enforces tenant and consultant ownership without leaking cross-tenant records", async () => {
    await expect(
      service.assign({ userId: "consultant-2", organizationId: "org-1" }, input()),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<EntranceAssessmentError>);
    await expect(
      service.assign({ userId: "consultant-1", organizationId: "org-2" }, input()),
    ).rejects.toMatchObject({ code: "not_found" } satisfies Partial<EntranceAssessmentError>);
  });

  it("rejects closed/non-entrance assessments and terminal leads", async () => {
    repository.assessments[0] = { ...repository.assessments[0]!, kind: "mock" };
    await expect(service.assign(actor, input())).rejects.toMatchObject({
      code: "assessment_unavailable",
    } satisfies Partial<EntranceAssessmentError>);

    repository.assessments[0] = {
      ...repository.assessments[0]!,
      kind: "entrance",
      closesAt: new Date("2026-08-21T00:00:00.000Z"),
    };
    await expect(service.assign(actor, input())).rejects.toMatchObject({
      code: "assessment_unavailable",
    } satisfies Partial<EntranceAssessmentError>);

    repository.assessments[0] = {
      ...repository.assessments[0]!,
      closesAt: new Date("2026-08-30T00:00:00.000Z"),
    };
    repository.leads[0] = { ...repository.leads[0]!, status: "enrolled" };
    await expect(service.assign(actor, input())).rejects.toMatchObject({
      code: "invalid_lead_status",
    } satisfies Partial<EntranceAssessmentError>);
  });

  it("requires expiry inside the assessment window", async () => {
    await expect(
      service.assign(actor, { ...input(), expiresAt: new Date("2026-08-31T00:00:00.000Z") }),
    ).rejects.toMatchObject({
      code: "invalid_input",
      message: "expires_at_after_assessment_window",
    } satisfies Partial<EntranceAssessmentError>);
  });

  it("links a published result and advances a recommendation to class proposed", async () => {
    await service.assign(actor, input());
    const completed = await service.linkPublishedResult(actor, "assignment-1", {
      id: "result-1",
      organizationId: "org-1",
      assessmentId: "assessment-1",
      publicationStatus: "published",
      recommendedClassId: "class-1",
    });

    expect(completed).toMatchObject({ status: "completed", resultId: "result-1" });
    expect(repository.leads[0]?.status).toBe("class_proposed");
    expect(audit).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: "entrance-assessment.result-linked", entityId: "assignment-1" }),
    );
  });

  it("links a result idempotently and keeps no-recommendation leads in consulting", async () => {
    await service.assign(actor, input());
    const result = {
      id: "result-1",
      organizationId: "org-1",
      assessmentId: "assessment-1",
      publicationStatus: "published" as const,
    };
    const first = await service.linkPublishedResult(actor, "assignment-1", result);
    const second = await service.linkPublishedResult(actor, "assignment-1", result);

    expect(second).toEqual(first);
    expect(repository.leads[0]?.status).toBe("consulting");
    expect(audit).toHaveBeenCalledTimes(2);
  });

  it("rejects draft, cross-tenant, and mismatched assessment results", async () => {
    await service.assign(actor, input());
    for (const result of [
      {
        id: "result-1",
        organizationId: "org-1",
        assessmentId: "assessment-1",
        publicationStatus: "draft" as const,
      },
      {
        id: "result-2",
        organizationId: "org-2",
        assessmentId: "assessment-1",
        publicationStatus: "published" as const,
      },
      {
        id: "result-3",
        organizationId: "org-1",
        assessmentId: "assessment-2",
        publicationStatus: "published" as const,
      },
    ]) {
      await expect(service.linkPublishedResult(actor, "assignment-1", result)).rejects.toMatchObject({
        code: "result_unavailable",
      } satisfies Partial<EntranceAssessmentError>);
    }
  });
});
