import { describe, expect, it } from "vitest";
import type { LicenseDocument, LicenseVerifier } from "@hnlms/license-contracts";
import { InMemoryLicenseCache, LicenseRuntime } from "../../apps/api/src/modules/license-runtime";

const license: LicenseDocument = {
  licenseId: "license-1",
  organizationId: "organization-1",
  term: "yearly",
  startsAt: "2026-01-01T00:00:00.000Z",
  expiresAt: "2026-06-01T00:00:00.000Z",
  graceUntil: "2026-06-08T00:00:00.000Z",
  entitlements: { academic: { enabled: true, quota: 2 } },
  signature: "valid",
};

describe("license runtime", () => {
  it("uses a verified cache entry only until the grace boundary, then re-verifies and denies the entitlement", () => {
    let calls = 0;
    const verifier: LicenseVerifier = {
      verify: () => {
        calls += 1;
        return { valid: true };
      },
    };
    const cache = new InMemoryLicenseCache();
    const runtime = new LicenseRuntime(verifier, cache, { cacheTtlMs: 60 * 60 * 1000 });

    expect(runtime.evaluate(license, "academic", 0, new Date("2026-06-07T23:00:00.000Z"))).toMatchObject({
      source: "verified",
      entitlement: { enabled: true, licenseState: "grace" },
    });
    expect(runtime.evaluate(license, "academic", 1, new Date("2026-06-07T23:30:00.000Z"))).toMatchObject({
      source: "cache",
      quota: { allowed: true, remaining: 1 },
    });
    expect(runtime.evaluate(license, "academic", 1, new Date("2026-06-08T00:00:00.000Z"))).toMatchObject({
      source: "verified",
      entitlement: { enabled: false, reason: "license_not_usable" },
      quota: { allowed: false, reason: "license_not_usable" },
    });
    expect(calls).toBe(2);
  });

  it("does not cache an invalid signature and denies its feature and quota", () => {
    const runtime = new LicenseRuntime({ verify: () => ({ valid: false, reason: "invalid_signature" }) });
    const result = runtime.evaluate(
      { ...license, signature: "tampered" },
      "academic",
      0,
      new Date("2026-05-01T00:00:00Z"),
    );

    expect(result).toMatchObject({
      verification: { valid: false, reason: "invalid_signature" },
      entitlement: { enabled: false, reason: "license_not_usable" },
      quota: { allowed: false, reason: "license_not_usable" },
    });
  });
});
