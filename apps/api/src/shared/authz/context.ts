import type { AuthorizationContext, PermissionKey, ScopedResource } from "@hnlms/authorization";

export const AUTHORIZATION_CONTEXT = Symbol("AUTHORIZATION_CONTEXT");
export type AuthenticatedPrincipal = { userId: string; organizationId: string };
export interface AuthorizationContextLoader {
  load(principal: AuthenticatedPrincipal): Promise<AuthorizationContext>;
}
export type AuthorizedRequest = { authorization?: AuthorizationContext };
export function requireServerPrincipal(value: unknown): AuthenticatedPrincipal {
  if (!value || typeof value !== "object") throw new Error("unauthenticated");
  const principal = value as Partial<AuthenticatedPrincipal>;
  if (!principal.userId || !principal.organizationId) throw new Error("unauthenticated");
  return { userId: principal.userId, organizationId: principal.organizationId };
}
export type GuardRequirement = { permission: PermissionKey; resource: ScopedResource };
