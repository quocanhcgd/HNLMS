import { createHash, randomUUID } from "node:crypto";

export type EntranceAssessmentActor = {
  userId: string;
  organizationId: string;
  canManageAllLeads?: boolean;
};

export type AssessmentReference = {
  id: string;
  organizationId: string;
  kind: "entrance" | "mock" | "practice";
  status: "draft" | "published" | "retired";
  title: string;
  opensAt: Date | null;
  closesAt: Date | null;
};

export type AssessmentLeadReference = {
  id: string;
  organizationId: string;
  status:
    | "new"
    | "contacted"
    | "consulting"
    | "awaiting_assessment"
    | "class_proposed"
    | "enrolled"
    | "disqualified"
    | "archived";
  activeConsultantUserId: string | null;
};

export type EntranceAssessmentAssignment = {
  id: string;
  organizationId: string;
  leadId: string;
  assessmentId: string;
  assignedByUserId: string;
  clientAssignmentKey: string;
  requestFingerprint: string;
  status: "assigned" | "started" | "completed" | "expired" | "cancelled";
  invitationChannel: "email" | "sms" | "manual";
  expiresAt: Date;
  resultId: string | null;
  assignedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EntranceAssessmentResult = {
  id: string;
  organizationId: string;
  assessmentId: string;
  publicationStatus: "draft" | "published";
  recommendedProgramId?: string;
  recommendedClassId?: string;
};

export type AssignEntranceAssessmentInput = {
  leadId: string;
  assessmentId: string;
  invitationChannel: "email" | "sms" | "manual";
  expiresAt: Date;
  clientAssignmentKey: string;
};

export type EntranceAssessmentRepository = {
  findLead(input: { organizationId: string; leadId: string }): Promise<AssessmentLeadReference | null>;
  findAssessment(input: { organizationId: string; assessmentId: string }): Promise<AssessmentReference | null>;
  findAssignmentByKey(input: {
    organizationId: string;
    clientAssignmentKey: string;
  }): Promise<EntranceAssessmentAssignment | null>;
  findAssignment(input: { organizationId: string; assignmentId: string }): Promise<EntranceAssessmentAssignment | null>;
  createAssignmentAndMarkLeadAwaiting(input: {
    assignment: EntranceAssessmentAssignment;
    leadId: string;
  }): Promise<EntranceAssessmentAssignment>;
  completeAssignmentAndUpdateLead(input: {
    organizationId: string;
    assignmentId: string;
    resultId: string;
    leadId: string;
    nextLeadStatus: "consulting" | "class_proposed";
    completedAt: Date;
  }): Promise<EntranceAssessmentAssignment>;
};

export type EntranceAssessmentAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "entrance-assessment.assigned" | "entrance-assessment.result-linked";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export type EntranceAssessmentErrorCode =
  | "not_found"
  | "forbidden"
  | "invalid_input"
  | "invalid_lead_status"
  | "assessment_unavailable"
  | "idempotency_conflict"
  | "invalid_assignment_status"
  | "result_unavailable";

export class EntranceAssessmentError extends Error {
  constructor(
    public readonly code: EntranceAssessmentErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "EntranceAssessmentError";
  }
}

function requiredText(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new EntranceAssessmentError("invalid_input", `${field}_required`);
  return normalized;
}

function assignmentFingerprint(input: AssignEntranceAssessmentInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        leadId: input.leadId,
        assessmentId: input.assessmentId,
        invitationChannel: input.invitationChannel,
        expiresAt: input.expiresAt.toISOString(),
      }),
    )
    .digest("hex");
}

function assertLeadAccess(actor: EntranceAssessmentActor, lead: AssessmentLeadReference): void {
  if (!actor.canManageAllLeads && lead.activeConsultantUserId !== actor.userId) {
    throw new EntranceAssessmentError("forbidden", "lead_not_owned");
  }
}

export class EntranceAssessmentService {
  constructor(
    private readonly repository: EntranceAssessmentRepository,
    private readonly audit: EntranceAssessmentAudit = async () => undefined,
    private readonly newId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async assign(
    actor: EntranceAssessmentActor,
    rawInput: AssignEntranceAssessmentInput,
  ): Promise<EntranceAssessmentAssignment> {
    const input = {
      ...rawInput,
      leadId: requiredText(rawInput.leadId, "lead_id"),
      assessmentId: requiredText(rawInput.assessmentId, "assessment_id"),
      clientAssignmentKey: requiredText(rawInput.clientAssignmentKey, "client_assignment_key"),
    };
    const fingerprint = assignmentFingerprint(input);
    const existing = await this.repository.findAssignmentByKey({
      organizationId: actor.organizationId,
      clientAssignmentKey: input.clientAssignmentKey,
    });
    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        throw new EntranceAssessmentError("idempotency_conflict");
      }
      return existing;
    }

    const lead = await this.repository.findLead({ organizationId: actor.organizationId, leadId: input.leadId });
    if (!lead || lead.organizationId !== actor.organizationId) {
      throw new EntranceAssessmentError("not_found", "lead_not_found");
    }
    assertLeadAccess(actor, lead);
    if (["enrolled", "disqualified", "archived"].includes(lead.status)) {
      throw new EntranceAssessmentError("invalid_lead_status");
    }

    const assessment = await this.repository.findAssessment({
      organizationId: actor.organizationId,
      assessmentId: input.assessmentId,
    });
    if (!assessment || assessment.organizationId !== actor.organizationId) {
      throw new EntranceAssessmentError("not_found", "assessment_not_found");
    }
    const assignedAt = this.now();
    if (
      assessment.kind !== "entrance" ||
      assessment.status !== "published" ||
      (assessment.opensAt && assessment.opensAt > assignedAt) ||
      (assessment.closesAt && assessment.closesAt <= assignedAt)
    ) {
      throw new EntranceAssessmentError("assessment_unavailable");
    }
    if (
      !(input.expiresAt instanceof Date) ||
      Number.isNaN(input.expiresAt.getTime()) ||
      input.expiresAt <= assignedAt
    ) {
      throw new EntranceAssessmentError("invalid_input", "expires_at_must_be_future");
    }
    if (assessment.closesAt && input.expiresAt > assessment.closesAt) {
      throw new EntranceAssessmentError("invalid_input", "expires_at_after_assessment_window");
    }

    const assignment = await this.repository.createAssignmentAndMarkLeadAwaiting({
      leadId: lead.id,
      assignment: {
        id: this.newId(),
        organizationId: actor.organizationId,
        leadId: lead.id,
        assessmentId: assessment.id,
        assignedByUserId: actor.userId,
        clientAssignmentKey: input.clientAssignmentKey,
        requestFingerprint: fingerprint,
        status: "assigned",
        invitationChannel: input.invitationChannel,
        expiresAt: input.expiresAt,
        resultId: null,
        assignedAt,
        completedAt: null,
        createdAt: assignedAt,
        updatedAt: assignedAt,
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "entrance-assessment.assigned",
      entityId: assignment.id,
      after: { leadId: lead.id, assessmentId: assessment.id, expiresAt: assignment.expiresAt.toISOString() },
    });
    return assignment;
  }

  async linkPublishedResult(
    actor: EntranceAssessmentActor,
    assignmentId: string,
    result: EntranceAssessmentResult,
  ): Promise<EntranceAssessmentAssignment> {
    const assignment = await this.repository.findAssignment({
      organizationId: actor.organizationId,
      assignmentId: requiredText(assignmentId, "assignment_id"),
    });
    if (!assignment || assignment.organizationId !== actor.organizationId) {
      throw new EntranceAssessmentError("not_found", "assignment_not_found");
    }
    if (!actor.canManageAllLeads && assignment.assignedByUserId !== actor.userId) {
      throw new EntranceAssessmentError("forbidden", "assignment_not_owned");
    }
    if (assignment.status === "completed" && assignment.resultId === result.id) return assignment;
    if (assignment.status !== "assigned" && assignment.status !== "started") {
      throw new EntranceAssessmentError("invalid_assignment_status");
    }
    if (
      result.organizationId !== actor.organizationId ||
      result.assessmentId !== assignment.assessmentId ||
      result.publicationStatus !== "published"
    ) {
      throw new EntranceAssessmentError("result_unavailable");
    }
    const completedAt = this.now();
    const completed = await this.repository.completeAssignmentAndUpdateLead({
      organizationId: actor.organizationId,
      assignmentId: assignment.id,
      resultId: result.id,
      leadId: assignment.leadId,
      nextLeadStatus: result.recommendedClassId || result.recommendedProgramId ? "class_proposed" : "consulting",
      completedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "entrance-assessment.result-linked",
      entityId: completed.id,
      after: {
        leadId: completed.leadId,
        resultId: result.id,
        recommendedProgramId: result.recommendedProgramId ?? null,
        recommendedClassId: result.recommendedClassId ?? null,
      },
    });
    return completed;
  }
}
