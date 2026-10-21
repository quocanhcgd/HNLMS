import { and, asc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { competencyProfileReviewHistory, competencyProfiles, type CompetencyProfileReviewHistory } from "./schema";
import type {
  CompetencyProfileHistoryEntry,
  CompetencyProfileRecord,
  CompetencyProfileRepository,
} from "./competency-profile.service";

type JsonObject = Record<string, unknown>;

function snapshotRecord(row: typeof competencyProfiles.$inferSelect): CompetencyProfileRecord {
  const snapshot = row.snapshot as JsonObject;
  return {
    ...(snapshot as Omit<
      CompetencyProfileRecord,
      | "profileId"
      | "organizationId"
      | "studentId"
      | "subjectId"
      | "programId"
      | "classId"
      | "branchId"
      | "reviewStatus"
      | "publicationStatus"
      | "version"
    >),
    profileId: row.profileId,
    organizationId: row.organizationId,
    studentId: row.studentId,
    subjectId: row.subjectId,
    programId: row.programId,
    classId: row.classId,
    branchId: row.branchId,
    reviewStatus: row.reviewStatus,
    publicationStatus: row.publicationStatus,
    version: row.version,
    ...(row.privateReviewerNote ? { privateReviewerNote: row.privateReviewerNote } : {}),
    ...(row.internalWorklogId ? { internalWorklogId: row.internalWorklogId } : {}),
  } as CompetencyProfileRecord;
}

function historyEntry(row: CompetencyProfileReviewHistory): CompetencyProfileHistoryEntry {
  return {
    historyId: row.id,
    organizationId: row.organizationId,
    profileId: row.profileId,
    studentId: row.studentId,
    action: row.action,
    actorUserId: row.actorUserId,
    occurredAt: row.occurredAt.toISOString(),
    version: row.version,
    ...(row.reason ? { reason: row.reason } : {}),
    before: row.beforeSnapshot as CompetencyProfileRecord,
    after: row.afterSnapshot as CompetencyProfileRecord,
  };
}

/** Drizzle implementation for the versioned competency projection and audit trail. */
export class DrizzleCompetencyProfileRepository implements CompetencyProfileRepository {
  constructor(private readonly db: NodePgDatabase<Record<string, never>>) {}

  async list(input: { organizationId: string; studentId?: string }): Promise<CompetencyProfileRecord[]> {
    const conditions = [eq(competencyProfiles.organizationId, input.organizationId)];
    if (input.studentId) conditions.push(eq(competencyProfiles.studentId, input.studentId));
    const rows = await this.db
      .select()
      .from(competencyProfiles)
      .where(and(...conditions))
      .orderBy(asc(competencyProfiles.studentId), asc(competencyProfiles.subjectId), asc(competencyProfiles.profileId));
    return rows.map(snapshotRecord);
  }

  async replaceCurrent(input: {
    organizationId: string;
    records: CompetencyProfileRecord[];
  }): Promise<CompetencyProfileRecord[]> {
    for (const record of input.records) {
      await this.db
        .update(competencyProfiles)
        .set({
          reviewStatus: record.reviewStatus,
          publicationStatus: record.publicationStatus,
          version: record.version,
          snapshot: record,
          privateReviewerNote: record.privateReviewerNote ?? null,
          internalWorklogId: record.internalWorklogId ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(competencyProfiles.organizationId, input.organizationId),
            eq(competencyProfiles.profileId, record.profileId),
          ),
        );
    }
    return input.records.map((record) => structuredClone(record));
  }

  async appendHistory(input: { entries: CompetencyProfileHistoryEntry[] }): Promise<CompetencyProfileHistoryEntry[]> {
    if (!input.entries.length) return [];
    await this.db.insert(competencyProfileReviewHistory).values(
      input.entries.map((entry) => ({
        id: entry.historyId,
        organizationId: entry.organizationId,
        profileId: entry.profileId,
        studentId: entry.studentId,
        action: entry.action,
        actorUserId: entry.actorUserId,
        version: entry.version,
        reason: entry.reason,
        beforeSnapshot: entry.before,
        afterSnapshot: entry.after,
        occurredAt: new Date(entry.occurredAt),
      })),
    );
    return input.entries.map((entry) => structuredClone(entry));
  }

  async listHistory(input: { organizationId: string; profileId: string }): Promise<CompetencyProfileHistoryEntry[]> {
    const rows = await this.db
      .select()
      .from(competencyProfileReviewHistory)
      .where(
        and(
          eq(competencyProfileReviewHistory.organizationId, input.organizationId),
          eq(competencyProfileReviewHistory.profileId, input.profileId),
        ),
      )
      .orderBy(asc(competencyProfileReviewHistory.occurredAt), asc(competencyProfileReviewHistory.id));
    return rows.map(historyEntry);
  }

  async commitReview(input: {
    organizationId: string;
    records: CompetencyProfileRecord[];
    entries: CompetencyProfileHistoryEntry[];
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const record of input.records) {
        await tx
          .update(competencyProfiles)
          .set({
            reviewStatus: record.reviewStatus,
            publicationStatus: record.publicationStatus,
            version: record.version,
            snapshot: record,
            privateReviewerNote: record.privateReviewerNote ?? null,
            internalWorklogId: record.internalWorklogId ?? null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(competencyProfiles.organizationId, input.organizationId),
              eq(competencyProfiles.profileId, record.profileId),
            ),
          );
      }
      if (input.entries.length) {
        await tx.insert(competencyProfileReviewHistory).values(
          input.entries.map((entry) => ({
            id: entry.historyId,
            organizationId: entry.organizationId,
            profileId: entry.profileId,
            studentId: entry.studentId,
            action: entry.action,
            actorUserId: entry.actorUserId,
            version: entry.version,
            reason: entry.reason,
            beforeSnapshot: entry.before,
            afterSnapshot: entry.after,
            occurredAt: new Date(entry.occurredAt),
          })),
        );
      }
    });
  }
}
