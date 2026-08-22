
import { randomUUID } from "node:crypto";

export type AssessmentPolicyActor = {
  userId: string;
  organizationId: string;
  canManageAssessments?: boolean;
};

export type AssessmentQuestionReference = {
  id: string;
  organizationId: string;
  bankId: string;
  type: "single_choice" | "multiple_choice" | "true_false" | "short_answer" | "essay" | "speaking" | "listening";
  skill: string;
  level: string | null;
  status: "draft" | "in_review" | "approved" | "retired";
  currentVersion: number;
  createdByUserId: string;
  approvedByUserId: string | null;
  approvedAt: Date | null;
};

export type AssessmentBankReference = {
  id: string;
  organizationId: string;
  status: "draft" | "active" | "archived";
};

export type AssessmentPolicyReference = {
  id: string;
  organizationId: string;
  bankId: string | null;
  kind: "entrance" | "mock" | "practice";
  status: "draft" | "published" | "retired";
  title: string;
  opensAt: Date | null;
  closesAt: Date | null;
  durationMinutes: number | null;
  maxAttempts: number;
  blueprint: AssessmentBlueprint | null;
  scoringPolicy: AssessmentScoringPolicy | null;
  publicationPolicy: Record<string, unknown> | null;
};

export type AssessmentBlueprintRule = {
  skill: "listening" | "speaking" | "reading" | "writing" | "grammar" | "vocabulary";
  questionType?: AssessmentQuestionReference["type"];
  level?: string;
  count: number;
  pointsPerQuestion: number;
};

export type AssessmentBlueprint = {
  version: number;
  rules: AssessmentBlueprintRule[];
};

export type AssessmentScoringPolicy = {
  version: number;
  passingScore?: number;
  publishMode: "manual" | "automatic";
  totalPoints: number;
  recommendationBands?: Array<{
    minScore: number;
    maxScore: number;
    recommendedLevel: string;
    recommendedProgramId?: string;
  }>;
};

export type AssessmentPublicationDecision = {
  assessmentId: string;
  totalQuestions: number;
  totalPoints: number;
  opensAt: Date;
  closesAt: Date;
  maxAttempts: number;
};

export type AssessmentPolicyRepository = {
  findQuestion(input: { organizationId: string; questionId: string }): Promise<AssessmentQuestionReference | null>;
  countQuestionVersions(input: { organizationId: string; questionId: string }): Promise<number>;
  approveQuestion(input: {
    organizationId: string;
    questionId: string;
    approvedByUserId: string;
    approvedAt: Date;
  }): Promise<AssessmentQuestionReference>;
  findAssessment(input: { organizationId: string; assessmentId: string }): Promise<AssessmentPolicyReference | null>;
  findBank(input: { organizationId: string; bankId: string }): Promise<AssessmentBankReference | null>;
  countApprovedQuestions(input: {
    organizationId: string;
    bankId: string;
    skill: string;
    type?: AssessmentQuestionReference["type"];
    level?: string;
  }): Promise<number>;
  publishAssessment(input: {
    organizationId: string;
    assessmentId: string;
    publishedAt: Date;
  }): Promise<AssessmentPolicyReference>;
};

export type AssessmentPolicyAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "assessment.question-approved" | "assessment.published";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export type AssessmentPolicyErrorCode =
  | "forbidden"
  | "not_found"
  | "invalid_question_status"
  | "invalid_question_version"
  | "invalid_assessment_status"
  | "invalid_time_window"
  | "invalid_attempt_limit"
  | "invalid_blueprint"
  | "insufficient_approved_questions"
  | "invalid_scoring_policy";

export class AssessmentPolicyError extends Error {
  constructor(
    public readonly code: AssessmentPolicyErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AssessmentPolicyError";
  }
}

function assertManager(actor: AssessmentPolicyActor): void {
  if (!actor.canManageAssessments) throw new AssessmentPolicyError("forbidden", "assessment_management_required");
}

function assertTimeWindow(assessment: AssessmentPolicyReference, now: Date): { opensAt: Date; closesAt: Date } {
  if (!assessment.opensAt || !assessment.closesAt || assessment.closesAt <= assessment.opensAt) {
    throw new AssessmentPolicyError("invalid_time_window", "assessment_window_required");
  }
  if (assessment.closesAt <= now) throw new AssessmentPolicyError("invalid_time_window", "assessment_window_closed");
  if (assessment.durationMinutes !== null && assessment.durationMinutes <= 0) {
    throw new AssessmentPolicyError("invalid_time_window", "duration_must_be_positive");
  }
  return { opensAt: assessment.opensAt, closesAt: assessment.closesAt };
}

function assertAttemptLimit(assessment: AssessmentPolicyReference): void {
  if (!Number.isInteger(assessment.maxAttempts) || assessment.maxAttempts < 1 || assessment.maxAttempts > 10) {
    throw new AssessmentPolicyError("invalid_attempt_limit", "max_attempts_must_be_1_to_10");
  }
}

function blueprintTotals(blueprint: AssessmentBlueprint | null): { totalQuestions: number; totalPoints: number } {
  if (!blueprint || blueprint.version < 1 || !Array.isArray(blueprint.rules) || blueprint.rules.length === 0) {
    throw new AssessmentPolicyError("invalid_blueprint", "blueprint_rules_required");
  }
  let totalQuestions = 0;
  let totalPoints = 0;
  for (const rule of blueprint.rules) {
    if (!rule.skill || !Number.isInteger(rule.count) || rule.count <= 0 || rule.pointsPerQuestion <= 0) {
      throw new AssessmentPolicyError("invalid_blueprint", "invalid_blueprint_rule");
    }
    totalQuestions += rule.count;
    totalPoints += rule.count * rule.pointsPerQuestion;
  }
  return { totalQuestions, totalPoints };
}

function assertScoringPolicy(policy: AssessmentScoringPolicy | null, expectedTotalPoints: number): void {
  if (!policy || policy.version < 1) throw new AssessmentPolicyError("invalid_scoring_policy", "scoring_policy_required");
  if (policy.totalPoints !== expectedTotalPoints) {
    throw new AssessmentPolicyError("invalid_scoring_policy", "scoring_total_points_mismatch");
  }
  if (policy.passingScore !== undefined && (policy.passingScore < 0 || policy.passingScore > policy.totalPoints)) {
    throw new AssessmentPolicyError("invalid_scoring_policy", "passing_score_out_of_range");
  }
  for (const band of policy.recommendationBands ?? []) {
    if (band.minScore < 0 || band.maxScore > policy.totalPoints || band.minScore > band.maxScore) {
      throw new AssessmentPolicyError("invalid_scoring_policy", "recommendation_band_out_of_range");
    }
  }
}

export class AssessmentPolicyService {
  constructor(
    private readonly repository: AssessmentPolicyRepository,
    private readonly audit: AssessmentPolicyAudit = async () => undefined,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID,
  ) {}

  async approveQuestion(actor: AssessmentPolicyActor, questionId: string): Promise<AssessmentQuestionReference> {
    assertManager(actor);
    const question = await this.repository.findQuestion({ organizationId: actor.organizationId, questionId });
    if (!question || question.organizationId !== actor.organizationId) {
      throw new AssessmentPolicyError("not_found", "question_not_found");
    }
    if (question.status !== "in_review") {
      throw new AssessmentPolicyError("invalid_question_status", "question_must_be_in_review");
    }
    const versionCount = await this.repository.countQuestionVersions({
      organizationId: actor.organizationId,
      questionId: question.id,
    });
    if (versionCount < 1 || question.currentVersion < 1) {
      throw new AssessmentPolicyError("invalid_question_version", "question_version_required");
    }
    const approvedAt = this.now();
    const approved = await this.repository.approveQuestion({
      organizationId: actor.organizationId,
      questionId: question.id,
      approvedByUserId: actor.userId,
      approvedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "assessment.question-approved",
      entityId: approved.id,
      after: { status: approved.status, approvedAt: approvedAt.toISOString() },
    });
    return approved;
  }

  async publishAssessment(actor: AssessmentPolicyActor, assessmentId: string): Promise<AssessmentPolicyReference> {
    assertManager(actor);
    const assessment = await this.repository.findAssessment({ organizationId: actor.organizationId, assessmentId });
    if (!assessment || assessment.organizationId !== actor.organizationId) {
      throw new AssessmentPolicyError("not_found", "assessment_not_found");
    }
    const decision = await this.validateForPublication(actor, assessment);
    const published = await this.repository.publishAssessment({
      organizationId: actor.organizationId,
      assessmentId: assessment.id,
      publishedAt: this.now(),
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "assessment.published",
      entityId: assessment.id,
      after: decision,
    });
    return published;
  }

  async validateForPublication(
    actor: AssessmentPolicyActor,
    assessment: AssessmentPolicyReference,
  ): Promise<AssessmentPublicationDecision> {
    assertManager(actor);
    if (assessment.organizationId !== actor.organizationId) throw new AssessmentPolicyError("not_found");
    if (assessment.status !== "draft") {
      throw new AssessmentPolicyError("invalid_assessment_status", "assessment_must_be_draft");
    }
    if (!assessment.bankId) throw new AssessmentPolicyError("invalid_blueprint", "assessment_bank_required");
    const bank = await this.repository.findBank({ organizationId: actor.organizationId, bankId: assessment.bankId });
    if (!bank || bank.status !== "active") throw new AssessmentPolicyError("invalid_blueprint", "active_bank_required");
    const { opensAt, closesAt } = assertTimeWindow(assessment, this.now());
    assertAttemptLimit(assessment);
    const totals = blueprintTotals(assessment.blueprint);
    assertScoringPolicy(assessment.scoringPolicy, totals.totalPoints);
    for (const rule of assessment.blueprint!.rules) {
      const available = await this.repository.countApprovedQuestions({
        organizationId: actor.organizationId,
        bankId: assessment.bankId,
        skill: rule.skill,
        type: rule.questionType,
        level: rule.level,
      });
      if (available < rule.count) {
        throw new AssessmentPolicyError(
          "insufficient_approved_questions",
          `${rule.skill}_requires_${rule.count}_approved_questions`,
        );
      }
    }
    return {
      assessmentId: assessment.id,
      totalQuestions: totals.totalQuestions,
      totalPoints: totals.totalPoints,
      opensAt,
      closesAt,
      maxAttempts: assessment.maxAttempts,
    };
  }

  createBlueprint(rules: AssessmentBlueprintRule[]): AssessmentBlueprint {
    const blueprint = { version: 1, rules };
    blueprintTotals(blueprint);
    return blueprint;
  }

  createScoringPolicy(input: Omit<AssessmentScoringPolicy, "version">): AssessmentScoringPolicy {
    const policy = { version: 1, ...input };
    assertScoringPolicy(policy, input.totalPoints);
    return policy;
  }

  createClientPolicyKey(prefix = "assessment-policy"): string {
    return `${prefix}-${this.newId()}`;
  }
}
