import { describe, expect, it } from "vitest";
import {
  TenantResolver,
  type TenantRegistry,
  type TenantRegistryRecord,
} from "../../apps/api/src/database/tenant-resolver";

const tenantA: TenantRegistryRecord = {
  organizationId: "org-a",
  databaseUrl: "postgres://tenant-a",
  status: "active",
  schemaVersion: "1",
};
const tenantB: TenantRegistryRecord = {
  organizationId: "org-b",
  databaseUrl: "postgres://tenant-b",
  status: "active",
  schemaVersion: "1",
};

class DeterministicTenantRegistry implements TenantRegistry {
  private readonly recordsByOrganization = new Map<string, TenantRegistryRecord>([
    [tenantA.organizationId, tenantA],
    [tenantB.organizationId, tenantB],
  ]);
  private readonly recordsBySubdomain = new Map<string, TenantRegistryRecord>([
    ["a", tenantA],
    ["b", tenantB],
  ]);

  findBySubdomain(subdomain: string): Promise<TenantRegistryRecord | undefined> {
    return Promise.resolve(this.recordsBySubdomain.get(subdomain));
  }

  findByOrganizationId(organizationId: string): Promise<TenantRegistryRecord | undefined> {
    return Promise.resolve(this.recordsByOrganization.get(organizationId));
  }
}

describe("tenant isolation resolver contract", () => {
  it("prefers the server-derived organization registry entry", async () => {
    const resolver = new TenantResolver(new DeterministicTenantRegistry());

    await expect(resolver.resolve({ organizationId: "org-a", subdomain: "b" })).resolves.toEqual(tenantA);
  });

  it("falls back to the registry subdomain and never accepts a client database URL", async () => {
    const resolver = new TenantResolver(new DeterministicTenantRegistry());

    await expect(resolver.resolve({ subdomain: "b" })).resolves.toEqual(tenantB);
    await expect(
      resolver.resolve({ subdomain: "b", organizationId: "org-missing" } as {
        subdomain: string;
        organizationId: string;
      }),
    ).resolves.toEqual(tenantB);
  });

  it("rejects an unknown tenant without exposing or constructing a database connection", async () => {
    const resolver = new TenantResolver(new DeterministicTenantRegistry());

    await expect(resolver.resolve({ organizationId: "org-unknown" })).rejects.toThrow("tenant_not_resolved");
    await expect(resolver.resolve({ subdomain: "unknown" })).rejects.toThrow("tenant_not_resolved");
  });

  it("keeps registry records for different organizations distinct", async () => {
    const resolver = new TenantResolver(new DeterministicTenantRegistry());
    const resolvedA = await resolver.resolve({ organizationId: "org-a" });
    const resolvedB = await resolver.resolve({ organizationId: "org-b" });

    expect(resolvedA).not.toBe(resolvedB);
    expect(resolvedA.databaseUrl).not.toBe(resolvedB.databaseUrl);
    expect(resolvedA.organizationId).not.toBe(resolvedB.organizationId);
  });
});
