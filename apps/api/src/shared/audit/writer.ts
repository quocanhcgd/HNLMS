import { auditEvents } from "../../database/schema/identity-access";
import type { AuditEventRecord, AuditEventWriter } from "./service";

export type AuditInsertValues = {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  result: string;
  correlationId: string;
  occurredAt: Date;
  securityRelevant: boolean;
};

export type AuditDatabase = {
  insert(table: typeof auditEvents): {
    values(value: AuditInsertValues): {
      returning(): Promise<unknown[]>;
    };
  };
};

export class DrizzleAuditEventWriter implements AuditEventWriter {
  constructor(private readonly db: AuditDatabase) {}

  async insert(event: AuditEventRecord): Promise<AuditEventRecord> {
    const [inserted] = await this.db
      .insert(auditEvents)
      .values({
        organizationId: event.organizationId,
        actorUserId: event.actorUserId ?? null,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId ?? null,
        beforeSnapshot: event.beforeSnapshot ?? null,
        afterSnapshot: event.afterSnapshot ?? null,
        result: event.result,
        correlationId: event.correlationId,
        occurredAt: event.occurredAt,
        securityRelevant: event.securityRelevant,
      })
      .returning();

    if (!inserted) throw new Error("audit_insert_failed");
    return { ...event, id: (inserted as { id?: string }).id };
  }
}
