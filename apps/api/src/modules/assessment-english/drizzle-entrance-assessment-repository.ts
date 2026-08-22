import { eq, and, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  assessmentAssignments,
  assessments,
  type AssessmentAssignment,
} from "./schema";
import type {
  AssessmentLeadReference,
  AssessmentReference,
  EntranceAssessmentAssignment,
  EntranceAssessmentRepository,
} from "./entrance-assessment.service";

/**
 * Drizzle-based repository for entrance assessment assignments.
 * Maps between the service domain types and the Drizzle ORM tables.
 */
export class DrizzleEntranceAssessmentRepository implements EntranceAssessmentRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async findLead(input: { organizationId: string; leadId: string }): Promise<AssessmentLeadReference | null> {
    // Leads are resolved via the marketing-admission module.
    // For the assessment module we only need a minimal reference.
    // The caller should pre-populate this via the shared Drizzle instance.
    // Here we delegate to a lightweight query joining leads table.
    const rows = await this.db.execute(sql`
      SELECT l.id, l.organization_id, l.status,
             COALESCE(
               (SELECT la.consultant_user_id
                FROM lead_assignments la
                WHERE la.lead_id = l.id
                  AND la.organization_id = l.organization_id
                  AND la.status = 'active'
                ORDER BY la.assigned_at DESC
                LIMIT 1),
               NULL
             ) AS active_consultant_user_id
      FROM leads l
      WHERE l.id = ${input.leadId}
        AND l.organization_id = ${input.organizationId}
      LIMIT 1
    `);

    const row = rows.rows[0] as
      | { id: string; organization_id: string; status: string; active_consultant_user_id: string | null }
      | undefined;

    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organization_id,
      status: row.status as AssessmentLeadReference["status"],
      activeConsultantUserId: row.active_consultant_user_id,
    };
  }

  async findAssessment(input: { organizationId: string; assessmentId: string }): Promise<AssessmentReference | null> {
    const rows = await this.db
      .select({
        id: assessments.id,
        organizationId: assessments.organizationId,
        kind: assessments.kind,
        status: assessments.status,
        title: assessments.title,
        opensAt: assessments.opensAt,
        closesAt: assessments.closesAt,
      })
      .from(assessments)
      .where(and(eq(assessments.organizationId, input.organizationId), eq(assessments.id, input.assessmentId)))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      organizationId: row.organizationId,
      kind: row.kind as AssessmentReference["kind"],
      status: row.status as AssessmentReference["status"],
      title: row.title,
      opensAt: row.opensAt,
      closesAt: row.closesAt,
    };
  }

  async findAssignmentByKey(input: {
    organizationId: string;
    clientAssignmentKey: string;
  }): Promise<EntranceAssessmentAssignment | null> {
    const rows = await this.db
      .select()
      .from(assessmentAssignments)
      .where(
        and(
          eq(assessmentAssignments.organizationId, input.organizationId),
          eq(assessmentAssignments.clientAssignmentKey, input.clientAssignmentKey),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return this.mapAssignment(row);
  }

  async findAssignment(input: {
    organizationId: string;
    assignmentId: string;
  }): Promise<EntranceAssessmentAssignment | null> {
    const rows = await this.db
      .select()
      .from(assessmentAssignments)
      .where(
        and(
          eq(assessmentAssignments.organizationId, input.organizationId),
          eq(assessmentAssignments.id, input.assignmentId),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return this.mapAssignment(row);
  }

  async createAssignmentAndMarkLeadAwaiting(input: {
    assignment: EntranceAssessmentAssignment;
    leadId: string;
  }): Promise<EntranceAssessmentAssignment> {
    const a = input.assignment;
    await this.db.execute(sql`
      UPDATE leads
      SET status = 'awaiting_assessment', updated_at = NOW()
      WHERE id = ${input.leadId}
        AND organization_id = ${a.organizationId}
    `);

    const rows = await this.db
      .insert(assessmentAssignments)
      .values({
        id: a.id,
        organizationId: a.organizationId,
        leadId: a.leadId,
        assessmentId: a.assessmentId,
        assignedByUserId: a.assignedByUserId,
        clientAssignmentKey: a.clientAssignmentKey,
        requestFingerprint: a.requestFingerprint,
        status: a.status,
        invitationChannel: a.invitationChannel,
        expiresAt: a.expiresAt,
        resultId: a.resultId,
        assignedAt: a.assignedAt,
        completedAt: a.completedAt,
      })
      .returning();

    return this.mapAssignment(rows[0]!);
  }

  async completeAssignmentAndUpdateLead(input: {
    organizationId: string;
    assignmentId: string;
    resultId: string;
    leadId: string;
    nextLeadStatus: "consulting" | "class_proposed";
    completedAt: Date;
  }): Promise<EntranceAssessmentAssignment> {
    await this.db.execute(sql`
      UPDATE leads
      SET status = ${input.nextLeadStatus}, updated_at = ${input.completedAt}
      WHERE id = ${input.leadId}
        AND organization_id = ${input.organizationId}
    `);

    const rows = await this.db
      .update(assessmentAssignments)
      .set({
        status: "completed",
        resultId: input.resultId,
        completedAt: input.completedAt,
        updatedAt: input.completedAt,
      })
      .where(
        and(
          eq(assessmentAssignments.organizationId, input.organizationId),
          eq(assessmentAssignments.id, input.assignmentId),
        ),
      )
      .returning();

    return this.mapAssignment(rows[0]!);
  }

  private mapAssignment(row: AssessmentAssignment): EntranceAssessmentAssignment {
    return {
      id: row.id,
      organizationId: row.organizationId,
      leadId: row.leadId,
      assessmentId: row.assessmentId,
      assignedByUserId: row.assignedByUserId,
      clientAssignmentKey: row.clientAssignmentKey,
      requestFingerprint: row.requestFingerprint,
      status: row.status as EntranceAssessmentAssignment["status"],
      invitationChannel: row.invitationChannel as EntranceAssessmentAssignment["invitationChannel"],
      expiresAt: row.expiresAt,
      resultId: row.resultId,
      assignedAt: row.assignedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
