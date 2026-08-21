import type { Pool, PoolClient } from "pg";
import type { InboxEvent, InboxEventInput, JsonValue } from "./contracts.js";

type Queryable = Pick<Pool | PoolClient, "query">;
type InboxRow = {
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload: JsonValue;
  status: InboxEvent["status"];
  attempts: number;
  received_at: Date;
  processed_at: Date | null;
  last_error: string | null;
};
const toInboxEvent = (row: InboxRow): InboxEvent => ({
  provider: row.provider,
  providerEventId: row.provider_event_id,
  eventType: row.event_type,
  payload: row.payload,
  status: row.status,
  attempts: row.attempts,
  receivedAt: row.received_at,
  processedAt: row.processed_at ?? undefined,
  lastError: row.last_error ?? undefined,
});

export class PostgresInboxStore {
  constructor(private readonly database: Queryable) {}

  async receive(
    input: InboxEventInput,
    transaction: Queryable = this.database,
  ): Promise<{ event: InboxEvent; duplicate: boolean }> {
    const receivedAt = input.receivedAt ?? new Date();
    const inserted = await transaction.query<InboxRow>(
      `INSERT INTO integration_inbox_events (provider, provider_event_id, event_type, payload, status, attempts, received_at)
       VALUES ($1, $2, $3, $4::jsonb, 'received', 0, $5)
       ON CONFLICT (provider, provider_event_id) DO NOTHING RETURNING *`,
      [input.provider, input.providerEventId, input.eventType, JSON.stringify(input.payload), receivedAt],
    );
    if (inserted.rows[0]) return { event: toInboxEvent(inserted.rows[0]), duplicate: false };
    const existing = await transaction.query<InboxRow>(
      "SELECT * FROM integration_inbox_events WHERE provider = $1 AND provider_event_id = $2",
      [input.provider, input.providerEventId],
    );
    if (!existing.rows[0]) throw new Error("inbox_event_not_persisted");
    return { event: toInboxEvent(existing.rows[0]), duplicate: true };
  }
}
