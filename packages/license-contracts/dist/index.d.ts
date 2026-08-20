export type LicenseTerm = "monthly" | "yearly" | "lifetime";
export type LicenseState = "draft" | "active" | "grace" | "expired" | "suspended" | "revoked";
export type LicenseDocument = {
    licenseId: string;
    organizationId: string;
    term: LicenseTerm;
    startsAt: string;
    expiresAt?: string;
    graceUntil?: string;
    entitlements: Record<string, {
        enabled: boolean;
        quota?: number;
    }>;
    signature: string;
};
export declare function isLicenseUsable(document: LicenseDocument, now?: Date): boolean;
export declare function hasEntitlement(document: LicenseDocument, featureKey: string, now?: Date): boolean;
export declare function quotaRemaining(document: LicenseDocument, featureKey: string, used: number): number | undefined;
