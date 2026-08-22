export type ParentLinkStatus = "active" | "revoked" | "expired";
export type ParentDelegationStatus = "active" | "revoked" | "expired";
export type ParentPermission =
  "view_schedule" | "view_progress" | "view_scores" | "view_attendance" | "view_finance" | "message_teacher";

export type CommunicationActor = { userId: string; organizationId: string };
export type ParentLink = {
  id: string;
  organizationId: string;
  studentId: string;
  parentUserId: string;
  relationship: string;
  status: ParentLinkStatus;
  linkedAt: string;
  revokedAt?: string;
  createdByUserId: string;
};
export type ParentDelegation = {
  id: string;
  organizationId: string;
  parentLinkId: string;
  permissions: ParentPermission[];
  status: ParentDelegationStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  revokedAt?: string;
  createdByUserId: string;
};
export type ParentScopedAccess = {
  parentUserId: string;
  organizationId: string;
  studentIds: Set<string>;
  permissionsByStudentId: Map<string, Set<ParentPermission>>;
};
export type CommunicationRepository = { parentLinks: ParentLink[]; parentDelegations: ParentDelegation[] };

export class CommunicationServiceError extends Error {
  constructor(
    public readonly code: "not_found" | "forbidden" | "invalid_input" | "invalid_status" | string,
    message = code,
  ) {
    super(message);
    this.name = "CommunicationServiceError";
  }
}

const text = (value: string, field: string) => {
  const normalized = value.trim();
  if (!normalized) throw new CommunicationServiceError("invalid_input", `${field}_required`);
  return normalized;
};
const asTime = (value?: string) => (value ? new Date(value).getTime() : undefined);

export class CommunicationService {
  constructor(
    private readonly repository: CommunicationRepository,
    private readonly newId: (kind: string) => string = (kind) => `${kind}-${crypto.randomUUID()}`,
  ) {}

  linkParent(
    actor: CommunicationActor,
    input: { studentId: string; parentUserId: string; relationship: string; linkedAt?: string },
  ): ParentLink {
    const existing = this.repository.parentLinks.find(
      (x) =>
        x.organizationId === actor.organizationId &&
        x.studentId === input.studentId &&
        x.parentUserId === input.parentUserId &&
        x.status === "active",
    );
    if (existing) throw new CommunicationServiceError("invalid_input", "parent_link_duplicated");
    const item: ParentLink = {
      id: this.newId("parent-link"),
      organizationId: actor.organizationId,
      studentId: input.studentId,
      parentUserId: input.parentUserId,
      relationship: text(input.relationship, "relationship"),
      status: "active",
      linkedAt: input.linkedAt ?? new Date().toISOString(),
      createdByUserId: actor.userId,
    };
    this.repository.parentLinks.push(item);
    return item;
  }

  revokeParentLink(actor: CommunicationActor, parentLinkId: string): ParentLink {
    const link = this.parentLink(actor, parentLinkId);
    if (link.status !== "active") throw new CommunicationServiceError("invalid_status", "parent_link_not_active");
    link.status = "revoked";
    link.revokedAt = new Date().toISOString();
    for (const delegation of this.repository.parentDelegations.filter(
      (x) => x.parentLinkId === link.id && x.status === "active",
    )) {
      delegation.status = "revoked";
      delegation.revokedAt = link.revokedAt;
    }
    return link;
  }

  grantDelegation(
    actor: CommunicationActor,
    input: { parentLinkId: string; permissions: ParentPermission[]; effectiveFrom?: string; effectiveTo?: string },
  ): ParentDelegation {
    const link = this.parentLink(actor, input.parentLinkId);
    if (link.status !== "active") throw new CommunicationServiceError("invalid_status", "parent_link_not_active");
    const permissions = [...new Set(input.permissions)];
    if (!permissions.length) throw new CommunicationServiceError("invalid_input", "permissions_required");
    const effectiveFrom = input.effectiveFrom ?? new Date().toISOString();
    if (input.effectiveTo && asTime(input.effectiveTo)! <= asTime(effectiveFrom)!)
      throw new CommunicationServiceError("invalid_input", "delegation_time_invalid");
    const item: ParentDelegation = {
      id: this.newId("parent-delegation"),
      organizationId: actor.organizationId,
      parentLinkId: link.id,
      permissions,
      status: "active",
      effectiveFrom,
      effectiveTo: input.effectiveTo,
      createdByUserId: actor.userId,
    };
    this.repository.parentDelegations.push(item);
    return item;
  }

  revokeDelegation(actor: CommunicationActor, delegationId: string): ParentDelegation {
    const delegation = this.delegation(actor, delegationId);
    if (delegation.status !== "active") throw new CommunicationServiceError("invalid_status", "delegation_not_active");
    delegation.status = "revoked";
    delegation.revokedAt = new Date().toISOString();
    return delegation;
  }

  expireDelegations(now = new Date()): ParentDelegation[] {
    const timestamp = now.getTime();
    const expired: ParentDelegation[] = [];
    for (const delegation of this.repository.parentDelegations) {
      if (delegation.status === "active" && delegation.effectiveTo && asTime(delegation.effectiveTo)! <= timestamp) {
        delegation.status = "expired";
        expired.push(delegation);
      }
    }
    for (const link of this.repository.parentLinks) {
      if (
        link.status === "active" &&
        !this.repository.parentDelegations.some((x) => x.parentLinkId === link.id && x.status === "active")
      ) {
        const hadDelegation = this.repository.parentDelegations.some((x) => x.parentLinkId === link.id);
        if (hadDelegation) link.status = "expired";
      }
    }
    return expired;
  }

  resolveParentScope(actor: CommunicationActor, parentUserId = actor.userId, now = new Date()): ParentScopedAccess {
    this.expireDelegations(now);
    const scope: ParentScopedAccess = {
      parentUserId,
      organizationId: actor.organizationId,
      studentIds: new Set(),
      permissionsByStudentId: new Map(),
    };
    const activeLinks = this.repository.parentLinks.filter(
      (x) => x.organizationId === actor.organizationId && x.parentUserId === parentUserId && x.status === "active",
    );
    for (const link of activeLinks) {
      const activeDelegations = this.repository.parentDelegations.filter(
        (x) =>
          x.organizationId === actor.organizationId &&
          x.parentLinkId === link.id &&
          x.status === "active" &&
          asTime(x.effectiveFrom)! <= now.getTime() &&
          (!x.effectiveTo || asTime(x.effectiveTo)! > now.getTime()),
      );
      for (const delegation of activeDelegations) {
        scope.studentIds.add(link.studentId);
        const permissions = scope.permissionsByStudentId.get(link.studentId) ?? new Set<ParentPermission>();
        for (const permission of delegation.permissions) permissions.add(permission);
        scope.permissionsByStudentId.set(link.studentId, permissions);
      }
    }
    return scope;
  }

  assertParentPermission(actor: CommunicationActor, studentId: string, permission: ParentPermission) {
    const scope = this.resolveParentScope(actor);
    if (!scope.permissionsByStudentId.get(studentId)?.has(permission))
      throw new CommunicationServiceError("forbidden", "parent_permission_required");
  }

  private parentLink(actor: CommunicationActor, id: string) {
    const item = this.repository.parentLinks.find((x) => x.id === id && x.organizationId === actor.organizationId);
    if (!item) throw new CommunicationServiceError("not_found", "parent_link_not_found");
    return item;
  }
  private delegation(actor: CommunicationActor, id: string) {
    const item = this.repository.parentDelegations.find(
      (x) => x.id === id && x.organizationId === actor.organizationId,
    );
    if (!item) throw new CommunicationServiceError("not_found", "delegation_not_found");
    return item;
  }
}
