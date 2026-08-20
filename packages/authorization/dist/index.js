"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasScope = hasScope;
exports.canAccessResource = canAccessResource;
function hasScope(context, grant) {
    if (grant.userId !== context.userId)
        return false;
    const now = context.now ?? new Date();
    if (grant.effectiveFrom && new Date(grant.effectiveFrom) > now)
        return false;
    if (grant.effectiveTo && new Date(grant.effectiveTo) <= now)
        return false;
    if (grant.kind === "organization")
        return grant.resourceId === context.organizationId;
    if (grant.kind === "branch")
        return context.branchIds.has(grant.resourceId);
    if (grant.kind === "class")
        return context.classIds.has(grant.resourceId);
    return context.studentIds.has(grant.resourceId);
}
function canAccessResource(context, resource) {
    if (resource.organizationId !== context.organizationId)
        return false;
    if (resource.branchId && !context.branchIds.has(resource.branchId))
        return false;
    if (resource.classId && !context.classIds.has(resource.classId))
        return false;
    if (resource.studentId && !context.studentIds.has(resource.studentId))
        return false;
    return true;
}
