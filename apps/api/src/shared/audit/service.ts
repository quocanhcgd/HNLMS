import type { auditEvents } from "../../database/schema/identity-access";

export type AuditEventResult = "success" | "failure" | "denied";
export type AuditSnapshot = Record<string, unknown> | null;

export type AuditEventInput = {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeSnapshot?: AuditSnapshot;
  afterSnapshot?: AuditSnapshot;
  result: AuditEventResult;
  correlationId: string;
  occurredAt?: Date;
  securityRelevant?: boolean;
};

export type AuditEventRecord = Omit<AuditEventInput, "occurredAt"> & {
  id?: string;
  occurredAt: Date;
  securityRelevant: boolean;
};

export type AuditEventsTable = typeof auditEvents;

export interface AuditEventWriter {
  insert(event: AuditEventRecord): Promise<AuditEventRecord>;
}

function assertNonEmpty(value: string, field: string): void {
  if (!value.trim()) throw new Error(`audit_${field}_required`);
}

function cloneSnapshot(snapshot: AuditSnapshot | undefined): AuditSnapshot {
  if (snapshot === undefined || snapshot === null) return snapshot ?? null;
  return structuredClone(snapshot);
}

export function normalizeAuditEvent(input: AuditEventInput): AuditEventRecord {
  assertNonEmpty(input.organizationId, "organization_id");
  assertNonEmpty(input.action, "action");
  assertNonEmpty(input.entityType, "entity_type");
  assertNonEmpty(input.correlationId, "correlation_id");

  if (!input.result) throw new Error("audit_result_required");

  return {
    ...input,
    actorUserId: input.actorUserId ?? null,
    entityId: input.entityId ?? null,
    beforeSnapshot: cloneSnapshot(input.beforeSnapshot),
    afterSnapshot: cloneSnapshot(input.afterSnapshot),
    occurredAt: input.occurredAt ?? new Date(),
    securityRelevant: input.securityRelevant ?? false,
  };
}

export class AppendOnlyAuditService {
  constructor(private readonly writer: AuditEventWriter) {}

  async append(input: AuditEventInput): Promise<AuditEventRecord> {
    return this.writer.insert(normalizeAuditEvent(input));
  }
}
