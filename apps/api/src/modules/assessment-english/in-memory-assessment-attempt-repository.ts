
import type {
  AssessmentAttemptRepository,
  AttemptAssessmentReference,
  TimedAssessmentAttempt,
} from "./assessment-attempt.service";

export class InMemoryAssessmentAttemptRepository implements AssessmentAttemptRepository {
  readonly assessments: AttemptAssessmentReference[] = [];
  readonly attempts: TimedAssessmentAttempt[] = [];
  readonly attemptCounts = new Map<string, number>();

  private attemptCountKey(organizationId: string, assessmentId: string, participantUserId?: string, leadId?: string) {
    return `${organizationId}:${assessmentId}:${participantUserId ?? "none"}:${leadId ?? "none"}`;
  }

  async findAssessment(input: { organizationId: string; assessmentId: string }) {
    const assessment = this.assessments.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.assessmentId,
    );
    return assessment ? structuredClone(assessment) : null;
  }

  async findAttemptByClientKey(input: { organizationId: string; clientAttemptKey: string }) {
    const attempt = this.attempts.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.clientAttemptKey === input.clientAttemptKey,
    );
    return attempt ? structuredClone(attempt) : null;
  }

  async countAttemptsForParticipant(input: {
    organizationId: string;
    assessmentId: string;
    participantUserId?: string;
    leadId?: string;
  }) {
    return this.attemptCounts.get(this.attemptCountKey(input.organizationId, input.assessmentId, input.participantUserId, input.leadId)) ?? 0;
  }

  async createAttempt(input: TimedAssessmentAttempt) {
    this.attempts.push(structuredClone(input));
    const key = this.attemptCountKey(input.organizationId, input.assessmentId, input.participantUserId ?? undefined, input.leadId ?? undefined);
    this.attemptCounts.set(key, (this.attemptCounts.get(key) ?? 0) + 1);
    return structuredClone(input);
  }

  async findAttempt(input: { organizationId: string; attemptId: string }) {
    const attempt = this.attempts.find(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.attemptId,
    );
    return attempt ? structuredClone(attempt) : null;
  }

  async updateAttempt(input: TimedAssessmentAttempt) {
    const index = this.attempts.findIndex(
      (candidate) => candidate.organizationId === input.organizationId && candidate.id === input.id,
    );
    if (index < 0) throw new Error("attempt_not_found");
    this.attempts[index] = structuredClone(input);
    return structuredClone(input);
  }
}
