export type ScopeKind = "organization" | "branch" | "class" | "student";
export type PermissionKey = `${string}:${string}`;
export type ScopeGrant = {
  userId: string;
  kind: ScopeKind;
  resourceId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};
export type AuthorizationContext = {
  userId: string;
  organizationId: string;
  branchIds: ReadonlySet<string>;
  classIds: ReadonlySet<string>;
  studentIds: ReadonlySet<string>;
  permissions: ReadonlySet<PermissionKey>;
  roles: ReadonlySet<string>;
  now?: Date;
};
export type ScopedResource = { organizationId: string; branchId?: string; classId?: string; studentId?: string };
export class AuthorizationError extends Error {
  constructor(public readonly code: "forbidden" | "missing_permission" | "scope_mismatch") {
    super(code);
  }
}

export function hasScope(context: AuthorizationContext, grant: ScopeGrant): boolean {
  if (grant.userId !== context.userId) return false;
  const now = context.now ?? new Date();
  if (grant.effectiveFrom && new Date(grant.effectiveFrom) > now) return false;
  if (grant.effectiveTo && new Date(grant.effectiveTo) <= now) return false;
  if (grant.kind === "organization") return grant.resourceId === context.organizationId;
  if (grant.kind === "branch") return context.branchIds.has(grant.resourceId);
  if (grant.kind === "class") return context.classIds.has(grant.resourceId);
  return context.studentIds.has(grant.resourceId);
}
export function canAccessResource(context: AuthorizationContext, resource: ScopedResource): boolean {
  if (resource.organizationId !== context.organizationId) return false;
  if (resource.branchId && !context.branchIds.has(resource.branchId)) return false;
  if (resource.classId && !context.classIds.has(resource.classId)) return false;
  if (resource.studentId && !context.studentIds.has(resource.studentId)) return false;
  return true;
}
export function hasPermission(context: AuthorizationContext, permission: PermissionKey): boolean {
  return context.permissions.has(permission);
}
export function assertAuthorized(
  context: AuthorizationContext,
  permission: PermissionKey,
  resource: ScopedResource,
): void {
  if (!hasPermission(context, permission)) throw new AuthorizationError("missing_permission");
  if (!canAccessResource(context, resource)) throw new AuthorizationError("scope_mismatch");
}
export function createAuthorizationContext(input: {
  userId: string;
  organizationId: string;
  branchIds?: Iterable<string>;
  classIds?: Iterable<string>;
  studentIds?: Iterable<string>;
  permissions?: Iterable<PermissionKey>;
  roles?: Iterable<string>;
  now?: Date;
}): AuthorizationContext {
  return {
    userId: input.userId,
    organizationId: input.organizationId,
    branchIds: new Set(input.branchIds),
    classIds: new Set(input.classIds),
    studentIds: new Set(input.studentIds),
    permissions: new Set(input.permissions),
    roles: new Set(input.roles),
    now: input.now,
  };
}
