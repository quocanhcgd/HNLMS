"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLicenseUsable = isLicenseUsable;
exports.hasEntitlement = hasEntitlement;
exports.quotaRemaining = quotaRemaining;
function isLicenseUsable(document, now = new Date()) {
    if (document.term === "lifetime")
        return true;
    const expiresAt = document.expiresAt ? new Date(document.expiresAt) : undefined;
    const graceUntil = document.graceUntil ? new Date(document.graceUntil) : undefined;
    return !!expiresAt && (now < expiresAt || (!!graceUntil && now < graceUntil));
}
function hasEntitlement(document, featureKey, now = new Date()) {
    return isLicenseUsable(document, now) && document.entitlements[featureKey]?.enabled === true;
}
function quotaRemaining(document, featureKey, used) {
    const quota = document.entitlements[featureKey]?.quota;
    return quota === undefined ? undefined : Math.max(0, quota - used);
}
