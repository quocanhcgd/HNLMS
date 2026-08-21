import type { Pool, PoolClient } from "pg";
import { IdempotencyConflictError, type IdempotencyRecord, type JsonValue } from "./contracts.js";

type Queryable = Pick<Pool | PoolClient, "query">;
type IdempotencyRow = {
  scope: string;
  key: string;
  request_hash: string;
  status: IdempotencyRecord["status"];
  response: JsonValue | null;
  created_at: Date;
  updated_at: Date;
};
const toRecord = (row: IdempotencyRow): IdempotencyRecord => ({
  scope: row.scope,
  key: row.key,
  requestHash: row.request_hash,
  status: row.status,
  response: row.response ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export class PostgresIdempotencyStore {
  constructor(private readonly database: Queryable) {}

  async begin(
    scope: string,
    key: string,
    requestHash: string,
    transaction: Queryable = this.database,
  ): Promise<{ record: IdempotencyRecord; duplicate: boolean }> {
    const inserted = await transaction.query<IdempotencyRow>(
      `INSERT INTO idempotency_keys (scope, key, request_hash, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'in_progress', NOW(), NOW())
       ON CONFLICT (scope, key) DO NOTHING RETURNING *`,
      [scope, key, requestHash],
    );
    const row =
      inserted.rows[0] ??
      (
        await transaction.query<IdempotencyRow>("SELECT * FROM idempotency_keys WHERE scope = $1 AND key = $2", [
          scope,
          key,
        ])
      ).rows[0];
    if (!row) throw new Error("idempotency_key_not_persisted");
    const record = toRecord(row);
    if (record.requestHash !== requestHash) throw new IdempotencyConflictError();
    return { record, duplicate: !inserted.rows[0] };
  }

  async complete(
    scope: string,
    key: string,
    response: JsonValue,
    transaction: Queryable = this.database,
  ): Promise<void> {
    await transaction.query(
      "UPDATE idempotency_keys SET status = 'completed', response = $3::jsonb, updated_at = NOW() WHERE scope = $1 AND key = $2",
      [scope, key, JSON.stringify(response)],
    );
  }
}
