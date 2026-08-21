export type AssignmentScopeKind = "organization" | "branch" | "class" | "student";
export type AssignmentPermission = { resource: string; action: string };
export type AssignmentRole = { id: string; key: string; name: string; permissions: AssignmentPermission[] };
export type AssignmentGrant = {
  id: string;
  userId: string;
  organizationId: string;
  kind: AssignmentScopeKind;
  resourceId: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type AssignmentRepository = {
  listRoles(organizationId: string): Promise<AssignmentRole[]>;
  listUserRoleIds(organizationId: string, userId: string): Promise<string[]>;
  replaceUserRoles(input: { organizationId: string; userId: string; roleIds: string[] }): Promise<void>;
  listScopeGrants(input: { organizationId: string; userId: string }): Promise<AssignmentGrant[]>;
  createScopeGrant(input: Omit<AssignmentGrant, "id">): Promise<AssignmentGrant>;
  revokeScopeGrant(input: { organizationId: string; userId: string; grantId: string; effectiveTo: Date }): Promise<void>;
};

export type AssignmentAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "roles.replaced" | "scope-grant.created" | "scope-grant.revoked";
  entityId: string;
  before?: unknown;
  after?: unknown;
}) => Promise<void>;

export type AssignmentActor = { userId: string; organizationId: string };
export type AssignmentMutationErrorCode = "forbidden" | "invalid_scope" | "not_found";

export class AssignmentMutationError extends Error {
  constructor(public readonly code: AssignmentMutationErrorCode, message = code) {
    super(message);
    this.name = "AssignmentMutationError";
  }
}

export class AssignmentService {
  constructor(
    private readonly repository: AssignmentRepository,
    private readonly audit: AssignmentAudit = async () => undefined,
  ) {}

  listRoles(actor: AssignmentActor) {
    return this.repository.listRoles(actor.organizationId);
  }

  async getUserAssignments(actor: AssignmentActor, userId: string) {
    this.assertOrganization(actor, actor.organizationId);
    const [roleIds, scopeGrants] = await Promise.all([
      this.repository.listUserRoleIds(actor.organizationId, userId),
      this.repository.listScopeGrants({ organizationId: actor.organizationId, userId }),
    ]);
    return { roleIds, scopeGrants };
  }

  async replaceUserRoles(actor: AssignmentActor, input: { userId: string; roleIds: string[] }) {
    this.assertOrganization(actor, actor.organizationId);
    const previous = await this.repository.listUserRoleIds(actor.organizationId, input.userId);
    await this.repository.replaceUserRoles({ organizationId: actor.organizationId, ...input });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "roles.replaced",
      entityId: input.userId,
      before: previous,
      after: input.roleIds,
    });
  }

  async createScopeGrant(
    actor: AssignmentActor,
    input: {
      userId: string;
      organizationId: string;
      kind: AssignmentScopeKind;
      resourceId: string;
      effectiveFrom?: Date;
      effectiveTo?: Date | null;
    },
  ) {
    this.assertOrganization(actor, input.organizationId);
    if (input.effectiveTo && input.effectiveFrom && input.effectiveTo <= input.effectiveFrom) {
      throw new AssignmentMutationError("invalid_scope", "effectiveTo must be after effectiveFrom");
    }
    const grant = await this.repository.createScopeGrant({
      ...input,
      effectiveFrom: input.effectiveFrom ?? new Date(),
      effectiveTo: input.effectiveTo ?? null,
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "scope-grant.created",
      entityId: grant.id,
      after: grant,
    });
    return grant;
  }

  async revokeScopeGrant(actor: AssignmentActor, input: { userId: string; grantId: string }) {
    this.assertOrganization(actor, actor.organizationId);
    const effectiveTo = new Date();
    await this.repository.revokeScopeGrant({ ...input, organizationId: actor.organizationId, effectiveTo });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "scope-grant.revoked",
      entityId: input.grantId,
      after: { effectiveTo },
    });
  }

  private assertOrganization(actor: AssignmentActor, organizationId: string) {
    if (actor.organizationId !== organizationId) {
      throw new AssignmentMutationError("forbidden", "organization scope mismatch");
    }
  }
}
