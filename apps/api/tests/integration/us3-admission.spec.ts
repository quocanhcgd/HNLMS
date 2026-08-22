import { describe, expect, it, vi } from "vitest";
import {
  EntranceAssessmentError,
  EntranceAssessmentService,
  InMemoryEntranceAssessmentRepository,
} from "../../src/modules/assessment-english";
import { InMemoryLeadRepository, LeadService } from "../../src/modules/marketing-admission/lead";
import type { LeadRoutingRule } from "../../src/modules/marketing-admission/lead/lead.service";

const now = new Date("2026-08-22T03:00:00.000Z");
const admin = { userId: "admin-1", organizationId: "org-1", canManageAllLeads: true } as const;
const consultant = { userId: "consultant-1", organizationId: "org-1" } as const;

function assessmentFixture() {
  const repository = new InMemoryEntranceAssessmentRepository();
  repository.assessments.push({
    id: "assessment-entrance-1",
    organizationId: "org-1",
    kind: "entrance",
    status: "published",
    title: "IELTS placement",
    opensAt: new Date("2026-08-20T00:00:00.000Z"),
    closesAt: new Date("2026-08-30T00:00:00.000Z"),
  });
  const audit = vi.fn(async () => undefined);
  const service = new EntranceAssessmentService(repository, audit, () => "assignment-1", () => now);
  return { repository, audit, service };
}

describe("US3 admission integration contract", () => {
  it("creates a lead, routes it to the consultant, and assigns an entrance assessment", async () => {
    const leadRepository = new InMemoryLeadRepository();
    const leadService = new LeadService(leadRepository, async () => undefined, (entity) => `${entity}-1`, () => now);
    const { repository, service: assessmentService } = assessmentFixture();

    const created = await leadService.createAndRoute(
      admin,
      {
        fullName: "Nguyễn Minh Anh",
        phone: "090 123 4567",
        email: "minhanh@example.vn",
        source: "public-consultation-form",
        interest: "IELTS",
        interestedBranchId: "branch-cau-giay",
        consent: true,
        consentSource: "public-form",
        clientSubmissionKey: "us3-lead-1",
      },
      [
        {
          id: "rule-ielts-cg",
          priority: 1,
          source: "public-consultation-form",
          interest: "IELTS",
          branchId: "branch-cau-giay",
          consultantUserId: "consultant-1",
        } satisfies LeadRoutingRule,
      ],
    );

    const assessmentLead = {
      id: created.lead.id,
      organizationId: created.lead.organizationId,
      status: created.lead.status,
      activeConsultantUserId: created.assignment.consultantUserId,
    };
    repository.leads.push(assessmentLead);

    const assignment = await assessmentService.assign(consultant, {
      leadId: created.lead.id,
      assessmentId: "assessment-entrance-1",
      invitationChannel: "email",
      expiresAt: new Date("2026-08-25T03:00:00.000Z"),
      clientAssignmentKey: "us3-lead-1-assessment-v1",
    });

    expect(created.assignment).toMatchObject({ consultantUserId: "consultant-1", status: "active" });
    expect(assignment).toMatchObject({ leadId: created.lead.id, status: "assigned" });
    expect(repository.leads[0]?.status).toBe("awaiting_assessment");
  });

  it("links only a published result and advances the lead to class proposal when recommended", async () => {
    const { repository, service } = assessmentFixture();
    repository.leads.push({
      id: "lead-1",
      organizationId: "org-1",
      status: "awaiting_assessment",
      activeConsultantUserId: "consultant-1",
    });
    await service.assign(consultant, {
      leadId: "lead-1",
      assessmentId: "assessment-entrance-1",
      invitationChannel: "manual",
      expiresAt: new Date("2026-08-25T03:00:00.000Z"),
      clientAssignmentKey: "lead-1-assessment-v1",
    });

    const completed = await service.linkPublishedResult(consultant, "assignment-1", {
      id: "result-1",
      organizationId: "org-1",
      assessmentId: "assessment-entrance-1",
      publicationStatus: "published",
      recommendedProgramId: "program-ielts",
      recommendedClassId: "class-ielts-f01",
    });

    expect(completed).toMatchObject({ status: "completed", resultId: "result-1" });
    expect(repository.leads[0]?.status).toBe("class_proposed");
  });

  it("is idempotent for retries and rejects a changed request under the same key", async () => {
    const { repository, service } = assessmentFixture();
    repository.leads.push({
      id: "lead-1",
      organizationId: "org-1",
      status: "consulting",
      activeConsultantUserId: "consultant-1",
    });
    const input = {
      leadId: "lead-1",
      assessmentId: "assessment-entrance-1",
      invitationChannel: "sms" as const,
      expiresAt: new Date("2026-08-25T03:00:00.000Z"),
      clientAssignmentKey: "lead-1-assessment-v1",
    };

    const first = await service.assign(consultant, input);
    const retry = await service.assign(consultant, input);
    expect(retry).toEqual(first);
    expect(repository.assignments).toHaveLength(1);

    await expect(service.assign(consultant, { ...input, invitationChannel: "email" })).rejects.toMatchObject({
      code: "idempotency_conflict",
    } satisfies Partial<EntranceAssessmentError>);
  });

  it("does not allow a consultant to access another consultant's lead or another tenant's records", async () => {
    const { repository, service } = assessmentFixture();
    repository.leads.push({
      id: "lead-1",
      organizationId: "org-1",
      status: "consulting",
      activeConsultantUserId: "consultant-1",
    });

    await expect(service.assign({ userId: "consultant-2", organizationId: "org-1" }, {
      leadId: "lead-1",
      assessmentId: "assessment-entrance-1",
      invitationChannel: "manual",
      expiresAt: new Date("2026-08-25T03:00:00.000Z"),
      clientAssignmentKey: "cross-scope-1",
    })).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<EntranceAssessmentError>);

    await expect(service.assign({ userId: "consultant-1", organizationId: "org-2" }, {
      leadId: "lead-1",
      assessmentId: "assessment-entrance-1",
      invitationChannel: "manual",
      expiresAt: new Date("2026-08-25T03:00:00.000Z"),
      clientAssignmentKey: "cross-tenant-1",
    })).rejects.toMatchObject({ code: "not_found" } satisfies Partial<EntranceAssessmentError>);
  });
});
