export type TenantRegistryRecord = {
  organizationId: string;
  databaseUrl: string;
  status: "active" | "maintenance" | "archived";
  schemaVersion: string;
};
export type TenantSource = { subdomain?: string; organizationId?: string };

export interface TenantRegistry {
  findBySubdomain(subdomain: string): Promise<TenantRegistryRecord | undefined>;
  findByOrganizationId(id: string): Promise<TenantRegistryRecord | undefined>;
}
export class TenantResolver {
  constructor(private readonly registry: TenantRegistry) {}
  async resolve(source: TenantSource): Promise<TenantRegistryRecord> {
    if (source.organizationId) {
      const record = await this.registry.findByOrganizationId(source.organizationId);
      if (record) return record;
    }
    if (source.subdomain) {
      const record = await this.registry.findBySubdomain(source.subdomain);
      if (record) return record;
    }
    throw new Error("tenant_not_resolved");
  }
}
