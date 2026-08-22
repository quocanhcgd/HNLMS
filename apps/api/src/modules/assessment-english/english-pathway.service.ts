
import { randomUUID } from "node:crypto";

export type EnglishSkill = "listening" | "speaking" | "reading" | "writing";
export type EnglishLevelCode = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type EnglishPathwayActor = {
  userId: string;
  organizationId: string;
  canReviewEnglishPathway?: boolean;
};

export type EnglishSkillInput = {
  skill: EnglishSkill;
  score: number;
  maxScore: number;
  confidence?: number;
};

export type EnglishPlacementRuleReference = {
  id: string;
  organizationId: string;
  pathwayId: string;
  status: "draft" | "active" | "archived";
  thresholds: Array<{ levelCode: EnglishLevelCode; minPercent: number }>;
  skillWeights?: Partial<Record<EnglishSkill, number>>;
};

export type EnglishSkillRecordReference = {
  id: string;
  organizationId: string;
  studentId: string;
  skill: EnglishSkill;
  levelCode: EnglishLevelCode;
  score: number | null;
  confidence: number | null;
  source: "placement" | "assessment" | "review" | "migration";
  sourceRef: string | null;
  notes: Record<string, unknown> | null;
  capturedAt: Date;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
};

export type EnglishPathwayProgress = {
  studentId: string;
  overallLevel: EnglishLevelCode;
  overallPercent: number;
  skills: Record<EnglishSkill, { levelCode: EnglishLevelCode; percent: number; confidence: number }>;
  needsManualReview: boolean;
};

export type EnglishPlacementDecision = EnglishPathwayProgress & {
  pathwayId: string;
  ruleId: string;
  recordIds: string[];
};

export type ManualReviewInput = {
  studentId: string;
  skill: EnglishSkill;
  levelCode: EnglishLevelCode;
  score?: number;
  confidence?: number;
  note: string;
};

export type EnglishPathwayRepository = {
  findPlacementRule(input: { organizationId: string; ruleId: string }): Promise<EnglishPlacementRuleReference | null>;
  createSkillRecords(input: EnglishSkillRecordReference[]): Promise<EnglishSkillRecordReference[]>;
  listSkillRecords(input: { organizationId: string; studentId: string }): Promise<EnglishSkillRecordReference[]>;
  createManualReview(input: EnglishSkillRecordReference): Promise<EnglishSkillRecordReference>;
};

export type EnglishPathwayAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "english.placement-calculated" | "english.manual-review-recorded";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export type EnglishPathwayErrorCode = "not_found" | "forbidden" | "invalid_input" | "invalid_rule";

export class EnglishPathwayError extends Error {
  constructor(
    public readonly code: EnglishPathwayErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "EnglishPathwayError";
  }
}

const skills: EnglishSkill[] = ["listening", "speaking", "reading", "writing"];
const levelOrder: EnglishLevelCode[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function assertReviewPermission(actor: EnglishPathwayActor): void {
  if (!actor.canReviewEnglishPathway) throw new EnglishPathwayError("forbidden", "english_review_permission_required");
}

function percent(score: number, maxScore: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0 || score < 0 || score > maxScore) {
    throw new EnglishPathwayError("invalid_input", "invalid_skill_score");
  }
  return Math.round((score / maxScore) * 100);
}

function normalizeRule(rule: EnglishPlacementRuleReference): EnglishPlacementRuleReference {
  if (rule.status !== "active" || !Array.isArray(rule.thresholds) || rule.thresholds.length === 0) {
    throw new EnglishPathwayError("invalid_rule", "active_threshold_rule_required");
  }
  const sorted = [...rule.thresholds].sort((a, b) => b.minPercent - a.minPercent);
  for (const threshold of sorted) {
    if (!levelOrder.includes(threshold.levelCode) || threshold.minPercent < 0 || threshold.minPercent > 100) {
      throw new EnglishPathwayError("invalid_rule", "invalid_threshold");
    }
  }
  return { ...rule, thresholds: sorted };
}

function resolveLevel(percentValue: number, rule: EnglishPlacementRuleReference): EnglishLevelCode {
  return rule.thresholds.find((threshold) => percentValue >= threshold.minPercent)?.levelCode ?? "A1";
}

function minLevel(levels: EnglishLevelCode[]): EnglishLevelCode {
  return levels.reduce((lowest, level) => (levelOrder.indexOf(level) < levelOrder.indexOf(lowest) ? level : lowest));
}

function latestBySkill(records: EnglishSkillRecordReference[]): Map<EnglishSkill, EnglishSkillRecordReference> {
  const map = new Map<EnglishSkill, EnglishSkillRecordReference>();
  for (const record of records) {
    const existing = map.get(record.skill);
    if (!existing || existing.capturedAt < record.capturedAt) map.set(record.skill, record);
  }
  return map;
}

export class EnglishPathwayService {
  constructor(
    private readonly repository: EnglishPathwayRepository,
    private readonly audit: EnglishPathwayAudit = async () => undefined,
    private readonly newId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async calculatePlacement(
    actor: EnglishPathwayActor,
    input: { studentId: string; ruleId: string; skills: EnglishSkillInput[]; sourceRef?: string },
  ): Promise<EnglishPlacementDecision> {
    assertReviewPermission(actor);
    const rule = normalizeRule(
      await this.repository.findPlacementRule({ organizationId: actor.organizationId, ruleId: input.ruleId }).then((x) => {
        if (!x || x.organizationId !== actor.organizationId) throw new EnglishPathwayError("not_found", "placement_rule_not_found");
        return x;
      }),
    );
    const provided = new Map(input.skills.map((item) => [item.skill, item]));
    if (skills.some((skill) => !provided.has(skill))) throw new EnglishPathwayError("invalid_input", "four_skills_required");
    const capturedAt = this.now();
    const skillProgress = {} as EnglishPathwayProgress["skills"];
    const records: EnglishSkillRecordReference[] = skills.map((skill) => {
      const item = provided.get(skill)!;
      const p = percent(item.score, item.maxScore);
      const levelCode = resolveLevel(p, rule);
      const confidence = item.confidence ?? Math.min(100, Math.max(50, p));
      skillProgress[skill] = { levelCode, percent: p, confidence };
      return {
        id: this.newId(),
        organizationId: actor.organizationId,
        studentId: input.studentId,
        skill,
        levelCode,
        score: p,
        confidence,
        source: "placement",
        sourceRef: input.sourceRef ?? rule.id,
        notes: { ruleId: rule.id, rawScore: item.score, maxScore: item.maxScore },
        capturedAt,
        reviewedByUserId: actor.userId,
        reviewedAt: capturedAt,
      };
    });
    const saved = await this.repository.createSkillRecords(records);
    const overallPercent = Math.round(
      skills.reduce((sum, skill) => sum + skillProgress[skill].percent * (rule.skillWeights?.[skill] ?? 1), 0) /
        skills.reduce((sum, skill) => sum + (rule.skillWeights?.[skill] ?? 1), 0),
    );
    const overallLevel = minLevel(skills.map((skill) => skillProgress[skill].levelCode));
    const decision: EnglishPlacementDecision = {
      studentId: input.studentId,
      pathwayId: rule.pathwayId,
      ruleId: rule.id,
      overallLevel,
      overallPercent,
      skills: skillProgress,
      needsManualReview: skills.some((skill) => skillProgress[skill].confidence < 60),
      recordIds: saved.map((record) => record.id),
    };
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "english.placement-calculated",
      entityId: input.studentId,
      after: decision,
    });
    return decision;
  }

  async getProgress(actor: EnglishPathwayActor, studentId: string): Promise<EnglishPathwayProgress> {
    const records = await this.repository.listSkillRecords({ organizationId: actor.organizationId, studentId });
    const latest = latestBySkill(records.filter((record) => record.organizationId === actor.organizationId));
    if (skills.some((skill) => !latest.has(skill))) throw new EnglishPathwayError("not_found", "skill_records_incomplete");
    const skillProgress = {} as EnglishPathwayProgress["skills"];
    for (const skill of skills) {
      const record = latest.get(skill)!;
      skillProgress[skill] = {
        levelCode: record.levelCode,
        percent: record.score ?? 0,
        confidence: record.confidence ?? 0,
      };
    }
    return {
      studentId,
      overallLevel: minLevel(skills.map((skill) => skillProgress[skill].levelCode)),
      overallPercent: Math.round(skills.reduce((sum, skill) => sum + skillProgress[skill].percent, 0) / skills.length),
      skills: skillProgress,
      needsManualReview: skills.some((skill) => skillProgress[skill].confidence < 60),
    };
  }

  async recordManualReview(actor: EnglishPathwayActor, input: ManualReviewInput): Promise<EnglishSkillRecordReference> {
    assertReviewPermission(actor);
    if (!input.note.trim()) throw new EnglishPathwayError("invalid_input", "review_note_required");
    const capturedAt = this.now();
    const record = await this.repository.createManualReview({
      id: this.newId(),
      organizationId: actor.organizationId,
      studentId: input.studentId,
      skill: input.skill,
      levelCode: input.levelCode,
      score: input.score ?? null,
      confidence: input.confidence ?? 100,
      source: "review",
      sourceRef: `manual:${capturedAt.toISOString()}`,
      notes: { note: input.note },
      capturedAt,
      reviewedByUserId: actor.userId,
      reviewedAt: capturedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "english.manual-review-recorded",
      entityId: record.id,
      after: { studentId: record.studentId, skill: record.skill, levelCode: record.levelCode },
    });
    return record;
  }
}
