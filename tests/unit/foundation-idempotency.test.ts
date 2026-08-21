import { describe, expect, it } from "vitest";
import { IdempotencyConflictError, PostgresIdempotencyStore } from "../../apps/api/src/shared/integrations";

type Row = Record<string, unknown>;
class FakeDatabase {
  private readonly records = new Map<string, Row>();

  async query<T>(sql: string, values: unknown[] = []): Promise<{ rows: T[] }> {
    const identity = `${String(values[0])}:${String(values[1])}`;
    if (sql.includes("INSERT INTO idempotency_keys")) {
      if (this.records.has(identity)) return { rows: [] };
      const now = new Date("2026-08-21T00:00:00Z");
      const record = {
        scope: values[0],
        key: values[1],
        request_hash: values[2],
        status: "in_progress",
        response: null,
        created_at: now,
        updated_at: now,
      };
      this.records.set(identity, record);
      return { rows: [record as T] };
    }
    if (sql.includes("SELECT * FROM idempotency_keys"))
      return { rows: this.records.has(identity) ? [this.records.get(identity) as T] : [] };
    if (sql.includes("UPDATE idempotency_keys")) {
      const record = this.records.get(identity);
      if (record) {
        record.status = "completed";
        record.response = JSON.parse(String(values[2]));
      }
    }
    return { rows: [] };
  }
}

describe("idempotency foundation", () => {
  it("deduplicates the same request but isolates identical keys by scope", async () => {
    const store = new PostgresIdempotencyStore(new FakeDatabase());
    await expect(store.begin("POST:/payments", "key-1", "hash-a")).resolves.toMatchObject({ duplicate: false });
    await expect(store.begin("POST:/payments", "key-1", "hash-a")).resolves.toMatchObject({ duplicate: true });
    await expect(store.begin("POST:/refunds", "key-1", "hash-b")).resolves.toMatchObject({ duplicate: false });
  });

  it("rejects a reused key with a different request hash", async () => {
    const store = new PostgresIdempotencyStore(new FakeDatabase());
    await store.begin("POST:/payments", "key-1", "hash-a");
    await expect(store.begin("POST:/payments", "key-1", "hash-b")).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("marks the stable record completed with the response payload", async () => {
    const database = new FakeDatabase();
    const store = new PostgresIdempotencyStore(database);
    await store.begin("POST:/payments", "key-1", "hash-a");
    await expect(store.complete("POST:/payments", "key-1", { paymentId: "payment-1" })).resolves.toBeUndefined();
    await expect(store.begin("POST:/payments", "key-1", "hash-a")).resolves.toMatchObject({
      duplicate: true,
      record: { status: "completed", response: { paymentId: "payment-1" } },
    });
  });
});
