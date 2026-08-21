import { describe, expect, it } from "vitest";
import {
  AppendOnlyAuditService,
  normalizeAuditEvent,
  type AuditEventRecord,
  type AuditEventWriter,
} from "../../apps/api/src/shared/audit";
import { DrizzleAuditEventWriter } from "../../apps/api/src/shared/audit/writer";

describe("append-only audit service", () => {
  it("normalizes and persists a complete immutable audit record", async () => {
    const persisted: AuditEventRecord[] = [];
    const writer: AuditEventWriter = {
      async insert(event) {
        persisted.push(event);
        return event;
      },
    };
    const beforeSnapshot = { status: "invited" };
    const afterSnapshot = { status: "active" };
    const service = new AppendOnlyAuditService(writer);

    const event = await service.append({
      organizationId: "org-a",
      actorUserId: "user-a",
      action: "user.activated",
      entityType: "user",
      entityId: "user-b",
      beforeSnapshot,
      afterSnapshot,
      result: "success",
      correlationId: "request-a",
      securityRelevant: true,
    });

    beforeSnapshot.status = "changed-after-audit";
    expect(persisted).toHaveLength(1);
    expect(event.beforeSnapshot).toEqual({ status: "invited" });
    expect(event.afterSnapshot).toEqual({ status: "active" });
    expect(event.actorUserId).toBe("user-a");
    expect(event.securityRelevant).toBe(true);
    expect(event.occurredAt).toBeInstanceOf(Date);
  });

  it("requires traceability fields and supplies append-only defaults", () => {
    expect(() =>
      normalizeAuditEvent({
        organizationId: "",
        action: "user.read",
        entityType: "user",
        result: "success",
        correlationId: "request-a",
      }),
    ).toThrow("audit_organization_id_required");

    expect(
      normalizeAuditEvent({
        organizationId: "org-a",
        action: "access.denied",
        entityType: "student",
        result: "denied",
        correlationId: "request-a",
      }),
    ).toMatchObject({
      actorUserId: null,
      entityId: null,
      securityRelevant: false,
      beforeSnapshot: null,
      afterSnapshot: null,
    });
  });

  it("uses only an insert operation when writing through Drizzle", async () => {
    const calls: string[] = [];
    const db = {
      insert() {
        calls.push("insert");
        return {
          values() {
            calls.push("values");
            return {
              async returning() {
                calls.push("returning");
                return [{ id: "audit-a" }];
              },
            };
          },
        };
      },
    };
    const writer = new DrizzleAuditEventWriter(db as never);

    const event = await writer.insert(
      normalizeAuditEvent({
        organizationId: "org-a",
        action: "role.updated",
        entityType: "role",
        result: "success",
        correlationId: "request-a",
      }),
    );

    expect(calls).toEqual(["insert", "values", "returning"]);
    expect(event.id).toBe("audit-a");
  });
});
