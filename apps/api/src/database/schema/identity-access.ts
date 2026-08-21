import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const organizationStatus = pgEnum("organization_status", ["active", "suspended", "archived"]);
export const deploymentMode = pgEnum("deployment_mode", ["saas", "dedicated"]);
export const provisioningState = pgEnum("provisioning_state", [
  "pending",
  "provisioning",
  "ready",
  "failed",
  "archived",
]);
export const userStatus = pgEnum("user_status", ["invited", "active", "suspended", "archived"]);
export const scopeKind = pgEnum("scope_kind", ["organization", "branch", "class", "student"]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  status: organizationStatus("status").notNull().default("active"),
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  deploymentMode: deploymentMode("deployment_mode").notNull().default("saas"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tenantInstances = pgTable(
  "tenant_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    databaseName: text("database_name").notNull(),
    databaseEndpoint: text("database_endpoint").notNull(),
    deploymentMode: deploymentMode("deployment_mode").notNull(),
    provisioningState: provisioningState("provisioning_state").notNull().default("pending"),
    schemaVersion: text("schema_version").notNull().default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ organizationUnique: uniqueIndex("tenant_instances_organization_unique").on(table.organizationId) }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    status: userStatus("status").notNull().default("invited"),
    timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationEmailUnique: uniqueIndex("users_organization_email_unique").on(table.organizationId, table.email),
  }),
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id),
    key: text("key").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationKeyUnique: uniqueIndex("roles_organization_key_unique").on(table.organizationId, table.key),
  }),
);
export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
  },
  (table) => ({
    resourceActionUnique: uniqueIndex("permissions_resource_action_unique").on(table.resource, table.action),
  }),
);
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ userRoleUnique: uniqueIndex("user_roles_user_role_unique").on(table.userId, table.roleId) }),
);
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex("role_permissions_role_permission_unique").on(table.roleId, table.permissionId),
  }),
);

export const scopeGrants = pgTable("scope_grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  kind: scopeKind("kind").notNull(),
  resourceId: uuid("resource_id").notNull(),
  effectiveFrom: timestamp("effective_from", { withTimezone: true }).notNull().defaultNow(),
  effectiveTo: timestamp("effective_to", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  beforeSnapshot: jsonb("before_snapshot"),
  afterSnapshot: jsonb("after_snapshot"),
  result: text("result").notNull(),
  correlationId: text("correlation_id").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  securityRelevant: boolean("security_relevant").notNull().default(false),
});
