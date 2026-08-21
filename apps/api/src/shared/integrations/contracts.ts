export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export type IntegrationEventInput = {
  id: string;
  organizationId: string;
  branchId?: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payloadVersion: number;
  payload: JsonValue;
  idempotencyKey: string;
  correlationId: string;
  occurredAt?: Date;
};

export type OutboxEvent = IntegrationEventInput & {
  status: "pending" | "processing" | "published" | "dead_lettered";
  attempts: number;
  availableAt: Date;
  createdAt: Date;
  publishedAt?: Date;
  lastError?: string;
};

export type InboxEventInput = {
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: JsonValue;
  receivedAt?: Date;
};

export type InboxEvent = InboxEventInput & {
  status: "received" | "processing" | "processed" | "dead_lettered";
  attempts: number;
  receivedAt: Date;
  processedAt?: Date;
  lastError?: string;
};

export type IdempotencyRecord = {
  scope: string;
  key: string;
  requestHash: string;
  status: "in_progress" | "completed" | "failed";
  response?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

export class IdempotencyConflictError extends Error {
  constructor(message = "idempotency_key_reused_with_different_request") {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}
