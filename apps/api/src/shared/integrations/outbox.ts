import type { Pool, PoolClient } from "pg";
import type { IntegrationEventInput, JsonValue, OutboxEvent } from "./contracts.js";

type Queryable = Pick<Pool | PoolClient, "query">;
type OutboxRow = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload_version: number;
  payload: JsonValue;
  idempotency_key: string;
  correlation_id: string;
  status: OutboxEvent["status"];
  attempts: number;
  available_at: Date;
  created_at: Date;
  published_at: Date | null;
  last_error: string | null;
};

const toOutboxEvent = (row: OutboxRow): OutboxEvent => ({
  id: row.id,
  organizationId: row.organization_id,
  branchId: row.branch_id ?? undefined,
  aggregateType: row.aggregate_type,
  aggregateId: row.aggregate_id,
  eventType: row.event_type,
  payloadVersion: row.payload_version,
  payload: row.payload,
  idempotencyKey: row.idempotency_key,
  correlationId: row.correlation_id,
  status: row.status,
  attempts: row.attempts,
  availableAt: row.available_at,
  createdAt: row.created_at,
  publishedAt: row.published_at ?? undefined,
  lastError: row.last_error ?? undefined,
});

export class PostgresOutboxStore {
  constructor(private readonly database: Queryable) {}

  // Call with the business transaction so the domain change and event commit together.
  async enqueue(input: IntegrationEventInput, transaction: Queryable = this.database): Promise<OutboxEvent> {
    const occurredAt = input.occurredAt ?? new Date();
    const result = await transaction.query<OutboxRow>(
      `INSERT INTO integration_outbox_events (
        id, organization_id, branch_id, aggregate_type, aggregate_id, event_type, payload_version,
        payload, idempotency_key, correlation_id, status, attempts, available_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, 'pending', 0, $11, $11)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING *`,
      [
        input.id,
        input.organizationId,
        input.branchId ?? null,
        input.aggregateType,
        input.aggregateId,
        input.eventType,
        input.payloadVersion,
        JSON.stringify(input.payload),
        input.idempotencyKey,
        input.correlationId,
        occurredAt,
      ],
    );
    if (result.rows[0]) return toOutboxEvent(result.rows[0]);
    const existing = await transaction.query<OutboxRow>(
      "SELECT * FROM integration_outbox_events WHERE idempotency_key = $1",
      [input.idempotencyKey],
    );
    if (!existing.rows[0]) throw new Error("outbox_event_not_persisted");
    return toOutboxEvent(existing.rows[0]);
  }
}
