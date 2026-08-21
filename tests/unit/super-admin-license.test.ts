import { describe, expect, it } from "vitest";
import type { AuditEventRecord, AuditEventWriter } from "../../apps/api/src/shared/audit";
import { AppendOnlyAuditService } from "../../apps/api/src/shared/audit";
import {
  InMemoryManagedLicenseRepository,
  InMemoryProductPlanRepository,
  SuperAdminLicenseService,
  type LicenseDocumentSigner,
} from "../../apps/api/src/modules/super-admin-license";

const signer: LicenseDocumentSigner = {
  sign(payload) {
    return `signed:${payload.licenseId}`;
  },
};

function createService(now = new Date("2026-08-21T00:00:00.000Z")) {
  const events: AuditEventRecord[] = [];
  const writer: AuditEventWriter = {
    async insert(event) {
      events.push(event);
      return event;
    },
  };
  const plans = new InMemoryProductPlanRepository();
  const licenses = new InMemoryManagedLicenseRepository();
  const service = new SuperAdminLicenseService(plans, licenses, signer, new AppendOnlyAuditService(writer), {
    platformOrganizationId: "platform-org",
    now: () => now,
    newId: (() => {
      let id = 0;
      return () => `id-${++id}`;
    })(),
  });
  return { service, events, plans, licenses };
}

async function createPlan(service: SuperAdminLicenseService) {
  return service.createProductPlan({
    key: "pro-yearly",
    name: "Pro yearly",
    term: "yearly",
    entitlements: [
      { featureKey: "academic", enabled: true, quota: 100 },
      { featureKey: "payroll", enabled: false },
    ],
    actorUserId: "platform-admin",
    correlationId: "plan-request",
  });
}

describe("super-admin license foundation", () => {
  it("creates immutable product-plan entitlements and audits the platform control-plane action", async () => {
    const { service, events } = createService();
    const entitlements = [{ featureKey: "academic", enabled: true, quota: 10 }];
    const plan = await service.createProductPlan({
      key: "basic-monthly",
      name: "Basic monthly",
      term: "monthly",
      entitlements,
      actorUserId: "platform-admin",
      correlationId: "plan-request",
    });
    entitlements[0].quota = 999;

    expect(plan.entitlements).toEqual([{ featureKey: "academic", enabled: true, quota: 10 }]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      organizationId: "platform-org",
      action: "product_plan.created",
      entityId: plan.id,
      securityRelevant: true,
    });
    expect(events[0].afterSnapshot).toMatchObject({ entitlements: [{ featureKey: "academic", quota: 10 }] });
  });

  it("issues a signed plan snapshot and records the organization-scoped security audit", async () => {
    const { service, events } = createService();
    const plan = await createPlan(service);
    const license = await service.issue({
      organizationId: "org-a",
      planId: plan.id,
      startsAt: new Date("2026-09-01T00:00:00Z"),
      expiresAt: new Date("2027-09-01T00:00:00Z"),
      graceUntil: new Date("2027-09-08T00:00:00Z"),
      actorUserId: "platform-admin",
      correlationId: "issue-request",
    });

    expect(license.document).toMatchObject({
      licenseId: license.id,
      organizationId: "org-a",
      term: "yearly",
      signature: `signed:${license.id}`,
      entitlements: { academic: { enabled: true, quota: 100 } },
    });
    expect(license.document.entitlements).not.toHaveProperty("featureKey");
    expect(events.at(-1)).toMatchObject({
      organizationId: "org-a",
      action: "license.issued",
      correlationId: "issue-request",
      securityRelevant: true,
    });
  });

  it("renews by issuing a replacement and preserving an auditable link to the prior license", async () => {
    const { service, events, licenses } = createService();
    const plan = await createPlan(service);
    const current = await service.issue({
      organizationId: "org-a",
      planId: plan.id,
      startsAt: new Date("2026-01-01Z"),
      expiresAt: new Date("2027-01-01Z"),
      actorUserId: "platform-admin",
      correlationId: "issue",
    });
    const replacement = await service.renew({
      licenseId: current.id,
      organizationId: "org-a",
      startsAt: new Date("2027-01-01Z"),
      expiresAt: new Date("2028-01-01Z"),
      actorUserId: "platform-admin",
      correlationId: "renew",
    });

    expect(replacement.id).not.toBe(current.id);
    expect(await licenses.findById(current.id)).toMatchObject({
      status: "renewed",
      replacedByLicenseId: replacement.id,
    });
    expect(events.at(-1)).toMatchObject({ action: "license.renewed", entityId: current.id });
    expect(events.at(-1)?.afterSnapshot).toMatchObject({
      replacement: { id: replacement.id },
      previous: { status: "renewed" },
    });
  });

  it("revokes once with a required reason and keeps the original signed document for traceability", async () => {
    const { service, events } = createService();
    const plan = await createPlan(service);
    const issued = await service.issue({
      organizationId: "org-a",
      planId: plan.id,
      startsAt: new Date("2026-01-01Z"),
      expiresAt: new Date("2027-01-01Z"),
      actorUserId: "platform-admin",
      correlationId: "issue",
    });
    const revoked = await service.revoke({
      licenseId: issued.id,
      reason: "payment default",
      actorUserId: "platform-admin",
      correlationId: "revoke",
    });

    expect(revoked).toMatchObject({
      status: "revoked",
      revokedReason: "payment default",
      document: { signature: issued.document.signature },
    });
    expect(events.at(-1)).toMatchObject({ action: "license.revoked", securityRelevant: true });
    await expect(
      service.revoke({ licenseId: issued.id, reason: "again", actorUserId: "platform-admin", correlationId: "again" }),
    ).rejects.toThrow("license_not_revocable");
  });

  it("rejects duplicate plan features and invalid commercial term boundaries", async () => {
    const { service } = createService();
    await expect(
      service.createProductPlan({
        key: "bad",
        name: "Bad",
        term: "monthly",
        entitlements: [
          { featureKey: "academic", enabled: true },
          { featureKey: "academic", enabled: true },
        ],
        actorUserId: "admin",
        correlationId: "bad",
      }),
    ).rejects.toThrow("product_plan_feature_key_duplicate");
    const plan = await createPlan(service);
    await expect(
      service.issue({
        organizationId: "org-a",
        planId: plan.id,
        startsAt: new Date("2026-01-01Z"),
        expiresAt: new Date("2026-01-01Z"),
        actorUserId: "admin",
        correlationId: "bad-dates",
      }),
    ).rejects.toThrow("license_expiry_invalid");
  });
});
