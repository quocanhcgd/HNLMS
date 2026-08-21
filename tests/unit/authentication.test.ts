import { describe, expect, it } from "vitest";
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  validatePassword,
  verifyPassword,
} from "../../apps/api/src/modules/identity-access/auth/crypto";
import {
  assertRealm,
  assertSessionActive,
  type SessionRecord,
} from "../../apps/api/src/modules/identity-access/auth/session";

describe("authentication foundation", () => {
  const password = "Correct-Horse!2026";
  it("enforces password policy and hashes without plaintext", () => {
    expect(validatePassword("short")).toContain("password_too_short");
    const stored = hashPassword(password);
    expect(stored.hash).not.toContain(password);
    expect(verifyPassword(password, stored)).toBe(true);
    expect(verifyPassword("Wrong-Horse!2026", stored)).toBe(false);
  });
  it("creates opaque one-time token material", () => {
    const token = createOpaqueToken();
    expect(token.token).not.toBe(token.tokenHash);
    expect(token.tokenHash).toBe(hashToken(token.token));
  });
  it("rejects expired, revoked and inactive sessions", () => {
    const base: SessionRecord = {
      id: "s1",
      tokenHash: "hash",
      expiresAt: new Date("2026-08-21T01:00:00Z"),
      principal: { subjectId: "u1", organizationId: "org1", realm: "tenant", status: "active" },
    };
    expect(assertSessionActive(base, new Date("2026-08-21T00:30:00Z")).subjectId).toBe("u1");
    expect(() => assertSessionActive({ ...base, revokedAt: new Date() })).toThrow("session_revoked");
    expect(() => assertSessionActive(base, new Date("2026-08-21T02:00:00Z"))).toThrow("session_expired");
    expect(() => assertRealm(base.principal, "platform")).toThrow("realm_mismatch");
  });
  it("requires MFA for platform realm and organization for tenant realm", () => {
    const platform = { subjectId: "admin", realm: "platform" as const, status: "active" as const, mfaSatisfied: false };
    expect(() =>
      assertSessionActive({ id: "s", tokenHash: "h", expiresAt: new Date(Date.now() + 10000), principal: platform }),
    ).toThrow("platform_mfa_required");
    expect(() => assertRealm({ subjectId: "u", realm: "tenant", status: "active" }, "tenant")).toThrow(
      "tenant_organization_required",
    );
  });
});
