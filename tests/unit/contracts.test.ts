import { describe, expect, it } from "vitest";
import { canAccessResource, hasScope } from "@hnlms/authorization";
import { resolveEffectiveState } from "@hnlms/module-sdk";
import { hasEntitlement, isLicenseUsable, quotaRemaining } from "@hnlms/license-contracts";
import { requiredThemeTokenKeys, validateRequiredTokens } from "@hnlms/theme-presets";
import { parseAssessmentAnswer, parseLessonDocument } from "@hnlms/domain-contracts";

describe("shared contract invariants", () => {
  it("rejects cross-organization and cross-branch access", () => {
    const context = {
      userId: "u1",
      organizationId: "org-a",
      branchIds: new Set(["branch-a"]),
      classIds: new Set<string>(),
      studentIds: new Set<string>(),
    };
    expect(canAccessResource(context, { organizationId: "org-b" })).toBe(false);
    expect(canAccessResource(context, { organizationId: "org-a", branchId: "branch-b" })).toBe(false);
    expect(hasScope(context, { userId: "u1", kind: "branch", resourceId: "branch-a" })).toBe(true);
  });

  it("disables a module when entitlement or dependency is missing", () => {
    const state = resolveEffectiveState(
      { key: "assessment", version: "1", dependencies: ["academic"], licenseFeatureKey: "assessment", permissions: [] },
      new Set(["assessment"]),
      new Set(["assessment"]),
      new Set(),
      new Set(),
    );
    expect(state.effectiveEnabled).toBe(false);
    expect(state.reason).toBe("missing_entitlement");
  });

  it("supports lifetime and grace entitlement rules", () => {
    const license = {
      licenseId: "l1",
      organizationId: "org-a",
      term: "yearly" as const,
      startsAt: "2026-01-01T00:00:00Z",
      expiresAt: "2026-06-01T00:00:00Z",
      graceUntil: "2026-06-08T00:00:00Z",
      entitlements: { academic: { enabled: true, quota: 100 } },
      signature: "sig",
    };
    expect(isLicenseUsable(license, new Date("2026-06-05T00:00:00Z"))).toBe(true);
    expect(hasEntitlement(license, "academic", new Date("2026-06-05T00:00:00Z"))).toBe(true);
    expect(quotaRemaining(license, "academic", 25)).toBe(75);
  });

  it("validates lesson and answer schemas", () => {
    expect(() =>
      parseLessonDocument({ id: "lesson", contentId: "content", schemaVersion: 1, locale: "vi", blocks: [] }),
    ).not.toThrow();
    expect(() =>
      parseAssessmentAnswer({ attemptId: "attempt", itemId: "item", saveSequence: 1, payload: { value: "A" } }),
    ).not.toThrow();
    expect(() =>
      parseAssessmentAnswer({ attemptId: "attempt", itemId: "item", saveSequence: 0, payload: {} }),
    ).toThrow();
  });

  it("reports missing semantic theme tokens", () => {
    expect(validateRequiredTokens({ primary: "#fff" })).toContain("background");
    expect(validateRequiredTokens({})).toHaveLength(requiredThemeTokenKeys.length);
  });
});
