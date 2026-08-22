
import type {
  EnglishPathwayRepository,
  EnglishPlacementRuleReference,
  EnglishSkillRecordReference,
} from "./english-pathway.service";

export class InMemoryEnglishPathwayRepository implements EnglishPathwayRepository {
  readonly placementRules: EnglishPlacementRuleReference[] = [];
  readonly skillRecords: EnglishSkillRecordReference[] = [];

  async findPlacementRule(input: { organizationId: string; ruleId: string }) {
    const rule = this.placementRules.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.ruleId,
    );
    return rule ? structuredClone(rule) : null;
  }

  async createSkillRecords(input: EnglishSkillRecordReference[]) {
    const clones = structuredClone(input);
    this.skillRecords.push(...clones);
    return structuredClone(clones);
  }

  async listSkillRecords(input: { organizationId: string; studentId: string }) {
    return structuredClone(
      this.skillRecords.filter(
        (candidate) => candidate.organizationId === input.organizationId && candidate.studentId === input.studentId,
      ),
    );
  }

  async createManualReview(input: EnglishSkillRecordReference) {
    const clone = structuredClone(input);
    this.skillRecords.push(clone);
    return structuredClone(clone);
  }
}
