import type { Lead, LeadAssignment } from "../schema";

export type LeadStatus = Lead["status"];

export type LeadActor = {
  userId: string;
  organizationId: string;
  canManageAllLeads?: boolean;
};

export type CreateLeadInput = {
  fullName: string;
  phone: string;
  email?: string;
  source: string;
  sourceDetails?: unknown;
  interest: string;
  interestedBranchId?: string;
  programInterestId?: string;
  message?: string;
  consent: boolean;
  consentSource: string;
  consentVersion?: string;
  clientSubmissionKey?: string;
};

export type AssignmentTarget = {
  branchId?: string;
  consultantUserId?: string;
};

export type LeadRoutingRule = AssignmentTarget & {
  id: string;
  priority: number;
  active?: boolean;
  source?: string;
  interest?: string;
  interestedBranchId?: string;
  programInterestId?: string;
};

export type LeadRepository = {
  create(input: Lead): Promise<Lead>;
  findById(input: { organizationId: string; leadId: string }): Promise<Lead | null>;
  findDuplicateCandidates(input: {
    organizationId: string;
    normalizedPhone: string;
    normalizedEmail?: string;
    excludeLeadId?: string;
  }): Promise<Lead[]>;
  update(input: {
    organizationId: string;
    leadId: string;
    changes: Partial<Pick<Lead, "status" | "updatedAt">>;
  }): Promise<Lead>;
  findActiveAssignment(input: { organizationId: string; leadId: string }): Promise<LeadAssignment | null>;
  replaceActiveAssignment(input: {
    organizationId: string;
    leadId: string;
    next: LeadAssignment;
    previousStatus: "transferred" | "completed" | "cancelled";
    now: Date;
  }): Promise<{ previous: LeadAssignment | null; current: LeadAssignment }>;
};

export type LeadAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "lead.created" | "lead.duplicate-detected" | "lead.assigned" | "lead.transferred" | "lead.status-changed";
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) => Promise<void>;

export type LeadErrorCode = "not_found" | "forbidden" | "invalid_input" | "invalid_status" | "routing_unavailable";

export class LeadServiceError extends Error {
  constructor(
    public readonly code: LeadErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "LeadServiceError";
  }
}

const allowedTransitions: Record<LeadStatus, ReadonlySet<LeadStatus>> = {
  new: new Set(["contacted", "consulting", "awaiting_assessment", "disqualified", "archived"]),
  contacted: new Set(["consulting", "awaiting_assessment", "disqualified", "archived"]),
  consulting: new Set(["contacted", "awaiting_assessment", "class_proposed", "disqualified", "archived"]),
  awaiting_assessment: new Set(["consulting", "class_proposed", "disqualified", "archived"]),
  class_proposed: new Set(["consulting", "enrolled", "disqualified", "archived"]),
  enrolled: new Set(["archived"]),
  disqualified: new Set(["consulting", "archived"]),
  archived: new Set(),
};

function requiredText(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new LeadServiceError("invalid_input", `${field}_required`);
  return normalized;
}

export function normalizeLeadPhone(value: string): string {
  const raw = requiredText(value, "phone");
  if (!/^[+\d][\d\s().-]{6,31}$/.test(raw)) {
    throw new LeadServiceError("invalid_input", "phone_invalid");
  }
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length >= 10) digits = `0${digits.slice(2)}`;
  if (digits.length < 8 || digits.length > 15) {
    throw new LeadServiceError("invalid_input", "phone_invalid");
  }
  return digits;
}

export function normalizeLeadEmail(value?: string): string | undefined {
  const email = value?.trim().toLowerCase();
  if (!email) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new LeadServiceError("invalid_input", "email_invalid");
  }
  return email;
}

function normalizeOptional(value?: string): string | undefined {
  return value?.trim() || undefined;
}

function sameTarget(assignment: LeadAssignment, target: AssignmentTarget): boolean {
  return (
    assignment.branchId === (target.branchId ?? null) &&
    assignment.consultantUserId === (target.consultantUserId ?? null)
  );
}

function ruleMatches(rule: LeadRoutingRule, lead: Lead): boolean {
  if (rule.active === false) return false;
  if (rule.source && rule.source.toLowerCase() !== lead.source.toLowerCase()) return false;
  if (rule.interest && rule.interest.toLowerCase() !== lead.interest.toLowerCase()) return false;
  if (rule.interestedBranchId && rule.interestedBranchId !== lead.interestedBranchId) return false;
  if (rule.programInterestId && rule.programInterestId !== lead.programInterestId) return false;
  return true;
}

export function resolveLeadRoute(
  lead: Lead,
  rules: readonly LeadRoutingRule[],
): (AssignmentTarget & { ruleId?: string }) | null {
  const match = [...rules]
    .filter((rule) => ruleMatches(rule, lead) && (rule.branchId || rule.consultantUserId))
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id))[0];
  if (match) {
    return {
      ...(match.branchId ? { branchId: match.branchId } : {}),
      ...(match.consultantUserId ? { consultantUserId: match.consultantUserId } : {}),
      ruleId: match.id,
    };
  }
  return lead.interestedBranchId ? { branchId: lead.interestedBranchId } : null;
}

export class LeadService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly audit: LeadAudit = async () => undefined,
    private readonly newId: (entity: "lead" | "assignment") => string = () => crypto.randomUUID(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  async create(actor: LeadActor, input: CreateLeadInput): Promise<{ lead: Lead; duplicates: Lead[] }> {
    if (!input.consent) throw new LeadServiceError("invalid_input", "consent_required");
    const fullName = requiredText(input.fullName, "full_name");
    const phone = requiredText(input.phone, "phone");
    const normalizedPhone = normalizeLeadPhone(phone);
    const normalizedEmail = normalizeLeadEmail(input.email);
    const source = requiredText(input.source, "source");
    const interest = requiredText(input.interest, "interest");
    const consentSource = requiredText(input.consentSource, "consent_source");
    const createdAt = this.now();
    const duplicates = await this.repository.findDuplicateCandidates({
      organizationId: actor.organizationId,
      normalizedPhone,
      normalizedEmail,
    });
    const lead = await this.repository.create({
      id: this.newId("lead"),
      organizationId: actor.organizationId,
      fullName,
      phone,
      normalizedPhone,
      email: normalizeOptional(input.email) ?? null,
      normalizedEmail: normalizedEmail ?? null,
      source,
      sourceDetails: input.sourceDetails ?? null,
      interest,
      interestedBranchId: normalizeOptional(input.interestedBranchId) ?? null,
      programInterestId: normalizeOptional(input.programInterestId) ?? null,
      message: normalizeOptional(input.message) ?? null,
      consentedAt: createdAt,
      consentSource,
      consentVersion: normalizeOptional(input.consentVersion) ?? null,
      clientSubmissionKey: normalizeOptional(input.clientSubmissionKey) ?? null,
      status: "new",
      createdAt,
      updatedAt: createdAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "lead.created",
      entityId: lead.id,
      after: { source: lead.source, status: lead.status, interestedBranchId: lead.interestedBranchId },
    });
    if (duplicates.length) {
      await this.audit({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "lead.duplicate-detected",
        entityId: lead.id,
        after: { candidateIds: duplicates.map((candidate) => candidate.id) },
      });
    }
    return { lead, duplicates };
  }

  async createAndRoute(actor: LeadActor, input: CreateLeadInput, rules: readonly LeadRoutingRule[]) {
    const created = await this.create(actor, input);
    const assignment = await this.route(actor, created.lead.id, rules);
    return { ...created, assignment };
  }

  async get(actor: LeadActor, leadId: string): Promise<Lead> {
    const lead = await this.repository.findById({ organizationId: actor.organizationId, leadId });
    if (!lead || lead.organizationId !== actor.organizationId) {
      throw new LeadServiceError("not_found", "lead_not_found");
    }
    return lead;
  }

  async findDuplicates(actor: LeadActor, input: { phone: string; email?: string; excludeLeadId?: string }) {
    return this.repository.findDuplicateCandidates({
      organizationId: actor.organizationId,
      normalizedPhone: normalizeLeadPhone(input.phone),
      normalizedEmail: normalizeLeadEmail(input.email),
      excludeLeadId: input.excludeLeadId,
    });
  }

  async route(actor: LeadActor, leadId: string, rules: readonly LeadRoutingRule[]): Promise<LeadAssignment> {
    const lead = await this.get(actor, leadId);
    const decision = resolveLeadRoute(lead, rules);
    if (!decision) throw new LeadServiceError("routing_unavailable");
    return this.assign(
      actor,
      lead.id,
      decision,
      decision.ruleId ? `routing_rule:${decision.ruleId}` : "branch_fallback",
    );
  }

  async assign(actor: LeadActor, leadId: string, target: AssignmentTarget, reason?: string): Promise<LeadAssignment> {
    await this.get(actor, leadId);
    const branchId = normalizeOptional(target.branchId);
    const consultantUserId = normalizeOptional(target.consultantUserId);
    if (!branchId && !consultantUserId) throw new LeadServiceError("invalid_input", "assignment_target_required");
    const existing = await this.repository.findActiveAssignment({ organizationId: actor.organizationId, leadId });
    if (existing && sameTarget(existing, { branchId, consultantUserId })) return existing;
    const assignedAt = this.now();
    const result = await this.repository.replaceActiveAssignment({
      organizationId: actor.organizationId,
      leadId,
      next: {
        id: this.newId("assignment"),
        organizationId: actor.organizationId,
        leadId,
        branchId: branchId ?? null,
        consultantUserId: consultantUserId ?? null,
        status: "active",
        reason: normalizeOptional(reason) ?? null,
        assignedByUserId: actor.userId,
        assignedAt,
        endedAt: null,
        createdAt: assignedAt,
        updatedAt: assignedAt,
      },
      previousStatus: "transferred",
      now: assignedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: result.previous ? "lead.transferred" : "lead.assigned",
      entityId: leadId,
      before: result.previous
        ? { assignmentId: result.previous.id, consultantUserId: result.previous.consultantUserId }
        : undefined,
      after: {
        assignmentId: result.current.id,
        branchId: result.current.branchId,
        consultantUserId: result.current.consultantUserId,
      },
    });
    return result.current;
  }

  async assertOwnership(actor: LeadActor, leadId: string): Promise<LeadAssignment> {
    await this.get(actor, leadId);
    const assignment = await this.repository.findActiveAssignment({ organizationId: actor.organizationId, leadId });
    if (!assignment || assignment.consultantUserId !== actor.userId) {
      throw new LeadServiceError("forbidden", "lead_not_owned_by_actor");
    }
    return assignment;
  }

  async transition(actor: LeadActor, leadId: string, status: LeadStatus): Promise<Lead> {
    const before = await this.get(actor, leadId);
    if (!actor.canManageAllLeads) await this.assertOwnership(actor, leadId);
    if (before.status === status) return before;
    if (!allowedTransitions[before.status].has(status)) {
      throw new LeadServiceError("invalid_status", `${before.status}_to_${status}_not_allowed`);
    }
    const after = await this.repository.update({
      organizationId: actor.organizationId,
      leadId,
      changes: { status, updatedAt: this.now() },
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "lead.status-changed",
      entityId: leadId,
      before: { status: before.status },
      after: { status: after.status },
    });
    return after;
  }
}
