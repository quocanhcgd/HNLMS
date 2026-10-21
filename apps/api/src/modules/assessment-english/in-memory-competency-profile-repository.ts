import type {
  CompetencyProfileHistoryEntry,
  CompetencyProfileRecord,
  CompetencyProfileRepository,
} from "./competency-profile.service";

export class InMemoryCompetencyProfileRepository implements CompetencyProfileRepository {
  readonly history: CompetencyProfileHistoryEntry[] = [];

  constructor(readonly records: CompetencyProfileRecord[] = []) {}

  async list(input: { organizationId: string; studentId?: string }) {
    return structuredClone(
      this.records.filter(
        (record) =>
          record.organizationId === input.organizationId && (!input.studentId || record.studentId === input.studentId),
      ),
    );
  }

  async replaceCurrent(input: { organizationId: string; records: CompetencyProfileRecord[] }) {
    for (const next of input.records) {
      const index = this.records.findIndex(
        (record) => record.organizationId === input.organizationId && record.profileId === next.profileId,
      );
      if (index < 0) throw new Error("competency_profile_not_found");
      this.records[index] = structuredClone(next);
    }
    return structuredClone(input.records);
  }

  async appendHistory(input: { entries: CompetencyProfileHistoryEntry[] }) {
    const saved = structuredClone(input.entries);
    this.history.push(...saved);
    return structuredClone(saved);
  }

  async listHistory(input: { organizationId: string; profileId: string }) {
    return structuredClone(
      this.history.filter(
        (entry) => entry.organizationId === input.organizationId && entry.profileId === input.profileId,
      ),
    );
  }

  async commitReview(input: {
    organizationId: string;
    records: CompetencyProfileRecord[];
    entries: CompetencyProfileHistoryEntry[];
  }) {
    await this.replaceCurrent({ organizationId: input.organizationId, records: input.records });
    await this.appendHistory({ entries: input.entries });
  }
}
