import { describe, expect, it, vi } from "vitest";
import {
  IdempotencyConflictError,
  PostgresIdempotencyStore,
  PostgresInboxStore,
  PostgresOutboxStore,
} from "../../apps/api/src/shared/integrations";

type Result<Row> = { rows: Row[] };
class FakeDatabase {
  readonly calls: Array<{ sql: string; values?: unknown[] }> = [];
  outbox?: Record<string, unknown>;
  inbox?: Record<string, unknown>;
  idempotency?: Record<string, unknown>;
  async query<Row>(sql: string, values?: unknown[]): Promise<Result<Row>> {
    this.calls.push({ sql, values });
    if (sql.includes("INSERT INTO integration_outbox_events")) {
      if (this.outbox) return { rows: [] };
      this.outbox = {
        id: values![0],
        organization_id: values![1],
        branch_id: values![2],
        aggregate_type: values![3],
        aggregate_id: values![4],
        event_type: values![5],
        payload_version: values![6],
        payload: JSON.parse(values![7] as string),
        idempotency_key: values![8],
        correlation_id: values![9],
        status: "pending",
        attempts: 0,
        available_at: values![10],
        created_at: values![10],
        published_at: null,
        last_error: null,
      };
      return { rows: [this.outbox as Row] };
    }
    if (sql.includes("FROM integration_outbox_events")) return { rows: this.outbox ? [this.outbox as Row] : [] };
    if (sql.includes("INSERT INTO integration_inbox_events")) {
      if (this.inbox) return { rows: [] };
      this.inbox = {
        provider: values![0],
        provider_event_id: values![1],
        event_type: values![2],
        payload: JSON.parse(values![3] as string),
        status: "received",
        attempts: 0,
        received_at: values![4],
        processed_at: null,
        last_error: null,
      };
      return { rows: [this.inbox as Row] };
    }
    if (sql.includes("FROM integration_inbox_events")) return { rows: this.inbox ? [this.inbox as Row] : [] };
    if (sql.includes("INSERT INTO idempotency_keys")) {
      if (this.idempotency) return { rows: [] };
      this.idempotency = {
        scope: values![0],
        key: values![1],
        request_hash: values![2],
        status: "in_progress",
        response: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
      return { rows: [this.idempotency as Row] };
    }
    if (sql.includes("FROM idempotency_keys")) return { rows: this.idempotency ? [this.idempotency as Row] : [] };
    return { rows: [] };
  }
}

describe("outbox, inbox, and idempotency persistence primitives", () => {
  it("persists an outbox event once and returns it on a repeated stable key", async () => {
    const database = new FakeDatabase();
    const store = new PostgresOutboxStore(database);
    const occurredAt = new Date("2026-08-21T00:00:00Z");
    const input = {
      id: "out-1",
      organizationId: "org-1",
      aggregateType: "invoice",
      aggregateId: "inv-1",
      eventType: "accounting.sync",
      payloadVersion: 1,
      payload: { amount: 10 },
      idempotencyKey: "invoice:inv-1:v1",
      correlationId: "corr-1",
      occurredAt,
    };
    await expect(store.enqueue(input)).resolves.toMatchObject({
      id: "out-1",
      status: "pending",
      payload: { amount: 10 },
    });
    await expect(store.enqueue(input)).resolves.toMatchObject({ id: "out-1" });
    expect(database.calls.filter((call) => call.sql.includes("INSERT INTO integration_outbox_events"))).toHaveLength(2);
  });
  it("deduplicates provider webhook events by provider and stable event id", async () => {
    const database = new FakeDatabase();
    const store = new PostgresInboxStore(database);
    expect(
      (
        await store.receive({
          provider: "pay",
          providerEventId: "evt-1",
          eventType: "payment_confirmed",
          payload: { invoice: "i1" },
        })
      ).duplicate,
    ).toBe(false);
    expect(
      (
        await store.receive({
          provider: "pay",
          providerEventId: "evt-1",
          eventType: "payment_confirmed",
          payload: { invoice: "i1" },
        })
      ).duplicate,
    ).toBe(true);
  });
  it("returns prior idempotency records and rejects keys reused for a different request", async () => {
    const database = new FakeDatabase();
    const store = new PostgresIdempotencyStore(database);
    expect((await store.begin("POST:/payments", "key-1", "hash-a")).duplicate).toBe(false);
    expect((await store.begin("POST:/payments", "key-1", "hash-a")).duplicate).toBe(true);
    await expect(store.begin("POST:/payments", "key-1", "hash-b")).rejects.toBeInstanceOf(IdempotencyConflictError);
    await store.complete("POST:/payments", "key-1", { paymentId: "p1" });
    expect(database.calls.at(-1)?.sql).toContain("status = 'completed'");
  });
});
