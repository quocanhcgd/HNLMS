import type {
  AssessmentLeadReference,
  AssessmentReference,
  EntranceAssessmentAssignment,
  EntranceAssessmentRepository,
} from "./entrance-assessment.service";

export class InMemoryEntranceAssessmentRepository implements EntranceAssessmentRepository {
  readonly leads: AssessmentLeadReference[] = [];
  readonly assessments: AssessmentReference[] = [];
  readonly assignments: EntranceAssessmentAssignment[] = [];

  async findLead(input: { organizationId: string; leadId: string }) {
    const lead = this.leads.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.leadId,
    );
    return lead ? structuredClone(lead) : null;
  }

  async findAssessment(input: { organizationId: string; assessmentId: string }) {
    const assessment = this.assessments.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.assessmentId,
    );
    return assessment ? structuredClone(assessment) : null;
  }

  async findAssignmentByKey(input: { organizationId: string; clientAssignmentKey: string }) {
    const assignment = this.assignments.find(
      (candidate) =>
        candidate.organizationId === input.organizationId &&
        candidate.clientAssignmentKey === input.clientAssignmentKey,
    );
    return assignment ? structuredClone(assignment) : null;
  }

  async findAssignment(input: { organizationId: string; assignmentId: string }) {
    const assignment = this.assignments.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.assignmentId,
    );
    return assignment ? structuredClone(assignment) : null;
  }

  async createAssignmentAndMarkLeadAwaiting(input: { assignment: EntranceAssessmentAssignment; leadId: string }) {
    const leadIndex = this.leads.findIndex(
      (lead) => lead.organizationId === input.assignment.organizationId && lead.id === input.leadId,
    );
    if (leadIndex < 0) throw new Error("lead_not_found");
    this.leads[leadIndex] = { ...this.leads[leadIndex]!, status: "awaiting_assessment" };
    this.assignments.push(structuredClone(input.assignment));
    return structuredClone(input.assignment);
  }

  async completeAssignmentAndUpdateLead(input: {
    organizationId: string;
    assignmentId: string;
    resultId: string;
    leadId: string;
    nextLeadStatus: "consulting" | "class_proposed";
    completedAt: Date;
  }) {
    const assignmentIndex = this.assignments.findIndex(
      (assignment) => assignment.organizationId === input.organizationId && assignment.id === input.assignmentId,
    );
    const leadIndex = this.leads.findIndex(
      (lead) => lead.organizationId === input.organizationId && lead.id === input.leadId,
    );
    if (assignmentIndex < 0 || leadIndex < 0) throw new Error("assessment_link_not_found");
    const assignment: EntranceAssessmentAssignment = {
      ...this.assignments[assignmentIndex]!,
      status: "completed",
      resultId: input.resultId,
      completedAt: input.completedAt,
      updatedAt: input.completedAt,
    };
    this.assignments[assignmentIndex] = assignment;
    this.leads[leadIndex] = { ...this.leads[leadIndex]!, status: input.nextLeadStatus };
    return structuredClone(assignment);
  }
}
