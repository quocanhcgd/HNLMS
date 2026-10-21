import { randomUUID } from "node:crypto";
import type { CompetencyEvidence } from "@hnlms/domain-contracts";
import type { CompetencyProfileRecord } from "./competency-profile.service";
import type { EnglishSkill, EnglishSkillRecordReference } from "./english-pathway.service";

export type LegacyEnglishProfileContext = {
  studentName: string;
  subjectId: string;
  subjectName: string;
  programId: string;
  programName: string;
  classId: string;
  className: string;
  branchId: string;
  blueprintVersion: number;
  competencyNames?: Partial<Record<EnglishSkill, string>>;
  target?: { label: string; normalizedScore?: number };
};

export type LegacyEnglishMigrationMapping = {
  id: string;
  organizationId: string;
  legacyRecordId: string;
  evidenceId: string;
  profileId: string;
  competencyCode: EnglishSkill;
  sourceType: CompetencyEvidence["sourceType"];
  migratedByUserId: string;
  migratedAt: string;
};

export type LegacyEnglishMigrationRepository = {
  listLegacySkillRecords(input: { organizationId: string }): Promise<EnglishSkillRecordReference[]>;
  resolveContext?(record: EnglishSkillRecordReference): Promise<LegacyEnglishProfileContext | null>;
  findMigration(input: {
    organizationId: string;
    legacyRecordId: string;
  }): Promise<LegacyEnglishMigrationMapping | null>;
  findEvidenceBySource?(input: {
    organizationId: string;
    sourceType: CompetencyEvidence["sourceType"];
    sourceId: string;
  }): Promise<CompetencyEvidence | null>;
  listProfileVersions(input: {
    organizationId: string;
    studentId: string;
    subjectId: string;
    programId: string;
    classId: string;
    competencyCode: string;
  }): Promise<CompetencyProfileRecord[]>;
  insertEvidence(input: CompetencyEvidence): Promise<CompetencyEvidence>;
  appendProfileVersion(input: CompetencyProfileRecord): Promise<CompetencyProfileRecord>;
  saveMigration(input: LegacyEnglishMigrationMapping): Promise<LegacyEnglishMigrationMapping>;
};

export type LegacyEnglishMigrationActor = {
  userId: string;
  organizationId: string;
  canMigrateLegacyEnglish?: boolean;
};

export type LegacyEnglishMigrationInput = {
  contextByStudentId?: ReadonlyMap<string, LegacyEnglishProfileContext>;
  resolveContext?: (
    record: EnglishSkillRecordReference,
  ) => Promise<LegacyEnglishProfileContext | null> | LegacyEnglishProfileContext | null;
};

export type LegacyEnglishMigrationReport = {
  organizationId: string;
  scanned: number;
  migrated: number;
  skipped: number;
  failed: Array<{ legacyRecordId: string; reason: string }>;
  mappings: LegacyEnglishMigrationMapping[];
};

export type LegacyEnglishMigrationAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "english.legacy-migration.record-migrated" | "english.legacy-migration.completed";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export class LegacyEnglishMigrationError extends Error {
  constructor(
    public readonly code: "forbidden" | "invalid_input" | "migration_context_required" | "permission_required",
    message: string = code,
  ) {
    super(message);
    this.name = "LegacyEnglishMigrationError";
  }
}

const competencyLabels: Record<EnglishSkill, string> = {
  listening: "Nghe",
  speaking: "Nói",
  reading: "Đọc",
  writing: "Viết",
};

function sourceTypeFor(record: EnglishSkillRecordReference): CompetencyEvidence["sourceType"] {
  if (record.source === "placement") return "entrance";
  if (record.source === "review") return "teacher_review";
  if (record.source === "migration") return "migration";
  const sourceRef = (record.sourceRef ?? "").toLowerCase();
  return /mock|trial|thi.?thu/.test(sourceRef) ? "mock" : "practice";
}

function sourceLabelFor(sourceType: CompetencyEvidence["sourceType"]): string {
  return {
    entrance: "Thi đầu vào",
    mock: "Thi thử",
    practice: "Bài kiểm tra",
    classwork: "Trên lớp",
    teacher_review: "Giáo viên rà soát",
    migration: "Dữ liệu English cũ",
  }[sourceType];
}

function numberFromNotes(notes: Record<string, unknown> | null, key: string): number | undefined {
  const value = notes?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function confidencePercent(value: number | null): number {
  if (value === null || !Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export class LegacyEnglishMigrationService {
  constructor(
    private readonly repository: LegacyEnglishMigrationRepository,
    private readonly audit: LegacyEnglishMigrationAudit = async () => undefined,
    private readonly newId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async migrate(
    actor: LegacyEnglishMigrationActor,
    input: LegacyEnglishMigrationInput = {},
  ): Promise<LegacyEnglishMigrationReport> {
    if (actor.canMigrateLegacyEnglish === false) {
      throw new LegacyEnglishMigrationError("forbidden", "legacy_english_migration_permission_required");
    }
    const records = await this.repository.listLegacySkillRecords({ organizationId: actor.organizationId });
    const report: LegacyEnglishMigrationReport = {
      organizationId: actor.organizationId,
      scanned: records.length,
      migrated: 0,
      skipped: 0,
      failed: [],
      mappings: [],
    };

    for (const record of records) {
      if (record.organizationId !== actor.organizationId) {
        report.failed.push({ legacyRecordId: record.id, reason: "organization_scope_denied" });
        continue;
      }
      const existing = await this.repository.findMigration({
        organizationId: actor.organizationId,
        legacyRecordId: record.id,
      });
      if (existing) {
        report.skipped += 1;
        report.mappings.push(structuredClone(existing));
        continue;
      }
      const context = await this.resolveContext(record, input);
      if (!context) {
        report.failed.push({ legacyRecordId: record.id, reason: "migration_context_required" });
        continue;
      }
      if (!Number.isInteger(context.blueprintVersion) || context.blueprintVersion <= 0) {
        report.failed.push({ legacyRecordId: record.id, reason: "blueprint_version_required" });
        continue;
      }

      const sourceType = sourceTypeFor(record);
      const evidenceId = this.newId();
      const profileId = this.newId();
      const notes = record.notes ?? {};
      const rawScore = numberFromNotes(notes, "rawScore") ?? record.score ?? undefined;
      const maxScore = numberFromNotes(notes, "maxScore");
      const normalizedScore =
        record.score ?? (rawScore !== undefined && maxScore ? Math.round((rawScore / maxScore) * 100) : undefined);
      const reviewed = Boolean(record.reviewedAt || record.reviewedByUserId);
      const assessedAt = record.capturedAt.toISOString();
      const evidence: CompetencyEvidence = {
        id: evidenceId,
        organizationId: actor.organizationId,
        studentId: record.studentId,
        subjectId: context.subjectId,
        programId: context.programId,
        blueprintVersion: context.blueprintVersion,
        competencyCode: record.skill,
        sourceType,
        sourceId: record.id,
        classId: context.classId,
        ...(rawScore === undefined ? {} : { rawScore }),
        ...(normalizedScore === undefined ? {} : { normalizedScore }),
        normalizedLevel: record.levelCode,
        confidence: confidencePercent(record.confidence) / 100,
        status: reviewed ? "confirmed" : "pending_review",
        ...(record.reviewedByUserId ? { reviewerId: record.reviewedByUserId } : {}),
        assessedAt,
        ...(record.reviewedAt ? { reviewedAt: record.reviewedAt.toISOString() } : {}),
        legacyRecordId: record.id,
        notes: structuredClone(notes),
      };

      const insertedEvidence = this.repository.findEvidenceBySource
        ? await this.repository.findEvidenceBySource({
            organizationId: actor.organizationId,
            sourceType,
            sourceId: record.id,
          })
        : null;
      const savedEvidence = insertedEvidence ?? (await this.repository.insertEvidence(evidence));
      const versions = await this.repository.listProfileVersions({
        organizationId: actor.organizationId,
        studentId: record.studentId,
        subjectId: context.subjectId,
        programId: context.programId,
        classId: context.classId,
        competencyCode: record.skill,
      });
      // Preserve the baseline from the latest existing version when an import is resumed.
      const previous = [...versions].sort((a, b) => b.version - a.version)[0];
      const baseline = previous?.baseline ?? {
        label: record.levelCode,
        ...(normalizedScore === undefined ? {} : { normalizedScore }),
      };
      const teacherFeedback = typeof notes.note === "string" && notes.note.trim() ? notes.note : undefined;
      const profile: CompetencyProfileRecord = {
        profileId,
        organizationId: actor.organizationId,
        studentId: record.studentId,
        studentName: context.studentName,
        subjectId: context.subjectId,
        subjectName: context.subjectName,
        programId: context.programId,
        programName: context.programName,
        classId: context.classId,
        className: context.className,
        branchId: context.branchId,
        competencyCode: record.skill,
        competencyName: context.competencyNames?.[record.skill] ?? competencyLabels[record.skill],
        baseline,
        current: { label: record.levelCode, ...(normalizedScore === undefined ? {} : { normalizedScore }) },
        target: context.target ?? { label: record.levelCode },
        evidence: {
          sourceType,
          sourceId: record.id,
          sourceLabel: sourceLabelFor(sourceType),
          assessedAt,
          summary: teacherFeedback ?? `Đồng bộ minh chứng ${record.skill} từ hồ sơ English cũ.`,
        },
        confidence: confidencePercent(record.confidence),
        publicationStatus: reviewed ? "published" : "draft",
        reviewStatus: reviewed ? "confirmed" : "pending_review",
        ...(teacherFeedback ? { teacherFeedback } : {}),
        version: Math.max(0, ...versions.map((version) => version.version)) + 1,
      };
      const savedProfile = await this.repository.appendProfileVersion(profile);
      const mapping: LegacyEnglishMigrationMapping = {
        id: this.newId(),
        organizationId: actor.organizationId,
        legacyRecordId: record.id,
        evidenceId: savedEvidence.id,
        profileId: savedProfile.profileId,
        competencyCode: record.skill,
        sourceType,
        migratedByUserId: actor.userId,
        migratedAt: this.now().toISOString(),
      };
      const savedMapping = await this.repository.saveMigration(mapping);
      report.migrated += 1;
      report.mappings.push(structuredClone(savedMapping));
      await this.audit({
        organizationId: actor.organizationId,
        actorUserId: actor.userId,
        action: "english.legacy-migration.record-migrated",
        entityId: record.id,
        after: {
          evidenceId: savedEvidence.id,
          profileId: savedProfile.profileId,
          sourceType,
          competencyCode: record.skill,
        },
      });
    }

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "english.legacy-migration.completed",
      entityId: actor.organizationId,
      after: {
        scanned: report.scanned,
        migrated: report.migrated,
        skipped: report.skipped,
        failed: report.failed.length,
      },
    });
    return report;
  }

  private async resolveContext(
    record: EnglishSkillRecordReference,
    input: LegacyEnglishMigrationInput,
  ): Promise<LegacyEnglishProfileContext | null> {
    if (input.resolveContext) return input.resolveContext(record);
    const supplied = input.contextByStudentId?.get(record.studentId);
    if (supplied) return supplied;
    return this.repository.resolveContext ? this.repository.resolveContext(record) : null;
  }
}
