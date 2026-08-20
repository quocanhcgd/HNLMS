export type LicenseTerm = "monthly" | "yearly" | "lifetime";
export type LicenseState = "draft" | "active" | "grace" | "expired" | "suspended" | "revoked";
export type LicenseDocument = {
  licenseId: string;
  organizationId: string;
  term: LicenseTerm;
  startsAt: string;
  expiresAt?: string;
  graceUntil?: string;
  entitlements: Record<string, { enabled: boolean; quota?: number }>;
  signature: string;
};

export function isLicenseUsable(document: LicenseDocument, now = new Date()): boolean {
  if (document.term === "lifetime") return true;
  const expiresAt = document.expiresAt ? new Date(document.expiresAt) : undefined;
  const graceUntil = document.graceUntil ? new Date(document.graceUntil) : undefined;
  return !!expiresAt && (now < expiresAt || (!!graceUntil && now < graceUntil));
}

export function hasEntitlement(document: LicenseDocument, featureKey: string, now = new Date()): boolean {
  return isLicenseUsable(document, now) && document.entitlements[featureKey]?.enabled === true;
}

export function quotaRemaining(document: LicenseDocument, featureKey: string, used: number): number | undefined {
  const quota = document.entitlements[featureKey]?.quota;
  return quota === undefined ? undefined : Math.max(0, quota - used);
}
