import { describe, expect, it } from "vitest";
import { TenantResolver, type TenantRegistry, type TenantRegistryRecord } from "../../src/database/tenant-resolver";

type TenantId = "tenant-a" | "tenant-b";
type ProvisionedTenant = TenantRegistryRecord & {
  databaseName: string;
  quota: { storageBytes: number; userCount: number };
  licenseKey: string;
  backupIds: string[];
  migrationVersions: string[];
  rows: Map<string, string>;
};

type BackupMetadata = {
  id: string;
  organizationId: string;
  databaseName: string;
  schemaVersion: string;
  rowCount: number;
};

type Connection = {
  organizationId: string;
  databaseUrl: string;
  databaseName: string;
  tenant: ProvisionedTenant;
  readOnly: boolean;
};

class InMemoryTenantRegistry implements TenantRegistry {
  private readonly byOrganization = new Map<string, TenantRegistryRecord>();
  private readonly bySubdomain = new Map<string, TenantRegistryRecord>();

  register(subdomain: string, record: TenantRegistryRecord): void {
    this.byOrganization.set(record.organizationId, record);
    this.bySubdomain.set(subdomain, record);
  }

  findBySubdomain(subdomain: string): Promise<TenantRegistryRecord | undefined> {
    return Promise.resolve(this.bySubdomain.get(subdomain));
  }

  findByOrganizationId(organizationId: string): Promise<TenantRegistryRecord | undefined> {
    return Promise.resolve(this.byOrganization.get(organizationId));
  }
}

class InMemoryTenantProvisioner {
  private readonly tenants = new Map<TenantId, ProvisionedTenant>();
  private readonly registry: InMemoryTenantRegistry;

  constructor(registry: InMemoryTenantRegistry) {
    this.registry = registry;
  }

  provision(input: {
    tenantId: TenantId;
    subdomain: string;
    databaseUrl: string;
    databaseName: string;
    schemaVersion: string;
    quota: ProvisionedTenant["quota"];
    licenseKey: string;
  }): ProvisionedTenant {
    const tenant: ProvisionedTenant = {
      organizationId: input.tenantId,
      databaseUrl: input.databaseUrl,
      status: "active",
      schemaVersion: input.schemaVersion,
      databaseName: input.databaseName,
      quota: { ...input.quota },
      licenseKey: input.licenseKey,
      backupIds: [],
      migrationVersions: [input.schemaVersion],
      rows: new Map(),
    };
    this.tenants.set(input.tenantId, tenant);
    this.registry.register(input.subdomain, tenant);
    return tenant;
  }

  get(tenantId: TenantId): ProvisionedTenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`tenant_not_provisioned:${tenantId}`);
    return tenant;
  }
}

class InMemoryTenantConnectionAdapter {
  constructor(private readonly provisioner: InMemoryTenantProvisioner) {}

  connect(record: TenantRegistryRecord): Connection {
    const tenant = this.provisioner.get(record.organizationId as TenantId);
    if (tenant.databaseUrl !== record.databaseUrl) throw new Error("tenant_database_url_mismatch");
    return {
      organizationId: record.organizationId,
      databaseUrl: record.databaseUrl,
      databaseName: tenant.databaseName,
      tenant,
      readOnly: false,
    };
  }

  write(connection: Connection, key: string, value: string): void {
    if (connection.readOnly) throw new Error("tenant_database_read_only");
    connection.tenant.rows.set(key, value);
  }

  read(connection: Connection, key: string): string | undefined {
    return connection.tenant.rows.get(key);
  }
}

class InMemoryBackupAdapter {
  private readonly backups = new Map<string, { metadata: BackupMetadata; rows: Map<string, string> }>();

  create(connection: Connection): BackupMetadata {
    const id = `backup-${connection.organizationId}`;
    const metadata: BackupMetadata = {
      id,
      organizationId: connection.organizationId,
      databaseName: connection.databaseName,
      schemaVersion: connection.tenant.schemaVersion,
      rowCount: connection.tenant.rows.size,
    };
    this.backups.set(id, { metadata, rows: new Map(connection.tenant.rows) });
    connection.tenant.backupIds.push(id);
    return metadata;
  }

  restore(connection: Connection, backupId: string): void {
    const backup = this.backups.get(backupId);
    if (!backup) throw new Error("backup_not_found");
    if (backup.metadata.organizationId !== connection.organizationId) throw new Error("cross_tenant_backup_restore");
    connection.tenant.rows.clear();
    for (const [key, value] of backup.rows) connection.tenant.rows.set(key, value);
  }
}

class InMemoryMigrationAdapter {
  migrate(connection: Connection, version: string): void {
    connection.tenant.schemaVersion = version;
    connection.tenant.migrationVersions.push(version);
  }
}

function createFixture() {
  const registry = new InMemoryTenantRegistry();
  const provisioner = new InMemoryTenantProvisioner(registry);
  const tenantA = provisioner.provision({
    tenantId: "tenant-a",
    subdomain: "a",
    databaseUrl: "postgres://tenant-a",
    databaseName: "hnlms_tenant_a",
    schemaVersion: "1",
    quota: { storageBytes: 100, userCount: 10 },
    licenseKey: "license-a",
  });
  const tenantB = provisioner.provision({
    tenantId: "tenant-b",
    subdomain: "b",
    databaseUrl: "postgres://tenant-b",
    databaseName: "hnlms_tenant_b",
    schemaVersion: "1",
    quota: { storageBytes: 200, userCount: 20 },
    licenseKey: "license-b",
  });
  const resolver = new TenantResolver(registry);
  const connections = new InMemoryTenantConnectionAdapter(provisioner);
  const backups = new InMemoryBackupAdapter();
  const migrations = new InMemoryMigrationAdapter();

  return { backups, connections, migrations, provisioner, resolver, tenantA, tenantB };
}

describe("tenant database isolation integration", () => {
  it("provisions distinct registry-owned databases and connections for each tenant", async () => {
    const fixture = createFixture();
    const recordA = await fixture.resolver.resolve({ organizationId: "tenant-a" });
    const recordB = await fixture.resolver.resolve({ organizationId: "tenant-b" });
    const connectionA = fixture.connections.connect(recordA);
    const connectionB = fixture.connections.connect(recordB);

    expect(connectionA.databaseName).toBe("hnlms_tenant_a");
    expect(connectionB.databaseName).toBe("hnlms_tenant_b");
    expect(connectionA.databaseUrl).not.toBe(connectionB.databaseUrl);
    expect(connectionA.tenant).not.toBe(connectionB.tenant);
  });

  it("keeps tenant data isolated when both connections are used through the same adapter", async () => {
    const fixture = createFixture();
    const connectionA = fixture.connections.connect(await fixture.resolver.resolve({ subdomain: "a" }));
    const connectionB = fixture.connections.connect(await fixture.resolver.resolve({ subdomain: "b" }));

    fixture.connections.write(connectionA, "learner-1", "tenant-a-data");
    fixture.connections.write(connectionB, "learner-1", "tenant-b-data");

    expect(fixture.connections.read(connectionA, "learner-1")).toBe("tenant-a-data");
    expect(fixture.connections.read(connectionB, "learner-1")).toBe("tenant-b-data");
  });

  it("keeps backup and restore metadata and rows scoped to the owning tenant", async () => {
    const fixture = createFixture();
    const connectionA = fixture.connections.connect(await fixture.resolver.resolve({ organizationId: "tenant-a" }));
    const connectionB = fixture.connections.connect(await fixture.resolver.resolve({ organizationId: "tenant-b" }));

    fixture.connections.write(connectionA, "setting", "before-restore");
    fixture.connections.write(connectionB, "setting", "tenant-b-unchanged");
    const backupA = fixture.backups.create(connectionA);
    fixture.connections.write(connectionA, "setting", "after-restore");

    fixture.backups.restore(connectionA, backupA.id);

    expect(fixture.connections.read(connectionA, "setting")).toBe("before-restore");
    expect(fixture.connections.read(connectionB, "setting")).toBe("tenant-b-unchanged");
    expect(backupA.organizationId).toBe("tenant-a");
    expect(backupA.databaseName).toBe("hnlms_tenant_a");
    expect(fixture.tenantB.backupIds).toEqual([]);
    expect(() => fixture.backups.restore(connectionB, backupA.id)).toThrow("cross_tenant_backup_restore");
  });

  it("migrates one tenant's metadata without changing the other tenant", async () => {
    const fixture = createFixture();
    const connectionA = fixture.connections.connect(await fixture.resolver.resolve({ organizationId: "tenant-a" }));
    const connectionB = fixture.connections.connect(await fixture.resolver.resolve({ organizationId: "tenant-b" }));

    fixture.migrations.migrate(connectionA, "2");

    expect(connectionA.tenant.schemaVersion).toBe("2");
    expect(connectionA.tenant.migrationVersions).toEqual(["1", "2"]);
    expect(connectionB.tenant.schemaVersion).toBe("1");
    expect(connectionB.tenant.migrationVersions).toEqual(["1"]);
    expect(fixture.tenantA.licenseKey).toBe("license-a");
    expect(fixture.tenantB.licenseKey).toBe("license-b");
    expect(fixture.tenantA.quota).toEqual({ storageBytes: 100, userCount: 10 });
    expect(fixture.tenantB.quota).toEqual({ storageBytes: 200, userCount: 20 });
  });
});
