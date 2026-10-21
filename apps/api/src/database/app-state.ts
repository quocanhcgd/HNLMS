import { and, eq } from "drizzle-orm";
import { createDatabase } from "./client";
import { appStateRecords } from "./schema/app-state";

type Db = ReturnType<typeof createDatabase>["db"];

/** Database-backed JSON state used only when an explicitly configured local database is available. */
export class AppStateStore {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async read<T>(organizationId: string, namespace: string, recordKey: string): Promise<T | null> {
    const rows = await this.db
      .select({ payload: appStateRecords.payload })
      .from(appStateRecords)
      .where(and(eq(appStateRecords.organizationId, organizationId), eq(appStateRecords.namespace, namespace), eq(appStateRecords.recordKey, recordKey)))
      .limit(1);
    return (rows[0]?.payload as T | undefined) ?? null;
  }

  async write(organizationId: string, namespace: string, recordKey: string, payload: unknown): Promise<void> {
    await this.db
      .insert(appStateRecords)
      .values({ organizationId, namespace, recordKey, payload })
      .onConflictDoUpdate({
        target: [appStateRecords.organizationId, appStateRecords.namespace, appStateRecords.recordKey],
        set: { payload, updatedAt: new Date() },
      });
  }
}

let sharedStore: AppStateStore | undefined;
let unavailable = false;

/**
 * Do not connect during module import. This keeps UI/demo mode working while
 * making persistence opt-in through DATABASE_URL and lets a bad local secret
 * fail the request gracefully instead of taking down the API.
 */
export function configuredAppStateStore(): AppStateStore | undefined {
  if (unavailable || !process.env.DATABASE_URL) return undefined;
  if (sharedStore) return sharedStore;
  try {
    sharedStore = new AppStateStore(createDatabase({ url: process.env.DATABASE_URL }).db);
    return sharedStore;
  } catch {
    unavailable = true;
    return undefined;
  }
}

export function resetAppStateStoreForTests(): void {
  sharedStore = undefined;
  unavailable = false;
}
