
import { createHash, randomUUID } from "node:crypto";

export type AssessmentAttemptActor = {
  userId?: string;
  organizationId: string;
  leadId?: string;
};

export type AttemptAssessmentReference = {
  id: string;
  organizationId: string;
  status: "draft" | "published" | "retired";
  opensAt: Date | null;
  closesAt: Date | null;
  durationMinutes: number | null;
  maxAttempts: number;
};

export type TimedAssessmentAttempt = {
  id: string;
  organizationId: string;
  assessmentId: string;
  assignmentId: string | null;
  participantUserId: string | null;
  leadId: string | null;
  attemptNo: number;
  clientAttemptKey: string;
  requestFingerprint: string;
  status: "created" | "in_progress" | "submitted" | "auto_submitted" | "graded" | "voided";
  startedAt: Date | null;
  submittedAt: Date | null;
  expiresAt: Date | null;
  answers: unknown;
  autosaveState: Record<string, unknown> | null;
  rawScore: number | null;
  maxScore: number | null;
  gradedByUserId: string | null;
  gradedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type StartAttemptInput = {
  assessmentId: string;
  assignmentId?: string;
  participantUserId?: string;
  leadId?: string;
  clientAttemptKey: string;
};

export type AutosaveAttemptInput = {
  attemptId: string;
  answers: unknown;
  autosaveKey: string;
};

export type SubmitAttemptInput = {
  attemptId: string;
  answers: unknown;
  clientSubmitKey: string;
};

export type AssessmentAttemptRepository = {
  findAssessment(input: { organizationId: string; assessmentId: string }): Promise<AttemptAssessmentReference | null>;
  findAttemptByClientKey(input: {
    organizationId: string;
    clientAttemptKey: string;
  }): Promise<TimedAssessmentAttempt | null>;
  countAttemptsForParticipant(input: {
    organizationId: string;
    assessmentId: string;
    participantUserId?: string;
    leadId?: string;
  }): Promise<number>;
  createAttempt(input: TimedAssessmentAttempt): Promise<TimedAssessmentAttempt>;
  findAttempt(input: { organizationId: string; attemptId: string }): Promise<TimedAssessmentAttempt | null>;
  updateAttempt(input: TimedAssessmentAttempt): Promise<TimedAssessmentAttempt>;
};

export type AssessmentAttemptAudit = (event: {
  organizationId: string;
  actorUserId: string | null;
  action: "assessment.attempt-started" | "assessment.attempt-autosaved" | "assessment.attempt-submitted" | "assessment.attempt-timeout";
  entityId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export type AssessmentAttemptErrorCode =
  | "not_found"
  | "forbidden"
  | "invalid_input"
  | "assessment_unavailable"
  | "attempt_limit_exceeded"
  | "idempotency_conflict"
  | "invalid_attempt_status"
  | "attempt_expired";

export class AssessmentAttemptError extends Error {
  constructor(
    public readonly code: AssessmentAttemptErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "AssessmentAttemptError";
  }
}

function requiredText(value: string | undefined, field: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new AssessmentAttemptError("invalid_input", `${field}_required`);
  return normalized;
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function assertOwner(actor: AssessmentAttemptActor, attempt: TimedAssessmentAttempt): void {
  if (attempt.participantUserId && actor.userId === attempt.participantUserId) return;
  if (attempt.leadId && actor.leadId === attempt.leadId) return;
  throw new AssessmentAttemptError("forbidden", "attempt_not_owned");
}

function assertAssessmentAvailable(assessment: AttemptAssessmentReference, now: Date): void {
  if (assessment.status !== "published") throw new AssessmentAttemptError("assessment_unavailable");
  if (assessment.opensAt && assessment.opensAt > now) throw new AssessmentAttemptError("assessment_unavailable");
  if (assessment.closesAt && assessment.closesAt <= now) throw new AssessmentAttemptError("assessment_unavailable");
}

function computeExpiresAt(assessment: AttemptAssessmentReference, startedAt: Date): Date | null {
  if (!assessment.durationMinutes) return assessment.closesAt;
  const durationExpiry = new Date(startedAt.getTime() + assessment.durationMinutes * 60_000);
  if (assessment.closesAt && assessment.closesAt < durationExpiry) return assessment.closesAt;
  return durationExpiry;
}

function isExpired(attempt: TimedAssessmentAttempt, now: Date): boolean {
  return Boolean(attempt.expiresAt && attempt.expiresAt <= now);
}

export class AssessmentAttemptService {
  constructor(
    private readonly repository: AssessmentAttemptRepository,
    private readonly audit: AssessmentAttemptAudit = async () => undefined,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID,
  ) {}

  async start(actor: AssessmentAttemptActor, rawInput: StartAttemptInput): Promise<TimedAssessmentAttempt> {
    const input = {
      ...rawInput,
      assessmentId: requiredText(rawInput.assessmentId, "assessment_id"),
      clientAttemptKey: requiredText(rawInput.clientAttemptKey, "client_attempt_key"),
    };
    const participantUserId = input.participantUserId ?? actor.userId;
    const leadId = input.leadId ?? actor.leadId;
    if (!participantUserId && !leadId) throw new AssessmentAttemptError("invalid_input", "participant_required");
    const requestFingerprint = fingerprint({
      assessmentId: input.assessmentId,
      assignmentId: input.assignmentId ?? null,
      participantUserId: participantUserId ?? null,
      leadId: leadId ?? null,
    });
    const existing = await this.repository.findAttemptByClientKey({
      organizationId: actor.organizationId,
      clientAttemptKey: input.clientAttemptKey,
    });
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) throw new AssessmentAttemptError("idempotency_conflict");
      assertOwner(actor, existing);
      return existing;
    }
    const assessment = await this.repository.findAssessment({
      organizationId: actor.organizationId,
      assessmentId: input.assessmentId,
    });
    if (!assessment || assessment.organizationId !== actor.organizationId) {
      throw new AssessmentAttemptError("not_found", "assessment_not_found");
    }
    const startedAt = this.now();
    assertAssessmentAvailable(assessment, startedAt);
    const previousAttempts = await this.repository.countAttemptsForParticipant({
      organizationId: actor.organizationId,
      assessmentId: assessment.id,
      participantUserId,
      leadId,
    });
    if (previousAttempts >= assessment.maxAttempts) throw new AssessmentAttemptError("attempt_limit_exceeded");
    const attempt: TimedAssessmentAttempt = {
      id: this.newId(),
      organizationId: actor.organizationId,
      assessmentId: assessment.id,
      assignmentId: input.assignmentId ?? null,
      participantUserId: participantUserId ?? null,
      leadId: leadId ?? null,
      attemptNo: previousAttempts + 1,
      clientAttemptKey: input.clientAttemptKey,
      requestFingerprint,
      status: "in_progress",
      startedAt,
      submittedAt: null,
      expiresAt: computeExpiresAt(assessment, startedAt),
      answers: null,
      autosaveState: null,
      rawScore: null,
      maxScore: null,
      gradedByUserId: null,
      gradedAt: null,
      createdAt: startedAt,
      updatedAt: startedAt,
    };
    const created = await this.repository.createAttempt(attempt);
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId ?? null,
      action: "assessment.attempt-started",
      entityId: created.id,
      after: { assessmentId: created.assessmentId, attemptNo: created.attemptNo, expiresAt: created.expiresAt?.toISOString() ?? null },
    });
    return created;
  }

  async autosave(actor: AssessmentAttemptActor, rawInput: AutosaveAttemptInput): Promise<TimedAssessmentAttempt> {
    const attempt = await this.loadOwnedAttempt(actor, rawInput.attemptId);
    if (attempt.status !== "in_progress") throw new AssessmentAttemptError("invalid_attempt_status");
    if (isExpired(attempt, this.now())) return this.timeout(actor, attempt.id);
    const savedAt = this.now();
    const saved = await this.repository.updateAttempt({
      ...attempt,
      answers: rawInput.answers,
      autosaveState: {
        ...(attempt.autosaveState ?? {}),
        lastAutosaveKey: requiredText(rawInput.autosaveKey, "autosave_key"),
        lastAutosaveFingerprint: fingerprint(rawInput.answers),
        lastAutosavedAt: savedAt.toISOString(),
      },
      updatedAt: savedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId ?? null,
      action: "assessment.attempt-autosaved",
      entityId: saved.id,
      after: { autosaveKey: rawInput.autosaveKey },
    });
    return saved;
  }

  async submit(actor: AssessmentAttemptActor, rawInput: SubmitAttemptInput): Promise<TimedAssessmentAttempt> {
    const clientSubmitKey = requiredText(rawInput.clientSubmitKey, "client_submit_key");
    const attempt = await this.loadOwnedAttempt(actor, rawInput.attemptId);
    const submitFingerprint = fingerprint({ clientSubmitKey, answers: rawInput.answers });
    if (attempt.status === "submitted" || attempt.status === "auto_submitted") {
      if (attempt.autosaveState?.lastSubmitFingerprint === submitFingerprint) return attempt;
      throw new AssessmentAttemptError("idempotency_conflict");
    }
    if (attempt.status !== "in_progress") throw new AssessmentAttemptError("invalid_attempt_status");
    if (isExpired(attempt, this.now())) return this.timeout(actor, attempt.id);
    const submittedAt = this.now();
    const submitted = await this.repository.updateAttempt({
      ...attempt,
      status: "submitted",
      answers: rawInput.answers,
      submittedAt,
      autosaveState: {
        ...(attempt.autosaveState ?? {}),
        lastSubmitKey: clientSubmitKey,
        lastSubmitFingerprint: submitFingerprint,
        lastSubmittedAt: submittedAt.toISOString(),
      },
      updatedAt: submittedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId ?? null,
      action: "assessment.attempt-submitted",
      entityId: submitted.id,
      after: { submittedAt: submittedAt.toISOString() },
    });
    return submitted;
  }

  async timeout(actor: AssessmentAttemptActor, attemptId: string): Promise<TimedAssessmentAttempt> {
    const attempt = await this.loadOwnedAttempt(actor, attemptId);
    if (attempt.status === "auto_submitted") return attempt;
    if (attempt.status !== "in_progress") throw new AssessmentAttemptError("invalid_attempt_status");
    if (!isExpired(attempt, this.now())) throw new AssessmentAttemptError("attempt_expired", "attempt_not_expired_yet");
    const submittedAt = this.now();
    const timedOut = await this.repository.updateAttempt({
      ...attempt,
      status: "auto_submitted",
      submittedAt,
      autosaveState: {
        ...(attempt.autosaveState ?? {}),
        timeoutHandledAt: submittedAt.toISOString(),
      },
      updatedAt: submittedAt,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId ?? null,
      action: "assessment.attempt-timeout",
      entityId: timedOut.id,
      after: { submittedAt: submittedAt.toISOString(), expiresAt: timedOut.expiresAt?.toISOString() ?? null },
    });
    return timedOut;
  }

  private async loadOwnedAttempt(actor: AssessmentAttemptActor, attemptId: string): Promise<TimedAssessmentAttempt> {
    const attempt = await this.repository.findAttempt({
      organizationId: actor.organizationId,
      attemptId: requiredText(attemptId, "attempt_id"),
    });
    if (!attempt || attempt.organizationId !== actor.organizationId) throw new AssessmentAttemptError("not_found");
    assertOwner(actor, attempt);
    return attempt;
  }
}
