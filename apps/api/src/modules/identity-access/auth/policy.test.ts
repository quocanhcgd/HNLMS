import { describe, expect, it } from "vitest";
import { consumePasswordReset, issuePasswordReset, revokeSession, revokeSubjectSessions, sessionCookieOptions } from "./policy";
import type { SessionRecord } from "./session";

describe("authentication policy", () => {
  it("uses secure production cookie flags and one-time reset tokens", () => {
    expect(sessionCookieOptions("production")).toMatchObject({ name: "hnlms_session", httpOnly: true, secure: true, sameSite: "strict", path: "/" });
    const now = new Date("2026-08-25T00:00:00Z");
    const issued = issuePasswordReset("u1", now);
    const consumed = consumePasswordReset(issued.record, issued.token, new Date("2026-08-25T00:01:00Z"));
    expect(consumed.usedAt).toEqual(new Date("2026-08-25T00:01:00Z"));
    expect(() => consumePasswordReset(consumed, issued.token, new Date("2026-08-25T00:02:00Z"))).toThrow("password_reset_used");
  });
  it("rejects invalid/expired reset tokens and revokes subject sessions", () => {
    const now = new Date("2026-08-25T00:00:00Z");
    const issued = issuePasswordReset("u1", now, 1000);
    expect(() => consumePasswordReset(issued.record, "wrong", now)).toThrow("password_reset_invalid");
    expect(() => consumePasswordReset(issued.record, issued.token, new Date("2026-08-25T00:00:01.001Z"))).toThrow("password_reset_expired");
    const base: SessionRecord = { id: "s1", tokenHash: "h", expiresAt: new Date("2027-01-01"), principal: { subjectId: "u1", organizationId: "o1", realm: "tenant", status: "active" } };
    expect(revokeSession(base, now).revokedAt).toEqual(now);
    expect(revokeSubjectSessions([base, { ...base, id: "s2", principal: { ...base.principal, subjectId: "u2" } }], "u1", now)[1].revokedAt).toBeUndefined();
  });
});
