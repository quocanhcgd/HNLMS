import { createHash, randomUUID } from "node:crypto";

export const CONSULTATION_IDEMPOTENCY_SCOPE = "POST:/public/consultations";

export type ConsultationInput = {
  fullName: string;
  phone: string;
  email?: string;
  interest: string;
  branchId?: string;
  message?: string;
  source: string;
  consent: boolean;
  clientSubmissionKey: string;
};

export type ConsultationRequest = {
  organizationId: string;
  correlationId: string;
  input: ConsultationInput;
};

export type ConsultationRecord = {
  id: string;
  organizationId: string;
  fullName: string;
  phone: string;
  email?: string;
  interest: string;
  branchId?: string;
  message?: string;
  source: string;
  consentedAt: Date;
  createdAt: Date;
};

export type ConsultationSubmission = {
  consultationId: string;
  status: "accepted";
};

export type ConsultationRepository = {
  create(input: Omit<ConsultationRecord, "createdAt">): Promise<ConsultationRecord>;
};

export type ConsultationIdempotencyStore = {
  begin(
    scope: string,
    key: string,
    requestHash: string,
  ): Promise<{ duplicate: boolean; response?: ConsultationSubmission }>;
  complete(scope: string, key: string, response: ConsultationSubmission): Promise<void>;
};

export type ConsultationAudit = (event: {
  organizationId: string;
  action: "consultation.submitted";
  entityId: string;
  correlationId: string;
  after: Record<string, unknown>;
}) => Promise<void>;

export class ConsultationError extends Error {
  constructor(
    public readonly code: "invalid_input" | "consent_required" | "idempotency_in_progress",
    message: string = code,
  ) {
    super(message);
    this.name = "ConsultationError";
  }
}

function normalized(value: string | undefined): string | undefined {
  const result = value?.trim();
  return result || undefined;
}

function requireText(value: string | undefined, field: string): string {
  const result = normalized(value);
  if (!result) throw new ConsultationError("invalid_input", `${field}_required`);
  return result;
}

function validateEmail(value: string | undefined): string | undefined {
  const email = normalized(value);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ConsultationError("invalid_input", "email_invalid");
  }
  return email;
}

function validatePhone(value: string): string {
  const phone = requireText(value, "phone");
  if (!/^[+\d][\d\s().-]{6,31}$/.test(phone)) {
    throw new ConsultationError("invalid_input", "phone_invalid");
  }
  return phone;
}

export function normalizeConsultationInput(input: ConsultationInput): ConsultationInput {
  if (!input.consent) throw new ConsultationError("consent_required");
  const message = normalized(input.message);
  if (message && message.length > 2_000) throw new ConsultationError("invalid_input", "message_too_long");

  return {
    fullName: requireText(input.fullName, "full_name"),
    phone: validatePhone(input.phone),
    email: validateEmail(input.email),
    interest: requireText(input.interest, "interest"),
    branchId: normalized(input.branchId),
    message,
    source: requireText(input.source, "source"),
    consent: true,
    clientSubmissionKey: requireText(input.clientSubmissionKey, "client_submission_key"),
  };
}

export function consultationRequestHash(organizationId: string, input: ConsultationInput): string {
  const payload = JSON.stringify({ organizationId, ...input });
  return createHash("sha256").update(payload).digest("hex");
}

export class ConsultationService {
  constructor(
    private readonly repository: ConsultationRepository,
    private readonly idempotency: ConsultationIdempotencyStore,
    private readonly audit: ConsultationAudit = async () => undefined,
    private readonly newId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async submit(request: ConsultationRequest): Promise<ConsultationSubmission> {
    const organizationId = requireText(request.organizationId, "organization_id");
    const correlationId = requireText(request.correlationId, "correlation_id");
    const input = normalizeConsultationInput(request.input);
    const key = input.clientSubmissionKey;
    const begun = await this.idempotency.begin(
      `${CONSULTATION_IDEMPOTENCY_SCOPE}:${organizationId}`,
      key,
      consultationRequestHash(organizationId, input),
    );
    if (begun.duplicate) {
      if (begun.response) return begun.response;
      throw new ConsultationError("idempotency_in_progress");
    }

    const consentedAt = this.now();
    const consultation = await this.repository.create({
      id: this.newId(),
      organizationId,
      fullName: input.fullName,
      phone: input.phone,
      ...(input.email ? { email: input.email } : {}),
      interest: input.interest,
      ...(input.branchId ? { branchId: input.branchId } : {}),
      ...(input.message ? { message: input.message } : {}),
      source: input.source,
      consentedAt,
    });
    const response: ConsultationSubmission = { consultationId: consultation.id, status: "accepted" };
    await this.idempotency.complete(`${CONSULTATION_IDEMPOTENCY_SCOPE}:${organizationId}`, key, response);
    await this.audit({
      organizationId,
      action: "consultation.submitted",
      entityId: consultation.id,
      correlationId,
      after: { source: consultation.source, consentedAt: consultation.consentedAt.toISOString() },
    });
    return response;
  }
}

export class InMemoryConsultationRepository implements ConsultationRepository {
  readonly records: ConsultationRecord[] = [];

  async create(input: Omit<ConsultationRecord, "createdAt">): Promise<ConsultationRecord> {
    const record = { ...input, createdAt: new Date() };
    this.records.push(record);
    return structuredClone(record);
  }
}

export class InMemoryConsultationIdempotencyStore implements ConsultationIdempotencyStore {
  private readonly records = new Map<string, { requestHash: string; response?: ConsultationSubmission }>();

  async begin(scope: string, key: string, requestHash: string) {
    const identity = `${scope}:${key}`;
    const existing = this.records.get(identity);
    if (existing) {
      if (existing.requestHash !== requestHash) throw new Error("idempotency_key_reused_with_different_request");
      return { duplicate: true, response: existing.response };
    }
    this.records.set(identity, { requestHash });
    return { duplicate: false };
  }

  async complete(scope: string, key: string, response: ConsultationSubmission): Promise<void> {
    const record = this.records.get(`${scope}:${key}`);
    if (!record) throw new Error("idempotency_key_not_persisted");
    record.response = structuredClone(response);
  }
}
