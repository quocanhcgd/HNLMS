import { createOpaqueToken, hashToken } from "./crypto";
import type { AuthenticationRealm, SessionRecord } from "./session";

export type SessionCookieOptions = { name: string; httpOnly: true; secure: boolean; sameSite: "lax" | "strict"; path: "/"; maxAgeSeconds: number };
export const SESSION_COOKIE_NAME = "hnlms_session";

export function sessionCookieOptions(nodeEnv: "development" | "test" | "production"): SessionCookieOptions {
  return { name: SESSION_COOKIE_NAME, httpOnly: true, secure: nodeEnv === "production", sameSite: nodeEnv === "production" ? "strict" : "lax", path: "/", maxAgeSeconds: 60 * 60 * 8 };
}

export type PasswordResetRecord = { id: string; userId: string; tokenHash: string; expiresAt: Date; usedAt?: Date };
export function issuePasswordReset(userId: string, now = new Date(), ttlMs = 30 * 60_000) {
  if (!userId.trim() || ttlMs <= 0) throw new Error("password_reset_input_invalid");
  const token = createOpaqueToken();
  return { token: token.token, record: { id: `reset-${token.tokenHash.slice(0, 12)}`, userId, tokenHash: token.tokenHash, expiresAt: new Date(now.getTime() + ttlMs) } satisfies PasswordResetRecord };
}

export function consumePasswordReset(record: PasswordResetRecord, token: string, now = new Date()): PasswordResetRecord {
  if (record.usedAt) throw new Error("password_reset_used");
  if (record.expiresAt <= now) throw new Error("password_reset_expired");
  if (hashToken(token) !== record.tokenHash) throw new Error("password_reset_invalid");
  return { ...record, usedAt: now };
}

export function revokeSession(session: SessionRecord, now = new Date()): SessionRecord {
  if (session.revokedAt) return session;
  return { ...session, revokedAt: now };
}

export function revokeSubjectSessions(sessions: readonly SessionRecord[], subjectId: string, now = new Date()): SessionRecord[] {
  return sessions.map((session) => session.principal.subjectId === subjectId ? revokeSession(session, now) : session);
}

export function assertAuthenticationRealm(realm: AuthenticationRealm, expected: AuthenticationRealm) {
  if (realm !== expected) throw new Error("realm_mismatch");
}

export function assertPlatformMfa(mfaSatisfied: boolean | undefined) {
  if (!mfaSatisfied) throw new Error("platform_mfa_required");
}
