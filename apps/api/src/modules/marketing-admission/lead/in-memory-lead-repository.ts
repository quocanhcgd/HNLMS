import type { Lead, LeadAssignment } from "../schema";
import type { LeadRepository } from "./lead.service";

export class InMemoryLeadRepository implements LeadRepository {
  readonly leads: Lead[] = [];
  readonly assignments: LeadAssignment[] = [];

  async create(input: Lead): Promise<Lead> {
    const lead = structuredClone(input);
    this.leads.push(lead);
    return structuredClone(lead);
  }

  async findById({ organizationId, leadId }: { organizationId: string; leadId: string }): Promise<Lead | null> {
    const lead = this.leads.find((candidate) => candidate.organizationId === organizationId && candidate.id === leadId);
    return lead ? structuredClone(lead) : null;
  }

  async findDuplicateCandidates(input: {
    organizationId: string;
    normalizedPhone: string;
    normalizedEmail?: string;
    excludeLeadId?: string;
  }): Promise<Lead[]> {
    return structuredClone(
      this.leads.filter(
        (lead) =>
          lead.organizationId === input.organizationId &&
          lead.id !== input.excludeLeadId &&
          (lead.normalizedPhone === input.normalizedPhone ||
            Boolean(input.normalizedEmail && lead.normalizedEmail === input.normalizedEmail)),
      ),
    );
  }

  async update({
    organizationId,
    leadId,
    changes,
  }: {
    organizationId: string;
    leadId: string;
    changes: Partial<Pick<Lead, "status" | "updatedAt">>;
  }): Promise<Lead> {
    const index = this.leads.findIndex((lead) => lead.organizationId === organizationId && lead.id === leadId);
    if (index < 0) throw new Error("lead_not_found");
    const updated = { ...this.leads[index]!, ...changes };
    this.leads[index] = structuredClone(updated);
    return structuredClone(updated);
  }

  async findActiveAssignment(input: { organizationId: string; leadId: string }): Promise<LeadAssignment | null> {
    const assignment = this.assignments.find(
      (candidate) =>
        candidate.organizationId === input.organizationId &&
        candidate.leadId === input.leadId &&
        candidate.status === "active",
    );
    return assignment ? structuredClone(assignment) : null;
  }

  async replaceActiveAssignment(input: {
    organizationId: string;
    leadId: string;
    next: LeadAssignment;
    previousStatus: "transferred" | "completed" | "cancelled";
    now: Date;
  }): Promise<{ previous: LeadAssignment | null; current: LeadAssignment }> {
    const index = this.assignments.findIndex(
      (assignment) =>
        assignment.organizationId === input.organizationId &&
        assignment.leadId === input.leadId &&
        assignment.status === "active",
    );
    let previous: LeadAssignment | null = null;
    if (index >= 0) {
      previous = {
        ...this.assignments[index]!,
        status: input.previousStatus,
        endedAt: input.now,
        updatedAt: input.now,
      };
      this.assignments[index] = structuredClone(previous);
    }
    const current = structuredClone(input.next);
    this.assignments.push(current);
    return { previous: previous ? structuredClone(previous) : null, current: structuredClone(current) };
  }
}
