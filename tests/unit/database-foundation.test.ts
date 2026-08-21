import { describe, expect, it } from "vitest";
import { databaseConfigFromEnv } from "../../apps/api/src/database/client";
import { TenantResolver, type TenantRegistryRecord } from "../../apps/api/src/database/tenant-resolver";

const tenantA: TenantRegistryRecord = {
  organizationId: "org-a",
  databaseUrl: "postgres://tenant-a",
  status: "active",
  schemaVersion: "1",
};
const registry = {
  findBySubdomain: async (value: string) => (value === "a" ? tenantA : undefined),
  findByOrganizationId: async (value: string) => (value === "org-a" ? tenantA : undefined),
};

describe("database foundation", () => {
  it("fails fast without DATABASE_URL", () => {
    expect(() => databaseConfigFromEnv({})).toThrow("DATABASE_URL is required");
  });
  it("resolves only registry-owned tenant database urls", async () => {
    const resolver = new TenantResolver(registry);
    await expect(resolver.resolve({ organizationId: "org-a" })).resolves.toEqual(tenantA);
    await expect(resolver.resolve({ subdomain: "unknown" })).rejects.toThrow("tenant_not_resolved");
  });
});
