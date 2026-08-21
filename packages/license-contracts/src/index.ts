export type LicenseTerm = "monthly" | "yearly" | "lifetime";
export type LicenseState = "draft" | "active" | "grace" | "expired" | "suspended" | "revoked";

export type LicenseEntitlement = {
  enabled: boolean;
  quota?: number;
};

export type LicenseDocument = {
  licenseId: string;
  organizationId: string;
  term: LicenseTerm;
  startsAt: string;
  expiresAt?: string;
  graceUntil?: string;
  entitlements: Record<string, LicenseEntitlement>;
  signature: string;
};

export type LicensePayload = Omit<LicenseDocument, "signature">;

export type LicenseVerificationResult =
  { valid: true } | { valid: false; reason: "invalid_signature" | "malformed_document" | "unsupported_algorithm" };

/**
 * A cryptographic boundary supplied by the deployment. The shared contract never
 * holds a private signing key and therefore cannot issue licenses.
 */
export interface LicenseVerifier {
  verify(payload: LicensePayload, signature: string): LicenseVerificationResult;
}

export type LicenseUsability = "active" | "grace" | "not_started" | "expired" | "invalid";

export type LicenseUsabilityResult = {
  state: LicenseUsability;
  usable: boolean;
  expiresAt?: Date;
  graceUntil?: Date;
};

export type EntitlementEvaluation = {
  enabled: boolean;
  reason: "enabled" | "license_not_usable" | "feature_not_entitled";
  licenseState: LicenseUsability;
};

export type QuotaEvaluation = {
  allowed: boolean;
  remaining?: number;
  reason: "allowed" | "license_not_usable" | "feature_not_entitled" | "quota_exhausted";
};

function parseTimestamp(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? undefined : timestamp;
}

export function licensePayload(document: LicenseDocument): LicensePayload {
  const { signature, ...payload } = document;
  void signature;
  return payload;
}

export function verifyLicenseDocument(document: LicenseDocument, verifier: LicenseVerifier): LicenseVerificationResult {
  return verifier.verify(licensePayload(document), document.signature);
}

export function evaluateLicenseUsability(document: LicenseDocument, now = new Date()): LicenseUsabilityResult {
  const startsAt = parseTimestamp(document.startsAt);
  if (!startsAt) return { state: "invalid", usable: false };
  if (now < startsAt) return { state: "not_started", usable: false };

  if (document.term === "lifetime") return { state: "active", usable: true };

  const expiresAt = parseTimestamp(document.expiresAt);
  if (!expiresAt) return { state: "invalid", usable: false };
  if (now < expiresAt) return { state: "active", usable: true, expiresAt };

  const graceUntil = parseTimestamp(document.graceUntil);
  if (graceUntil && now < graceUntil) return { state: "grace", usable: true, expiresAt, graceUntil };

  return { state: "expired", usable: false, expiresAt, graceUntil };
}

export function isLicenseUsable(document: LicenseDocument, now = new Date()): boolean {
  return evaluateLicenseUsability(document, now).usable;
}

export function evaluateEntitlement(
  document: LicenseDocument,
  featureKey: string,
  now = new Date(),
): EntitlementEvaluation {
  const license = evaluateLicenseUsability(document, now);
  if (!license.usable) return { enabled: false, reason: "license_not_usable", licenseState: license.state };
  if (document.entitlements[featureKey]?.enabled !== true)
    return { enabled: false, reason: "feature_not_entitled", licenseState: license.state };
  return { enabled: true, reason: "enabled", licenseState: license.state };
}

export function hasEntitlement(document: LicenseDocument, featureKey: string, now = new Date()): boolean {
  return evaluateEntitlement(document, featureKey, now).enabled;
}

export function quotaRemaining(document: LicenseDocument, featureKey: string, used: number): number | undefined {
  const quota = document.entitlements[featureKey]?.quota;
  return quota === undefined ? undefined : Math.max(0, quota - Math.max(0, used));
}

export function evaluateQuota(
  document: LicenseDocument,
  featureKey: string,
  used: number,
  now = new Date(),
): QuotaEvaluation {
  const entitlement = evaluateEntitlement(document, featureKey, now);
  if (!entitlement.enabled)
    return {
      allowed: false,
      reason: entitlement.reason === "license_not_usable" ? "license_not_usable" : "feature_not_entitled",
    };

  const remaining = quotaRemaining(document, featureKey, used);
  if (remaining === undefined) return { allowed: true, reason: "allowed" };
  if (remaining === 0) return { allowed: false, remaining, reason: "quota_exhausted" };
  return { allowed: true, remaining, reason: "allowed" };
}
