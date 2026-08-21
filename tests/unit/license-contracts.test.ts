import { describe, expect, it } from "vitest";
import {
  evaluateEntitlement,
  evaluateLicenseUsability,
  evaluateQuota,
  type LicenseDocument,
  type LicenseVerifier,
  verifyLicenseDocument,
} from "@hnlms/license-contracts";

const license: LicenseDocument = {
  licenseId: "license-1",
  organizationId: "organization-1",
  term: "yearly",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-06-01T00:00:00.000Z",
  graceUntil: "2026-06-08T00:00:00.000Z",
  entitlements: { academic: { enabled: true, quota: 3 }, payroll: { enabled: false } },
  signature: "valid-signature",
};

const verifier: LicenseVerifier = {
  verify: (_payload, signature) =>
    signature === "valid-signature" ? { valid: true } : { valid: false, reason: "invalid_signature" },
};

describe("license contracts", () => {
  it("delegates signed payload validation to an injected verifier without exposing signing material", () => {
    expect(verifyLicenseDocument(license, verifier)).toEqual({ valid: true });
    expect(verifyLicenseDocument({ ...license, signature: "tampered" }, verifier)).toEqual({
      valid: false,
      reason: "invalid_signature",
    });
  });

  it("distinguishes active, grace, expired, and not-started licenses", () => {
    expect(evaluateLicenseUsability(license, new Date("2026-05-31T23:59:59.999Z"))).toMatchObject({
      state: "active",
      usable: true,
    });
    expect(evaluateLicenseUsability(license, new Date("2026-06-01T00:00:00.000Z"))).toMatchObject({
      state: "grace",
      usable: true,
    });
    expect(evaluateLicenseUsability(license, new Date("2026-06-08T00:00:00.000Z"))).toMatchObject({
      state: "expired",
      usable: false,
    });
    expect(evaluateLicenseUsability(license, new Date("2025-12-31T23:59:59.999Z"))).toMatchObject({
      state: "not_started",
      usable: false,
    });
  });

  it("requires a usable license and enabled feature before permitting quota consumption", () => {
    expect(evaluateEntitlement(license, "payroll", new Date("2026-05-01T00:00:00Z"))).toMatchObject({
      enabled: false,
      reason: "feature_not_entitled",
    });
    expect(evaluateQuota(license, "academic", 2, new Date("2026-05-01T00:00:00Z"))).toEqual({
      allowed: true,
      remaining: 1,
      reason: "allowed",
    });
    expect(evaluateQuota(license, "academic", 3, new Date("2026-05-01T00:00:00Z"))).toEqual({
      allowed: false,
      remaining: 0,
      reason: "quota_exhausted",
    });
    expect(evaluateQuota(license, "academic", 0, new Date("2026-06-08T00:00:00Z"))).toEqual({
      allowed: false,
      reason: "license_not_usable",
    });
  });
});
