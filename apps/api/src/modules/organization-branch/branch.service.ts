import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { branches } from "./schema";

export type Branch = InferSelectModel<typeof branches>;
export type BranchCreateInput = Pick<
  InferInsertModel<typeof branches>,
  "code" | "name" | "address" | "phone" | "email" | "managerUserId" | "openedOn"
> & { organizationId: string };
export type BranchUpdateInput = Partial<
  Pick<BranchCreateInput, "code" | "name" | "address" | "phone" | "email" | "managerUserId" | "openedOn">
> & Partial<Pick<Branch, "status" | "closedOn">>;
export type BranchStatus = Branch["status"];

export type BranchActor = {
  userId: string;
  organizationId: string;
  /** Omit for an organization-wide actor; otherwise only these branches are visible. */
  branchIds?: ReadonlySet<string>;
};

export type BranchRepository = {
  list(input: { organizationId: string; branchIds?: ReadonlySet<string>; includeArchived?: boolean }): Promise<Branch[]>;
  findById(input: { organizationId: string; branchId: string }): Promise<Branch | null>;
  create(input: BranchCreateInput): Promise<Branch>;
  update(input: { organizationId: string; branchId: string; changes: BranchUpdateInput }): Promise<Branch>;
};

export type BranchAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: "created" | "updated" | "status-changed";
  entityId: string;
  before?: Branch;
  after: Branch;
}) => Promise<void>;

export type BranchErrorCode = "forbidden" | "not_found" | "invalid_status" | "invalid_input";

export class BranchServiceError extends Error {
  constructor(public readonly code: BranchErrorCode, message: string = code) {
    super(message);
    this.name = "BranchServiceError";
  }
}

export class BranchService {
  constructor(
    private readonly repository: BranchRepository,
    private readonly audit: BranchAudit = async () => undefined,
  ) {}

  list(actor: BranchActor, options: { includeArchived?: boolean } = {}) {
    return this.repository.list({
      organizationId: actor.organizationId,
      branchIds: actor.branchIds,
      includeArchived: options.includeArchived,
    });
  }

  async get(actor: BranchActor, branchId: string) {
    const branch = await this.repository.findById({ organizationId: actor.organizationId, branchId });
    return this.requireAccessible(actor, branch);
  }

  async create(actor: BranchActor, input: Omit<BranchCreateInput, "organizationId">) {
    this.validateText(input.code, "code");
    this.validateText(input.name, "name");
    const branch = await this.repository.create({
      ...input,
      organizationId: actor.organizationId,
      code: input.code.trim(),
      name: input.name.trim(),
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "created",
      entityId: branch.id,
      after: branch,
    });
    return branch;
  }

  async update(actor: BranchActor, branchId: string, changes: BranchUpdateInput) {
    const before = await this.get(actor, branchId);
    if (before.status === "archived") {
      throw new BranchServiceError("invalid_status", "archived branches cannot be updated");
    }
    if (changes.code !== undefined) this.validateText(changes.code, "code");
    if (changes.name !== undefined) this.validateText(changes.name, "name");
    const branch = await this.repository.update({
      organizationId: actor.organizationId,
      branchId,
      changes: {
        ...changes,
        ...(changes.code === undefined ? {} : { code: changes.code.trim() }),
        ...(changes.name === undefined ? {} : { name: changes.name.trim() }),
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "updated",
      entityId: branch.id,
      before,
      after: branch,
    });
    return branch;
  }

  /** Delete is intentionally a soft delete: branch history must remain available. */
  async remove(actor: BranchActor, branchId: string) {
    return this.changeStatus(actor, branchId, "archived");
  }

  async activate(actor: BranchActor, branchId: string) {
    return this.changeStatus(actor, branchId, "active");
  }

  async deactivate(actor: BranchActor, branchId: string) {
    return this.changeStatus(actor, branchId, "inactive");
  }

  async archive(actor: BranchActor, branchId: string) {
    return this.changeStatus(actor, branchId, "archived");
  }

  private async changeStatus(actor: BranchActor, branchId: string, status: BranchStatus) {
    const before = await this.get(actor, branchId);
    if (before.status === "archived" && status !== "archived") {
      throw new BranchServiceError("invalid_status", "archived branches cannot be reactivated");
    }
    if (before.status === status) return before;
    const branch = await this.repository.update({
      organizationId: actor.organizationId,
      branchId,
      changes: {
        status,
        closedOn: status === "active" ? null : before.closedOn ?? new Date().toISOString().slice(0, 10),
      },
    });
    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "status-changed",
      entityId: branch.id,
      before,
      after: branch,
    });
    return branch;
  }

  private requireAccessible(actor: BranchActor, branch: Branch | null): Branch {
    if (!branch) throw new BranchServiceError("not_found", "branch not found");
    if (branch.organizationId !== actor.organizationId) {
      throw new BranchServiceError("not_found", "branch not found");
    }
    if (actor.branchIds && !actor.branchIds.has(branch.id)) {
      throw new BranchServiceError("forbidden", "branch is outside the actor scope");
    }
    return branch;
  }

  private validateText(value: string, field: string) {
    if (!value.trim()) throw new BranchServiceError("invalid_input", `${field} is required`);
  }
}

