import { describe, expect, it } from "vitest";
import { parseCompetencyEvidence } from "@hnlms/domain-contracts";
import { InMemoryLegacyEnglishMigrationRepository } from "./in-memory-legacy-english-migration-repository";
import { LegacyEnglishMigrationService, type LegacyEnglishProfileContext } from "./legacy-english-migration.service";
import type { EnglishSkillRecordReference } from "./english-pathway.service";

const context: LegacyEnglishProfileContext = {
  studentName: "Nguyễn Minh Anh",
  subjectId: "english",
  subjectName: "Tiếng Anh",
  programId: "teen-b1",
  programName: "Teen B1",
  classId: "en-2609",
  className: "EN-2609",
  branchId: "branch-hn",
  blueprintVersion: 1,
  target: { label: "B1", normalizedScore: 70 },
};

function legacy(overrides: Partial<EnglishSkillRecordReference> = {}): EnglishSkillRecordReference {
  return {
    id: "legacy-1",
    organizationId: "org-1",
    studentId: "student-1",
    skill: "listening",
    levelCode: "A2",
    score: 62,
    confidence: 80,
    source: "placement",
    sourceRef: "placement-1",
    notes: { rawScore: 31, maxScore: 50 },
    capturedAt: new Date("2026-08-20T08:00:00.000Z"),
    reviewedByUserId: "teacher-1",
    reviewedAt: new Date("2026-08-21T08:00:00.000Z"),
    ...overrides,
  };
}

describe("T093 legacy English migration", () => {
  it("maps a reviewed legacy placement record and preserves lineage", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy()]);
    const auditEvents: string[] = [];
    const service = new LegacyEnglishMigrationService(
      repository,
      async (event) => {
        auditEvents.push(event.action);
      },
      () => "generated-id",
      () => new Date("2026-08-25T09:00:00.000Z"),
    );

    const report = await service.migrate(
      { userId: "system-1", organizationId: "org-1" },
      { contextByStudentId: new Map([["student-1", context]]) },
    );

    expect(report).toMatchObject({ scanned: 1, migrated: 1, skipped: 0, failed: [] });
    expect(repository.evidence).toHaveLength(1);
    expect(parseCompetencyEvidence(repository.evidence[0])).toMatchObject({
      subjectId: "english",
      competencyCode: "listening",
      sourceType: "entrance",
      sourceId: "legacy-1",
      rawScore: 31,
      normalizedScore: 62,
      legacyRecordId: "legacy-1",
      assessedAt: "2026-08-20T08:00:00.000Z",
      reviewedAt: "2026-08-21T08:00:00.000Z",
    });
    expect(repository.profiles[0]).toMatchObject({
      classId: "en-2609",
      baseline: { label: "A2", normalizedScore: 62 },
      current: { label: "A2", normalizedScore: 62 },
      target: { label: "B1", normalizedScore: 70 },
      publicationStatus: "published",
      reviewStatus: "confirmed",
    });
    expect(auditEvents).toEqual(["english.legacy-migration.record-migrated", "english.legacy-migration.completed"]);
  });

  it("is idempotent by organization and legacy record id", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy()]);
    const service = new LegacyEnglishMigrationService(
      repository,
      undefined,
      (() => {
        let index = 0;
        return () => `generated-${++index}`;
      })(),
    );
    const input = { contextByStudentId: new Map([["student-1", context]]) };

    const first = await service.migrate({ userId: "system-1", organizationId: "org-1" }, input);
    const second = await service.migrate({ userId: "system-1", organizationId: "org-1" }, input);

    expect(first.migrated).toBe(1);
    expect(second).toMatchObject({ scanned: 1, migrated: 0, skipped: 1, failed: [] });
    expect(repository.evidence).toHaveLength(1);
    expect(repository.profiles).toHaveLength(1);
    expect(repository.migrations).toHaveLength(1);
  });

  it("does not migrate records without a class/program context", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy({ id: "legacy-missing-context" })]);
    const service = new LegacyEnglishMigrationService(repository);
    const report = await service.migrate({ userId: "system-1", organizationId: "org-1" });

    expect(report).toMatchObject({
      scanned: 1,
      migrated: 0,
      skipped: 0,
      failed: [{ legacyRecordId: "legacy-missing-context", reason: "migration_context_required" }],
    });
    expect(repository.evidence).toHaveLength(0);
  });

  it("rejects a disabled migration actor before reading records", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy()]);
    const service = new LegacyEnglishMigrationService(repository);
    await expect(
      service.migrate({ userId: "user-1", organizationId: "org-1", canMigrateLegacyEnglish: false }),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("resolves class and program context from the persistence repository when no map is supplied", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy({ id: "legacy-repository-context" })]);
    repository.resolveContext = async () => context;
    const service = new LegacyEnglishMigrationService(repository);
    const report = await service.migrate({ userId: "system-1", organizationId: "org-1" });

    expect(report).toMatchObject({ migrated: 1, failed: [] });
    expect(repository.profiles[0]).toMatchObject({ classId: context.classId, programId: context.programId });
  });

  it("does not leak records from another tenant", async () => {
    const repository = new InMemoryLegacyEnglishMigrationRepository([legacy({ organizationId: "org-other" })]);
    const service = new LegacyEnglishMigrationService(repository);
    const report = await service.migrate({ userId: "system-1", organizationId: "org-1" });

    expect(report).toMatchObject({ scanned: 0, migrated: 0, failed: [] });
  });
});
