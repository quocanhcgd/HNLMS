import { and, asc, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { branches } from "../organization-branch/schema";
import { academicClasses, courses, enrollments, programs, students } from "../academic-learning/schema";
import { competencyEvidence, competencyProfiles, englishSkillRecords, legacyEnglishMigrationMappings } from "./schema";
import type { CompetencyEvidence } from "@hnlms/domain-contracts";
import type { CompetencyProfileRecord } from "./competency-profile.service";
import type { EnglishSkillRecordReference } from "./english-pathway.service";
import type {
  LegacyEnglishMigrationMapping,
  LegacyEnglishMigrationRepository,
  LegacyEnglishProfileContext,
} from "./legacy-english-migration.service";

type Database = NodePgDatabase<Record<string, never>>;
type JsonObject = Record<string, unknown>;

const englishSkills = new Set(["listening", "speaking", "reading", "writing"]);

function objectOrNull(value: unknown): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : null;
}

function legacyRecord(row: typeof englishSkillRecords.$inferSelect): EnglishSkillRecordReference {
  return {
    id: row.id,
    organizationId: row.organizationId,
    studentId: row.studentId,
    skill: row.skill as EnglishSkillRecordReference["skill"],
    levelCode: row.levelCode as EnglishSkillRecordReference["levelCode"],
    score: row.score,
    confidence: row.confidence,
    source: row.source,
    sourceRef: row.sourceRef,
    notes: objectOrNull(row.notes),
    capturedAt: row.capturedAt,
    reviewedByUserId: row.reviewedByUserId,
    reviewedAt: row.reviewedAt,
  };
}

function evidenceRecord(row: typeof competencyEvidence.$inferSelect): CompetencyEvidence {
  return {
    id: row.id,
    organizationId: row.organizationId,
    studentId: row.studentId,
    subjectId: row.subjectId,
    programId: row.programId,
    blueprintVersion: row.blueprintVersion,
    competencyCode: row.competencyCode,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    ...(row.classId ? { classId: row.classId } : {}),
    ...(row.rawScore === null ? {} : { rawScore: row.rawScore }),
    ...(row.normalizedScore === null ? {} : { normalizedScore: row.normalizedScore }),
    ...(row.normalizedLevel ? { normalizedLevel: row.normalizedLevel } : {}),
    ...(row.confidence === null ? {} : { confidence: row.confidence }),
    status: row.status,
    ...(row.reviewerId ? { reviewerId: row.reviewerId } : {}),
    ...(row.assessedAt ? { assessedAt: row.assessedAt.toISOString() } : {}),
    ...(row.reviewedAt ? { reviewedAt: row.reviewedAt.toISOString() } : {}),
    ...(row.legacyRecordId ? { legacyRecordId: row.legacyRecordId } : {}),
    ...(row.notes ? { notes: objectOrNull(row.notes) ?? {} } : {}),
  };
}

/** PostgreSQL repository for importing legacy English records with class/program context. */
export class DrizzleLegacyEnglishMigrationRepository implements LegacyEnglishMigrationRepository {
  constructor(private readonly db: Database) {}

  async listLegacySkillRecords(input: { organizationId: string }): Promise<EnglishSkillRecordReference[]> {
    const rows = await this.db
      .select()
      .from(englishSkillRecords)
      .where(eq(englishSkillRecords.organizationId, input.organizationId))
      .orderBy(asc(englishSkillRecords.capturedAt), asc(englishSkillRecords.id));
    return rows.filter((row) => englishSkills.has(row.skill)).map(legacyRecord);
  }

  async resolveContext(record: EnglishSkillRecordReference): Promise<LegacyEnglishProfileContext | null> {
    const rows = await this.db
      .select({
        studentName: students.displayName,
        fullName: students.fullName,
        classId: academicClasses.id,
        className: academicClasses.name,
        branchId: branches.id,
        programId: programs.id,
        programName: programs.name,
      })
      .from(students)
      .innerJoin(
        enrollments,
        and(eq(enrollments.studentId, students.id), eq(enrollments.organizationId, record.organizationId)),
      )
      .innerJoin(
        academicClasses,
        and(eq(academicClasses.id, enrollments.classId), eq(academicClasses.organizationId, record.organizationId)),
      )
      .innerJoin(
        courses,
        and(eq(courses.id, academicClasses.courseId), eq(courses.organizationId, record.organizationId)),
      )
      .innerJoin(programs, and(eq(programs.id, courses.programId), eq(programs.organizationId, record.organizationId)))
      .leftJoin(
        branches,
        and(eq(branches.id, academicClasses.branchId), eq(branches.organizationId, record.organizationId)),
      )
      .where(and(eq(students.id, record.studentId), eq(students.organizationId, record.organizationId)))
      .orderBy(desc(enrollments.enrolledAt), desc(enrollments.updatedAt))
      .limit(1);
    const row = rows[0];
    if (!row?.branchId) return null;
    const notes = record.notes ?? {};
    const blueprintVersion = notes.blueprintVersion;
    if (typeof blueprintVersion !== "number" || !Number.isInteger(blueprintVersion) || blueprintVersion <= 0)
      return null;
    const subjectId = typeof notes.subjectId === "string" && notes.subjectId.trim() ? notes.subjectId : "english";
    const subjectName =
      typeof notes.subjectName === "string" && notes.subjectName.trim() ? notes.subjectName : "Tiếng Anh";
    return {
      studentName: row.studentName ?? row.fullName,
      subjectId,
      subjectName,
      programId: String(row.programId),
      programName: row.programName,
      classId: String(row.classId),
      className: row.className,
      branchId: String(row.branchId),
      blueprintVersion,
    };
  }

  async findMigration(input: {
    organizationId: string;
    legacyRecordId: string;
  }): Promise<LegacyEnglishMigrationMapping | null> {
    const rows = await this.db
      .select()
      .from(legacyEnglishMigrationMappings)
      .where(
        and(
          eq(legacyEnglishMigrationMappings.organizationId, input.organizationId),
          eq(legacyEnglishMigrationMappings.legacyRecordId, input.legacyRecordId),
        ),
      )
      .limit(1);
    const row = rows[0];
    return row
      ? {
          id: row.id,
          organizationId: row.organizationId,
          legacyRecordId: row.legacyRecordId,
          evidenceId: row.evidenceId,
          profileId: row.profileId,
          competencyCode: row.competencyCode as LegacyEnglishMigrationMapping["competencyCode"],
          sourceType: row.sourceType,
          migratedByUserId: row.migratedByUserId,
          migratedAt: row.migratedAt.toISOString(),
        }
      : null;
  }

  async findEvidenceBySource(input: {
    organizationId: string;
    sourceType: CompetencyEvidence["sourceType"];
    sourceId: string;
  }): Promise<CompetencyEvidence | null> {
    const rows = await this.db
      .select()
      .from(competencyEvidence)
      .where(
        and(
          eq(competencyEvidence.organizationId, input.organizationId),
          eq(competencyEvidence.sourceType, input.sourceType),
          eq(competencyEvidence.sourceId, input.sourceId),
        ),
      )
      .limit(1);
    return rows[0] ? evidenceRecord(rows[0]) : null;
  }

  async listProfileVersions(input: {
    organizationId: string;
    studentId: string;
    subjectId: string;
    programId: string;
    classId: string;
    competencyCode: string;
  }): Promise<CompetencyProfileRecord[]> {
    const rows = await this.db
      .select()
      .from(competencyProfiles)
      .where(
        and(
          eq(competencyProfiles.organizationId, input.organizationId),
          eq(competencyProfiles.studentId, input.studentId),
          eq(competencyProfiles.subjectId, input.subjectId),
          eq(competencyProfiles.programId, input.programId),
          eq(competencyProfiles.classId, input.classId),
        ),
      )
      .orderBy(asc(competencyProfiles.version), asc(competencyProfiles.updatedAt));
    return rows
      .map((row) => row.snapshot as CompetencyProfileRecord)
      .filter((profile) => profile.competencyCode === input.competencyCode);
  }

  async insertEvidence(input: CompetencyEvidence): Promise<CompetencyEvidence> {
    await this.db
      .insert(competencyEvidence)
      .values({
        id: input.id,
        organizationId: input.organizationId,
        studentId: input.studentId,
        subjectId: input.subjectId,
        programId: input.programId,
        blueprintVersion: input.blueprintVersion,
        competencyCode: input.competencyCode,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        classId: input.classId ?? null,
        rawScore: input.rawScore ?? null,
        normalizedScore: input.normalizedScore ?? null,
        normalizedLevel: input.normalizedLevel ?? null,
        confidence: input.confidence ?? null,
        status: input.status,
        reviewerId: input.reviewerId ?? null,
        assessedAt: input.assessedAt ? new Date(input.assessedAt) : null,
        reviewedAt: input.reviewedAt ? new Date(input.reviewedAt) : null,
        legacyRecordId: input.legacyRecordId ?? null,
        notes: input.notes ?? null,
      })
      .onConflictDoNothing({
        target: [competencyEvidence.organizationId, competencyEvidence.sourceType, competencyEvidence.sourceId],
      });
    return (
      (await this.findEvidenceBySource({
        organizationId: input.organizationId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      })) ?? input
    );
  }

  async appendProfileVersion(input: CompetencyProfileRecord): Promise<CompetencyProfileRecord> {
    await this.db.insert(competencyProfiles).values({
      profileId: input.profileId,
      organizationId: input.organizationId,
      studentId: input.studentId,
      subjectId: input.subjectId,
      programId: input.programId,
      classId: input.classId,
      branchId: input.branchId,
      reviewStatus: input.reviewStatus,
      publicationStatus: input.publicationStatus,
      version: input.version,
      snapshot: input,
      privateReviewerNote: input.privateReviewerNote ?? null,
      internalWorklogId: input.internalWorklogId ?? null,
    });
    return structuredClone(input);
  }

  async saveMigration(input: LegacyEnglishMigrationMapping): Promise<LegacyEnglishMigrationMapping> {
    await this.db
      .insert(legacyEnglishMigrationMappings)
      .values({
        id: input.id,
        organizationId: input.organizationId,
        legacyRecordId: input.legacyRecordId,
        evidenceId: input.evidenceId,
        profileId: input.profileId,
        competencyCode: input.competencyCode,
        sourceType: input.sourceType,
        migratedByUserId: input.migratedByUserId,
        migratedAt: new Date(input.migratedAt),
      })
      .onConflictDoNothing({
        target: [legacyEnglishMigrationMappings.organizationId, legacyEnglishMigrationMappings.legacyRecordId],
      });
    return (
      (await this.findMigration({ organizationId: input.organizationId, legacyRecordId: input.legacyRecordId })) ??
      input
    );
  }
}
