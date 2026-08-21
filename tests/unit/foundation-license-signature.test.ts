import { describe, expect, it } from "vitest";
import {
  evaluateEntitlement,
  evaluateQuota,
  licensePayload,
  type LicenseDocument,
  type LicenseVerifier,
  verifyLicenseDocument,
} from "@hnlms/license-contracts";
import { LicenseRuntime } from "../../apps/api/src/modules/license-runtime";

const license: LicenseDocument = {
  licenseId: "license-1",
  organizationId: "org-1",
  term: "yearly",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-06-01T00:00:00.000Z",
  graceUntil: "2026-06-08T00:00:00.000Z",
  entitlements: { academic: { enabled: true, quota: 2 } },
  signature: "sig-1",
};

describe("license signature foundation", () => {
  it("verifies exactly the unsigned payload", () => {
    let received: unknown;
    const verifier: LicenseVerifier = {
      verify: (payload, signature) => {
        received = payload;
        return signature === "sig-1" ? { valid: true } : { valid: false, reason: "invalid_signature" };
      },
    };
    const payload = { ...license };
    delete (payload as Partial<LicenseDocument>).signature;
    expect(licensePayload(license)).toEqual(payload);
    expect(verifyLicenseDocument(license, verifier)).toEqual({ valid: true });
    expect(received).toEqual(payload);
    expect(verifyLicenseDocument({ ...license, signature: "tampered" }, verifier)).toEqual({
      valid: false,
      reason: "invalid_signature",
    });
  });

  it("denies entitlement and quota when verification fails", () => {
    const runtime = new LicenseRuntime({ verify: () => ({ valid: false, reason: "invalid_signature" }) });
    expect(runtime.evaluate(license, "academic", 0)).toMatchObject({
      verification: { valid: false, reason: "invalid_signature" },
      entitlement: { enabled: false, reason: "license_not_usable" },
      quota: { allowed: false, reason: "license_not_usable" },
    });
  });

  it("does not reuse a cached signature after the document changes", () => {
    let verifications = 0;
    const runtime = new LicenseRuntime(
      {
        verify: () => {
          verifications += 1;
          return { valid: true };
        },
      },
      undefined,
      { cacheTtlMs: 60_000 },
    );
    expect(runtime.evaluate(license, "academic", 0, new Date("2026-02-01T00:00:00Z")).source).toBe("verified");
    expect(runtime.evaluate(license, "academic", 0, new Date("2026-02-01T00:00:30Z")).source).toBe("cache");
    expect(
      runtime.evaluate({ ...license, signature: "sig-2" }, "academic", 0, new Date("2026-02-01T00:01:00Z")).source,
    ).toBe("verified");
    expect(verifications).toBe(2);
  });

  it("treats grace as usable and its exact end as expired", () => {
    expect(evaluateEntitlement(license, "academic", new Date("2026-06-07T23:59:59.999Z"))).toMatchObject({
      enabled: true,
    });
    expect(evaluateQuota(license, "academic", 2, new Date("2026-06-07T23:59:59.999Z"))).toMatchObject({
      allowed: false,
      reason: "quota_exhausted",
    });
    expect(evaluateEntitlement(license, "academic", new Date("2026-06-08T00:00:00.000Z"))).toMatchObject({
      enabled: false,
      reason: "license_not_usable",
    });
  });
});
