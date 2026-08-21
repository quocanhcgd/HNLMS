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
  status: "maintenance",
  schemaVersion: "2",
};

describe("tenant resolver foundation", () => {
  it("prefers the explicit organization registry lookup", async () => {
    const calls: string[] = [];
    const registry: TenantRegistry = {
      findByOrganizationId: async (id) => {
        calls.push(`organization:${id}`);
        return id === "org-a" ? tenantA : undefined;
      },
      findBySubdomain: async (subdomain) => {
        calls.push(`subdomain:${subdomain}`);
        return subdomain === "a" ? tenantB : undefined;
      },
    };
    await expect(new TenantResolver(registry).resolve({ organizationId: "org-a", subdomain: "a" })).resolves.toEqual(
      tenantA,
    );
    expect(calls).toEqual(["organization:org-a"]);
  });

  it("falls back to subdomain only when organization lookup misses", async () => {
    const registry: TenantRegistry = {
      findByOrganizationId: async () => undefined,
      findBySubdomain: async (subdomain) => (subdomain === "b" ? tenantB : undefined),
    };
    await expect(new TenantResolver(registry).resolve({ organizationId: "missing", subdomain: "b" })).resolves.toEqual(
      tenantB,
    );
    await expect(new TenantResolver(registry).resolve({})).rejects.toThrow("tenant_not_resolved");
    await expect(
      new TenantResolver(registry).resolve({ organizationId: "missing", subdomain: "missing" }),
    ).rejects.toThrow("tenant_not_resolved");
  });

  it("returns lifecycle and schema metadata from the registry record", async () => {
    const registry: TenantRegistry = {
      findByOrganizationId: async () => tenantB,
      findBySubdomain: async () => undefined,
    };
    await expect(new TenantResolver(registry).resolve({ organizationId: "org-b" })).resolves.toEqual({
      organizationId: "org-b",
      databaseUrl: "postgres://tenant-b",
      status: "maintenance",
      schemaVersion: "2",
    });
  });
});
