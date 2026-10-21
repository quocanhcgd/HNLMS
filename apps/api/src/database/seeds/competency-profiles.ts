import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { createDevelopmentSeed } from "@hnlms/test-fixtures";
import type { CompetencyProfileRecord } from "../../modules/assessment-english/competency-profile.service";
import { competencyProfiles } from "../../modules/assessment-english/schema";

export type CompetencyProfileSeedResult = {
  inserted: number;
  updated: number;
  skipped: Array<{ profileId: string; reason: string }>;
};

type SeedDatabase = NodePgDatabase<Record<string, never>>;

function developmentIdentityMap(seedKey: string) {
  const seed = createDevelopmentSeed(seedKey);
  const hn = seed.organizations.find((organization) => organization.code === "DEMO-HN") ?? seed.organizations[0]!;
  const branches = seed.branches.filter((branch) => branch.organizationId === hn.id);
  const students = seed.personas.filter((persona) => persona.organizationId === hn.id && persona.role === "student");
  return {
    organizationId: hn.id,
    branchId: branches[0]?.id ?? "",
    studentIds: students.map((student) => student.id),
  };
}

/**
 * Idempotently projects competency records into the current-state table.
 * Production imports should pass records from the legacy migration, while
 * the CLI uses the explicit development fixtures below.
 */
export async function upsertCompetencyProfiles(
  db: SeedDatabase,
  records: readonly CompetencyProfileRecord[],
): Promise<CompetencyProfileSeedResult> {
  const result: CompetencyProfileSeedResult = { inserted: 0, updated: 0, skipped: [] };
  for (const record of records) {
    try {
      const existing = await db
        .select({ profileId: competencyProfiles.profileId })
        .from(competencyProfiles)
        .where(
          and(
            eq(competencyProfiles.organizationId, record.organizationId),
            eq(competencyProfiles.profileId, record.profileId),
          ),
        )
        .limit(1);
      await db
        .insert(competencyProfiles)
        .values({
          profileId: record.profileId,
          organizationId: record.organizationId,
          studentId: record.studentId,
          subjectId: record.subjectId,
          programId: record.programId,
          classId: record.classId,
          branchId: record.branchId,
          reviewStatus: record.reviewStatus,
          publicationStatus: record.publicationStatus,
          version: record.version,
          snapshot: record,
          privateReviewerNote: record.privateReviewerNote ?? null,
          internalWorklogId: record.internalWorklogId ?? null,
        })
        .onConflictDoUpdate({
          target: competencyProfiles.profileId,
          set: {
            reviewStatus: record.reviewStatus,
            publicationStatus: record.publicationStatus,
            version: record.version,
            snapshot: record,
            privateReviewerNote: record.privateReviewerNote ?? null,
            internalWorklogId: record.internalWorklogId ?? null,
            updatedAt: new Date(),
          },
        });
      if (existing.length) result.updated += 1;
      else result.inserted += 1;
    } catch (error) {
      result.skipped.push({
        profileId: record.profileId,
        reason: error instanceof Error ? error.message : "seed_failed",
      });
    }
  }
  return result;
}

export function developmentCompetencyProfiles(
  records: readonly CompetencyProfileRecord[],
  seedKey = "hnlms-development-v1",
) {
  const identity = developmentIdentityMap(seedKey);
  return records.map((record, index) => ({
    ...record,
    organizationId: identity.organizationId,
    studentId: identity.studentIds[index % Math.max(identity.studentIds.length, 1)] ?? record.studentId,
    branchId: identity.branchId || record.branchId,
  }));
}
