export type ScopeKind = "organization" | "branch" | "class" | "student";
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
  now?: Date;
};

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

export function canAccessResource(
  context: AuthorizationContext,
  resource: { organizationId: string; branchId?: string; classId?: string; studentId?: string },
): boolean {
  if (resource.organizationId !== context.organizationId) return false;
  if (resource.branchId && !context.branchIds.has(resource.branchId)) return false;
  if (resource.classId && !context.classIds.has(resource.classId)) return false;
  if (resource.studentId && !context.studentIds.has(resource.studentId)) return false;
  return true;
}
