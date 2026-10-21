import type { CompetencyEvidence } from "@hnlms/domain-contracts";
import type { CompetencyProfileRecord } from "./competency-profile.service";
import type { EnglishSkillRecordReference } from "./english-pathway.service";
import type {
  LegacyEnglishMigrationMapping,
  LegacyEnglishMigrationRepository,
  LegacyEnglishProfileContext,
} from "./legacy-english-migration.service";

export class InMemoryLegacyEnglishMigrationRepository implements LegacyEnglishMigrationRepository {
  readonly evidence: CompetencyEvidence[] = [];
  readonly profiles: CompetencyProfileRecord[] = [];
  readonly migrations: LegacyEnglishMigrationMapping[] = [];

  constructor(readonly legacyRecords: EnglishSkillRecordReference[] = []) {}

  async listLegacySkillRecords(input: { organizationId: string }) {
    return structuredClone(this.legacyRecords.filter((record) => record.organizationId === input.organizationId));
  }

  async resolveContext(): Promise<LegacyEnglishProfileContext | null> {
    return null;
  }

  async findMigration(input: { organizationId: string; legacyRecordId: string }) {
    const found = this.migrations.find(
      (item) => item.organizationId === input.organizationId && item.legacyRecordId === input.legacyRecordId,
    );
    return found ? structuredClone(found) : null;
  }

  async findEvidenceBySource(input: {
    organizationId: string;
    sourceType: CompetencyEvidence["sourceType"];
    sourceId: string;
  }) {
    const found = this.evidence.find(
      (item) =>
        item.organizationId === input.organizationId &&
        item.sourceType === input.sourceType &&
        item.sourceId === input.sourceId,
    );
    return found ? structuredClone(found) : null;
  }

  async listProfileVersions(input: {
    organizationId: string;
    studentId: string;
    subjectId: string;
    programId: string;
    classId: string;
    competencyCode: string;
  }) {
    return structuredClone(
      this.profiles.filter(
        (profile) =>
          profile.organizationId === input.organizationId &&
          profile.studentId === input.studentId &&
          profile.subjectId === input.subjectId &&
          profile.programId === input.programId &&
          profile.classId === input.classId &&
          profile.competencyCode === input.competencyCode,
      ),
    );
  }

  async insertEvidence(input: CompetencyEvidence) {
    if (
      this.evidence.some(
        (item) =>
          item.organizationId === input.organizationId &&
          item.sourceType === input.sourceType &&
          item.sourceId === input.sourceId,
      )
    ) {
      throw new Error("evidence_source_already_migrated");
    }
    const saved = structuredClone(input);
    this.evidence.push(saved);
    return structuredClone(saved);
  }

  async appendProfileVersion(input: CompetencyProfileRecord) {
    const saved = structuredClone(input);
    this.profiles.push(saved);
    return structuredClone(saved);
  }

  async saveMigration(input: LegacyEnglishMigrationMapping) {
    if (
      this.migrations.some(
        (item) => item.organizationId === input.organizationId && item.legacyRecordId === input.legacyRecordId,
      )
    ) {
      throw new Error("legacy_migration_already_recorded");
    }
    const saved = structuredClone(input);
    this.migrations.push(saved);
    return structuredClone(saved);
  }
}
