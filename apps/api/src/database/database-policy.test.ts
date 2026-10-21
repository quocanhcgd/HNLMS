import { describe, expect, it } from "vitest";
import { createDatabase, databaseConfigFromEnv, withTransaction } from "./client";
import { TenantResolver } from "./tenant-resolver";

describe("database policy", () => {
  it("validates postgres URL and bounded pool size", () => {
    expect(databaseConfigFromEnv({ DATABASE_URL: "postgresql://localhost/hnlms", DATABASE_POOL_MAX: "20" })).toEqual({ url: "postgresql://localhost/hnlms", maxConnections: 20 });
    expect(() => createDatabase({ url: "mysql://localhost/db" })).toThrow("DATABASE_URL_must_be_postgres");
    expect(() => databaseConfigFromEnv({ DATABASE_URL: "postgresql://localhost/db", DATABASE_POOL_MAX: "101" })).toThrow("DATABASE_POOL_MAX_invalid");
  });
  it("provides an explicit transaction boundary and rejects archived tenants", async () => {
    let committed = false;
    await withTransaction({ transaction: async (operation) => operation({}) }, async () => { committed = true; return "ok"; });
    expect(committed).toBe(true);
    const resolver = new TenantResolver({
      findByOrganizationId: async (id) => id === "archived" ? { organizationId: id, databaseUrl: "postgresql://db", status: "archived", schemaVersion: "1" } : undefined,
      findBySubdomain: async () => undefined,
    });
    await expect(resolver.resolve({ organizationId: "archived" })).rejects.toThrow("tenant_not_resolved");
  });
});
