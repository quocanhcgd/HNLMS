export type AuthenticationRealm = "tenant" | "platform";
export type SessionPrincipal = {
  subjectId: string;
  organizationId?: string;
  realm: AuthenticationRealm;
  status: "active" | "suspended" | "archived";
  mfaSatisfied?: boolean;
};
export type SessionRecord = {
  id: string;
  principal: SessionPrincipal;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
};
export function assertSessionActive(session: SessionRecord, now = new Date()): SessionPrincipal {
  if (session.revokedAt) throw new Error("session_revoked");
  if (session.expiresAt <= now) throw new Error("session_expired");
  if (session.principal.status !== "active") throw new Error("account_inactive");
  if (session.principal.realm === "platform" && !session.principal.mfaSatisfied)
    throw new Error("platform_mfa_required");
  return session.principal;
}
export function assertRealm(principal: SessionPrincipal, expected: AuthenticationRealm): void {
  if (principal.realm !== expected) throw new Error("realm_mismatch");
  if (expected === "tenant" && !principal.organizationId) throw new Error("tenant_organization_required");
}
