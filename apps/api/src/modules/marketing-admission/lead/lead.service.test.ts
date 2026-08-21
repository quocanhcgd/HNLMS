import { describe, expect, it, vi } from "vitest";
import { InMemoryLeadRepository } from "./in-memory-lead-repository";
import {
  LeadService,
  normalizeLeadEmail,
  normalizeLeadPhone,
  resolveLeadRoute,
  type CreateLeadInput,
  type LeadActor,
} from "./lead.service";

const now = new Date("2026-08-22T00:00:00.000Z");
const admin: LeadActor = { userId: "admin-a", organizationId: "org-a", canManageAllLeads: true };
const consultant: LeadActor = { userId: "consultant-a", organizationId: "org-a" };

const input: CreateLeadInput = {
  fullName: "Nguyễn Minh Anh",
  phone: "090 123 4567",
  email: "MinhAnh@example.com",
  source: "public-consultation-form",
  interest: "ielts",
  interestedBranchId: "branch-a",
  message: "Mục tiêu IELTS 7.0",
  consent: true,
  consentSource: "public-form",
  consentVersion: "2026-08",
  clientSubmissionKey: "submission-1",
};

function fixture() {
  const repository = new InMemoryLeadRepository();
  const audit = vi.fn(async () => undefined);
  let sequence = 0;
  const service = new LeadService(
    repository,
    audit,
    (entity) => `${entity}-${++sequence}`,
    () => now,
  );
  return { repository, audit, service };
}

describe("lead normalization and duplicate detection", () => {
  it("normalizes Vietnamese phone numbers and email casing", () => {
    expect(normalizeLeadPhone("+84 901 234 567")).toBe("0901234567");
    expect(normalizeLeadPhone("090.123.4567")).toBe("0901234567");
    expect(normalizeLeadEmail(" MinhAnh@Example.COM ")).toBe("minhanh@example.com");
  });

  it("rejects missing consent and malformed contact data", async () => {
    const { service } = fixture();
    await expect(service.create(admin, { ...input, consent: false })).rejects.toThrow("consent_required");
    await expect(service.create(admin, { ...input, phone: "invalid" })).rejects.toThrow("phone_invalid");
    await expect(service.create(admin, { ...input, email: "invalid" })).rejects.toThrow("email_invalid");
  });

  it("creates an audited tenant-owned lead with normalized contact fields", async () => {
    const { service, audit } = fixture();
    const result = await service.create(admin, input);

    expect(result.duplicates).toEqual([]);
    expect(result.lead).toMatchObject({
      id: "lead-1",
      organizationId: "org-a",
      normalizedPhone: "0901234567",
      normalizedEmail: "minhanh@example.com",
      status: "new",
      consentedAt: now,
    });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "lead.created", entityId: "lead-1" }));
  });

  it("detects phone or email duplicates only inside the same organization", async () => {
    const { service, audit } = fixture();
    const first = await service.create(admin, input);
    const duplicate = await service.create(admin, {
      ...input,
      phone: "+84 901 234 567",
      email: "another@example.com",
      clientSubmissionKey: "submission-2",
    });
    const otherTenant = await service.create(
      { ...admin, organizationId: "org-b" },
      { ...input, clientSubmissionKey: "submission-b" },
    );

    expect(duplicate.duplicates.map((lead) => lead.id)).toEqual([first.lead.id]);
    expect(otherTenant.duplicates).toEqual([]);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "lead.duplicate-detected",
        after: { candidateIds: [first.lead.id] },
      }),
    );
  });
});

describe("lead routing and ownership", () => {
  it("uses the highest-priority active matching rule", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    const assignment = await service.route(admin, lead.id, [
      { id: "later", priority: 20, interest: "ielts", consultantUserId: "consultant-b" },
      { id: "disabled", priority: 1, interest: "ielts", consultantUserId: "consultant-disabled", active: false },
      {
        id: "preferred",
        priority: 10,
        source: "public-consultation-form",
        interest: "ielts",
        branchId: "branch-a",
        consultantUserId: "consultant-a",
      },
    ]);

    expect(assignment).toMatchObject({
      branchId: "branch-a",
      consultantUserId: "consultant-a",
      reason: "routing_rule:preferred",
      status: "active",
    });
  });

  it("falls back to the interested branch and rejects an unroutable lead", async () => {
    const { service } = fixture();
    const withBranch = await service.create(admin, input);
    await expect(service.route(admin, withBranch.lead.id, [])).resolves.toMatchObject({
      branchId: "branch-a",
      consultantUserId: null,
      reason: "branch_fallback",
    });

    const withoutBranch = await service.create(admin, {
      ...input,
      phone: "0912345678",
      email: "second@example.com",
      interestedBranchId: undefined,
      clientSubmissionKey: "submission-2",
    });
    await expect(service.route(admin, withoutBranch.lead.id, [])).rejects.toMatchObject({
      code: "routing_unavailable",
    });
  });

  it("transfers ownership by closing the previous assignment", async () => {
    const { service, repository, audit } = fixture();
    const { lead } = await service.create(admin, input);
    await service.assign(admin, lead.id, { branchId: "branch-a", consultantUserId: "consultant-a" }, "initial");
    const transferred = await service.assign(
      admin,
      lead.id,
      { branchId: "branch-b", consultantUserId: "consultant-b" },
      "workload-balance",
    );

    expect(transferred).toMatchObject({ consultantUserId: "consultant-b", status: "active" });
    expect(repository.assignments).toHaveLength(2);
    expect(repository.assignments[0]).toMatchObject({ status: "transferred", endedAt: now });
    expect(repository.assignments[1]).toMatchObject({ status: "active", endedAt: null });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "lead.transferred", entityId: lead.id }));
  });

  it("keeps an identical active assignment idempotent", async () => {
    const { service, repository } = fixture();
    const { lead } = await service.create(admin, input);
    const target = { branchId: "branch-a", consultantUserId: "consultant-a" };
    const first = await service.assign(admin, lead.id, target);
    const second = await service.assign(admin, lead.id, target);

    expect(second.id).toBe(first.id);
    expect(repository.assignments).toHaveLength(1);
  });

  it("allows only the active consultant owner and hides cross-tenant leads", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    await service.assign(admin, lead.id, { consultantUserId: consultant.userId });

    await expect(service.assertOwnership(consultant, lead.id)).resolves.toMatchObject({
      consultantUserId: consultant.userId,
    });
    await expect(service.assertOwnership({ ...consultant, userId: "consultant-b" }, lead.id)).rejects.toMatchObject({
      code: "forbidden",
    });
    await expect(service.get({ ...admin, organizationId: "org-b" }, lead.id)).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("requires a branch or consultant assignment target", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    await expect(service.assign(admin, lead.id, {})).rejects.toThrow("assignment_target_required");
  });
});

describe("lead lifecycle", () => {
  it("lets the owner advance through the admission lifecycle", async () => {
    const { service, audit } = fixture();
    const { lead } = await service.create(admin, input);
    await service.assign(admin, lead.id, { consultantUserId: consultant.userId });

    await expect(service.transition(consultant, lead.id, "contacted")).resolves.toMatchObject({ status: "contacted" });
    await expect(service.transition(consultant, lead.id, "consulting")).resolves.toMatchObject({
      status: "consulting",
    });
    await expect(service.transition(consultant, lead.id, "awaiting_assessment")).resolves.toMatchObject({
      status: "awaiting_assessment",
    });
    await expect(service.transition(consultant, lead.id, "class_proposed")).resolves.toMatchObject({
      status: "class_proposed",
    });
    await expect(service.transition(consultant, lead.id, "enrolled")).resolves.toMatchObject({ status: "enrolled" });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "lead.status-changed" }));
  });

  it("rejects invalid jumps and treats archived as terminal", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    await expect(service.transition(admin, lead.id, "enrolled")).rejects.toMatchObject({ code: "invalid_status" });
    await service.transition(admin, lead.id, "archived");
    await expect(service.transition(admin, lead.id, "consulting")).rejects.toMatchObject({ code: "invalid_status" });
  });

  it("requires ownership for lifecycle changes unless actor has organization-wide management", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    await expect(service.transition(consultant, lead.id, "contacted")).rejects.toMatchObject({ code: "forbidden" });
    await expect(service.transition(admin, lead.id, "contacted")).resolves.toMatchObject({ status: "contacted" });
  });
});

describe("resolveLeadRoute", () => {
  it("uses deterministic rule ids to break equal-priority ties", async () => {
    const { service } = fixture();
    const { lead } = await service.create(admin, input);
    expect(
      resolveLeadRoute(lead, [
        { id: "rule-b", priority: 10, consultantUserId: "consultant-b" },
        { id: "rule-a", priority: 10, consultantUserId: "consultant-a" },
      ]),
    ).toEqual({ consultantUserId: "consultant-a", ruleId: "rule-a" });
  });
});
