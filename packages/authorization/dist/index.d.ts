export type ScopeKind = "organization" | "branch" | "class" | "student";
export type ScopeGrant = {
    userId: string;
    kind: ScopeKind;
    resourceId: string;
    effectiveFrom?: string;
    effectiveTo?: string;
};
export type AuthorizationContext = {
    userId: string;
    organizationId: string;
    branchIds: ReadonlySet<string>;
    classIds: ReadonlySet<string>;
    studentIds: ReadonlySet<string>;
    now?: Date;
};
export declare function hasScope(context: AuthorizationContext, grant: ScopeGrant): boolean;
export declare function canAccessResource(context: AuthorizationContext, resource: {
    organizationId: string;
    branchId?: string;
    classId?: string;
    studentId?: string;
}): boolean;
