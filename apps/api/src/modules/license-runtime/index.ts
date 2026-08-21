import {
  evaluateEntitlement,
  evaluateQuota,
  type EntitlementEvaluation,
  type LicenseDocument,
  type LicenseVerifier,
  type LicenseVerificationResult,
  type QuotaEvaluation,
  verifyLicenseDocument,
} from "@hnlms/license-contracts";

export type CachedLicense = {
  document: LicenseDocument;
  verifiedAt: Date;
  cacheExpiresAt: Date;
};

export type LicenseCache = {
  get(organizationId: string, now?: Date): CachedLicense | undefined;
  set(entry: CachedLicense): void;
  delete(organizationId: string): void;
};

/** In-memory implementation for a single runtime process; production may adapt this interface to Redis. */
export class InMemoryLicenseCache implements LicenseCache {
  private readonly entries = new Map<string, CachedLicense>();

  get(organizationId: string, now = new Date()): CachedLicense | undefined {
    const entry = this.entries.get(organizationId);
    if (!entry) return undefined;
    if (entry.cacheExpiresAt <= now) {
      this.entries.delete(organizationId);
      return undefined;
    }
    return entry;
  }

  set(entry: CachedLicense): void {
    this.entries.set(entry.document.organizationId, entry);
  }

  delete(organizationId: string): void {
    this.entries.delete(organizationId);
  }
}

export type LicenseRuntimeOptions = {
  cacheTtlMs?: number;
  now?: () => Date;
};

export type LicenseRuntimeState = {
  source: "cache" | "verified";
  verification: LicenseVerificationResult;
  entitlement: EntitlementEvaluation;
  quota: QuotaEvaluation;
};

export class LicenseRuntime {
  private readonly cacheTtlMs: number;
  private readonly now: () => Date;

  constructor(
    private readonly verifier: LicenseVerifier,
    private readonly cache: LicenseCache = new InMemoryLicenseCache(),
    options: LicenseRuntimeOptions = {},
  ) {
    this.cacheTtlMs = options.cacheTtlMs ?? 5 * 60 * 1000;
    this.now = options.now ?? (() => new Date());
  }

  evaluate(document: LicenseDocument, featureKey: string, used: number, now = this.now()): LicenseRuntimeState {
    const cached = this.cache.get(document.organizationId, now);
    if (
      cached &&
      cached.document.licenseId === document.licenseId &&
      cached.document.signature === document.signature
    ) {
      return this.evaluateDocument(cached.document, featureKey, used, now, "cache");
    }

    const verification = verifyLicenseDocument(document, this.verifier);
    if (!verification.valid) {
      this.cache.delete(document.organizationId);
      return this.invalidState(document, featureKey, used, verification, now);
    }

    const cacheExpiresAt = this.cacheExpiry(document, now);
    if (cacheExpiresAt > now) this.cache.set({ document, verifiedAt: now, cacheExpiresAt });

    return this.evaluateDocument(document, featureKey, used, now, "verified");
  }

  private evaluateDocument(
    document: LicenseDocument,
    featureKey: string,
    used: number,
    now: Date,
    source: "cache" | "verified",
  ): LicenseRuntimeState {
    return {
      source,
      verification: { valid: true },
      entitlement: evaluateEntitlement(document, featureKey, now),
      quota: evaluateQuota(document, featureKey, used, now),
    };
  }

  private invalidState(
    document: LicenseDocument,
    featureKey: string,
    used: number,
    verification: LicenseVerificationResult,
    now: Date,
  ): LicenseRuntimeState {
    const unusableDocument = { ...document, startsAt: "invalid" };
    return {
      source: "verified",
      verification,
      entitlement: evaluateEntitlement(unusableDocument, featureKey, now),
      quota: evaluateQuota(unusableDocument, featureKey, used, now),
    };
  }

  private cacheExpiry(document: LicenseDocument, now: Date): Date {
    const ttlExpiresAt = new Date(now.getTime() + Math.max(0, this.cacheTtlMs));
    if (document.term === "lifetime") return ttlExpiresAt;

    const terminalTimestamp = new Date(document.graceUntil ?? document.expiresAt ?? "invalid");
    if (Number.isNaN(terminalTimestamp.getTime())) return now;
    return new Date(Math.min(ttlExpiresAt.getTime(), terminalTimestamp.getTime()));
  }
}
