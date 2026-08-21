import { randomUUID } from "node:crypto";
import type { LicenseDocument, LicenseEntitlement, LicensePayload, LicenseTerm } from "@hnlms/license-contracts";
import type { AppendOnlyAuditService } from "../../shared/audit";

export type ProductPlanEntitlement = LicenseEntitlement & { featureKey: string };

export type ProductPlan = {
  id: string;
  key: string;
  name: string;
  term: LicenseTerm;
  entitlements: readonly ProductPlanEntitlement[];
  createdAt: Date;
};

export type LicenseLifecycleStatus = "active" | "revoked" | "renewed";

export type ManagedLicense = {
  id: string;
  planId: string;
  document: LicenseDocument;
  status: LicenseLifecycleStatus;
  issuedAt: Date;
  renewedAt?: Date;
  revokedAt?: Date;
  revokedReason?: string;
  replacedByLicenseId?: string;
};

export interface ProductPlanRepository {
  findById(id: string): Promise<ProductPlan | undefined>;
  findByKey(key: string): Promise<ProductPlan | undefined>;
  insert(plan: ProductPlan): Promise<ProductPlan>;
}

export interface ManagedLicenseRepository {
  findById(id: string): Promise<ManagedLicense | undefined>;
  insert(license: ManagedLicense): Promise<ManagedLicense>;
  update(license: ManagedLicense): Promise<ManagedLicense>;
}

/** The control plane owns this boundary; private signing material is never exposed to tenant runtime. */
export interface LicenseDocumentSigner {
  sign(payload: LicensePayload): string;
}

export type CreateProductPlanInput = {
  id?: string;
  key: string;
  name: string;
  term: LicenseTerm;
  entitlements: readonly ProductPlanEntitlement[];
  actorUserId: string;
  correlationId: string;
};

export type IssueLicenseInput = {
  licenseId?: string;
  organizationId: string;
  planId: string;
  startsAt: Date;
  expiresAt?: Date;
  graceUntil?: Date;
  actorUserId: string;
  correlationId: string;
};

export type RenewLicenseInput = Omit<IssueLicenseInput, "planId"> & {
  licenseId: string;
};

export type RevokeLicenseInput = {
  licenseId: string;
  reason: string;
  actorUserId: string;
  correlationId: string;
};

export type SuperAdminLicenseServiceOptions = {
  now?: () => Date;
  newId?: () => string;
  /** Audit service requires an organization scope; this is the platform control-plane organization. */
  platformOrganizationId: string;
};

function requireText(value: string, code: string): void {
  if (!value.trim()) throw new Error(code);
}

function cloneEntitlements(entitlements: readonly ProductPlanEntitlement[]): ProductPlanEntitlement[] {
  return entitlements.map((entitlement) => ({ ...entitlement }));
}

function planSnapshot(plan: ProductPlan): Record<string, unknown> {
  return {
    id: plan.id,
    key: plan.key,
    name: plan.name,
    term: plan.term,
    entitlements: cloneEntitlements(plan.entitlements),
  };
}

function licenseSnapshot(license: ManagedLicense): Record<string, unknown> {
  return {
    id: license.id,
    planId: license.planId,
    organizationId: license.document.organizationId,
    term: license.document.term,
    startsAt: license.document.startsAt,
    expiresAt: license.document.expiresAt,
    graceUntil: license.document.graceUntil,
    entitlements: structuredClone(license.document.entitlements),
    status: license.status,
    issuedAt: license.issuedAt.toISOString(),
    renewedAt: license.renewedAt?.toISOString(),
    revokedAt: license.revokedAt?.toISOString(),
    revokedReason: license.revokedReason,
    replacedByLicenseId: license.replacedByLicenseId,
  };
}

function validateEntitlements(entitlements: readonly ProductPlanEntitlement[]): void {
  if (entitlements.length === 0) throw new Error("product_plan_entitlements_required");
  const keys = new Set<string>();
  for (const entitlement of entitlements) {
    requireText(entitlement.featureKey, "product_plan_feature_key_required");
    if (keys.has(entitlement.featureKey)) throw new Error("product_plan_feature_key_duplicate");
    keys.add(entitlement.featureKey);
    if (entitlement.quota !== undefined && (!Number.isInteger(entitlement.quota) || entitlement.quota < 0))
      throw new Error("product_plan_quota_invalid");
  }
}

function validateTermDates(term: LicenseTerm, startsAt: Date, expiresAt?: Date, graceUntil?: Date): void {
  if (Number.isNaN(startsAt.getTime())) throw new Error("license_starts_at_invalid");
  if (term === "lifetime") {
    if (expiresAt || graceUntil) throw new Error("lifetime_license_dates_not_allowed");
    return;
  }
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= startsAt)
    throw new Error("license_expiry_invalid");
  if (graceUntil && (Number.isNaN(graceUntil.getTime()) || graceUntil <= expiresAt))
    throw new Error("license_grace_invalid");
}

export class InMemoryProductPlanRepository implements ProductPlanRepository {
  private readonly plans = new Map<string, ProductPlan>();

  async findById(id: string): Promise<ProductPlan | undefined> {
    const plan = this.plans.get(id);
    return plan && { ...plan, entitlements: cloneEntitlements(plan.entitlements), createdAt: new Date(plan.createdAt) };
  }

  async findByKey(key: string): Promise<ProductPlan | undefined> {
    return (
      await Promise.all(
        [...this.plans.values()].map(async (plan) => (plan.key === key ? this.findById(plan.id) : undefined)),
      )
    ).find(Boolean);
  }

  async insert(plan: ProductPlan): Promise<ProductPlan> {
    if (this.plans.has(plan.id)) throw new Error("product_plan_id_conflict");
    if (await this.findByKey(plan.key)) throw new Error("product_plan_key_conflict");
    this.plans.set(plan.id, {
      ...plan,
      entitlements: cloneEntitlements(plan.entitlements),
      createdAt: new Date(plan.createdAt),
    });
    return (await this.findById(plan.id))!;
  }
}

export class InMemoryManagedLicenseRepository implements ManagedLicenseRepository {
  private readonly licenses = new Map<string, ManagedLicense>();

  async findById(id: string): Promise<ManagedLicense | undefined> {
    const license = this.licenses.get(id);
    return license && structuredClone(license);
  }

  async insert(license: ManagedLicense): Promise<ManagedLicense> {
    if (this.licenses.has(license.id)) throw new Error("license_id_conflict");
    this.licenses.set(license.id, structuredClone(license));
    return (await this.findById(license.id))!;
  }

  async update(license: ManagedLicense): Promise<ManagedLicense> {
    if (!this.licenses.has(license.id)) throw new Error("license_not_found");
    this.licenses.set(license.id, structuredClone(license));
    return (await this.findById(license.id))!;
  }
}

export class SuperAdminLicenseService {
  private readonly now: () => Date;
  private readonly newId: () => string;

  constructor(
    private readonly plans: ProductPlanRepository,
    private readonly licenses: ManagedLicenseRepository,
    private readonly signer: LicenseDocumentSigner,
    private readonly audit: AppendOnlyAuditService,
    private readonly options: SuperAdminLicenseServiceOptions,
  ) {
    requireText(options.platformOrganizationId, "platform_organization_id_required");
    this.now = options.now ?? (() => new Date());
    this.newId = options.newId ?? randomUUID;
  }

  async createProductPlan(input: CreateProductPlanInput): Promise<ProductPlan> {
    requireText(input.key, "product_plan_key_required");
    requireText(input.name, "product_plan_name_required");
    requireText(input.actorUserId, "license_actor_required");
    requireText(input.correlationId, "license_correlation_id_required");
    validateEntitlements(input.entitlements);
    if (await this.plans.findByKey(input.key)) throw new Error("product_plan_key_conflict");

    const plan: ProductPlan = {
      id: input.id ?? this.newId(),
      key: input.key,
      name: input.name,
      term: input.term,
      entitlements: cloneEntitlements(input.entitlements),
      createdAt: this.now(),
    };
    const saved = await this.plans.insert(plan);
    await this.audit.append({
      organizationId: this.options.platformOrganizationId,
      actorUserId: input.actorUserId,
      action: "product_plan.created",
      entityType: "product_plan",
      entityId: saved.id,
      afterSnapshot: planSnapshot(saved),
      result: "success",
      correlationId: input.correlationId,
      securityRelevant: true,
    });
    return saved;
  }

  async issue(input: IssueLicenseInput): Promise<ManagedLicense> {
    const plan = await this.requirePlan(input.planId);
    const license = this.createLicense(plan, input);
    const saved = await this.licenses.insert(license);
    await this.auditLicense("license.issued", saved, input.actorUserId, input.correlationId);
    return saved;
  }

  async renew(input: RenewLicenseInput): Promise<ManagedLicense> {
    const existing = await this.requireLicense(input.licenseId);
    if (existing.status !== "active") throw new Error("license_not_renewable");
    if (existing.document.organizationId !== input.organizationId) throw new Error("license_organization_mismatch");

    const plan = await this.requirePlan(existing.planId);
    const { licenseId: previousLicenseId, ...renewal } = input;
    void previousLicenseId;
    const replacement = this.createLicense(plan, { ...renewal, planId: plan.id });
    const savedReplacement = await this.licenses.insert(replacement);
    const renewed = await this.licenses.update({
      ...existing,
      status: "renewed",
      renewedAt: this.now(),
      replacedByLicenseId: savedReplacement.id,
    });
    await this.audit.append({
      organizationId: existing.document.organizationId,
      actorUserId: input.actorUserId,
      action: "license.renewed",
      entityType: "license",
      entityId: renewed.id,
      beforeSnapshot: licenseSnapshot(existing),
      afterSnapshot: { previous: licenseSnapshot(renewed), replacement: licenseSnapshot(savedReplacement) },
      result: "success",
      correlationId: input.correlationId,
      securityRelevant: true,
    });
    return savedReplacement;
  }

  async revoke(input: RevokeLicenseInput): Promise<ManagedLicense> {
    requireText(input.reason, "license_revoke_reason_required");
    requireText(input.actorUserId, "license_actor_required");
    requireText(input.correlationId, "license_correlation_id_required");
    const existing = await this.requireLicense(input.licenseId);
    if (existing.status !== "active") throw new Error("license_not_revocable");

    const revoked = await this.licenses.update({
      ...existing,
      status: "revoked",
      revokedAt: this.now(),
      revokedReason: input.reason,
    });
    await this.audit.append({
      organizationId: revoked.document.organizationId,
      actorUserId: input.actorUserId,
      action: "license.revoked",
      entityType: "license",
      entityId: revoked.id,
      beforeSnapshot: licenseSnapshot(existing),
      afterSnapshot: licenseSnapshot(revoked),
      result: "success",
      correlationId: input.correlationId,
      securityRelevant: true,
    });
    return revoked;
  }

  private createLicense(plan: ProductPlan, input: IssueLicenseInput): ManagedLicense {
    requireText(input.organizationId, "license_organization_id_required");
    requireText(input.actorUserId, "license_actor_required");
    requireText(input.correlationId, "license_correlation_id_required");
    validateTermDates(plan.term, input.startsAt, input.expiresAt, input.graceUntil);
    const entitlements = Object.fromEntries(
      plan.entitlements.map(({ featureKey, ...entitlement }) => [featureKey, { ...entitlement }]),
    );
    const payload: LicensePayload = {
      licenseId: input.licenseId ?? this.newId(),
      organizationId: input.organizationId,
      term: plan.term,
      startsAt: input.startsAt.toISOString(),
      ...(input.expiresAt ? { expiresAt: input.expiresAt.toISOString() } : {}),
      ...(input.graceUntil ? { graceUntil: input.graceUntil.toISOString() } : {}),
      entitlements,
    };
    const document: LicenseDocument = { ...payload, signature: this.signer.sign(payload) };
    return { id: payload.licenseId, planId: plan.id, document, status: "active", issuedAt: this.now() };
  }

  private async requirePlan(id: string): Promise<ProductPlan> {
    const plan = await this.plans.findById(id);
    if (!plan) throw new Error("product_plan_not_found");
    return plan;
  }

  private async requireLicense(id: string): Promise<ManagedLicense> {
    const license = await this.licenses.findById(id);
    if (!license) throw new Error("license_not_found");
    return license;
  }

  private async auditLicense(
    action: string,
    license: ManagedLicense,
    actorUserId: string,
    correlationId: string,
  ): Promise<void> {
    await this.audit.append({
      organizationId: license.document.organizationId,
      actorUserId,
      action,
      entityType: "license",
      entityId: license.id,
      afterSnapshot: licenseSnapshot(license),
      result: "success",
      correlationId,
      securityRelevant: true,
    });
  }
}
