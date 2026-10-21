import { randomUUID } from "node:crypto";

export type PublishableClassOutputType = "schedule" | "material" | "score" | "attendance" | "feedback" | "competency";
export type InternalClassOutputType = "worklog" | "private_note" | "internal_handoff" | "grading_queue" | "payroll";
export type ClassOutputType = PublishableClassOutputType | InternalClassOutputType;

export type ClassOutputRecord = {
  id: string; organizationId: string; classId: string; enrollmentId: string; studentId: string;
  type: ClassOutputType; status: "draft" | "confirmed" | "published" | "voided";
  publicSummary?: string; privatePayload?: Record<string, unknown>; publishedAt?: string; publishedByUserId?: string;
};

export type ClassOutputPublication = {
  id: string; organizationId: string; outputId: string; outputType: PublishableClassOutputType;
  classId: string; enrollmentId: string; studentId: string; publishedAt: string; publishedByUserId: string; notificationId: string;
};

export type ClassOutputNotification = {
  organizationId: string; actorUserId: string; audienceUserIds: string[]; title: string; body: string;
  context: { contextType: "class-output"; contextId: string; outputType: PublishableClassOutputType; classId: string; enrollmentId: string };
};

export type ClassOutputPublicationRepository = {
  findOutput(input: { organizationId: string; outputId: string }): Promise<ClassOutputRecord | null>;
  findPublication(input: { organizationId: string; outputId: string }): Promise<ClassOutputPublication | null>;
  markPublished(input: { organizationId: string; outputId: string; publishedAt: string; publishedByUserId: string }): Promise<ClassOutputRecord>;
  savePublication(input: ClassOutputPublication): Promise<ClassOutputPublication>;
};

export type ClassOutputRecipientResolver = (input: {
  organizationId: string; studentId: string; outputType: PublishableClassOutputType;
}) => Promise<string[]>;

export type ClassOutputNotificationPublisher = (input: ClassOutputNotification) => Promise<{ notificationId: string }>;
export type ClassOutputPublicationAudit = (event: { organizationId: string; actorUserId: string; action: "class-output.published"; entityId: string; after: Record<string, unknown> }) => Promise<void>;

export type ClassOutputPublicationActor = {
  userId: string; organizationId: string; canPublishClassOutput?: boolean; classIds?: ReadonlySet<string>;
};

export class ClassOutputPublicationError extends Error {
  constructor(public readonly code: "not_found" | "forbidden" | "invalid_status" | "non_publishable_output" | string, message = code) {
    super(message); this.name = "ClassOutputPublicationError";
  }
}

const publishable = new Set<PublishableClassOutputType>(["schedule", "material", "score", "attendance", "feedback", "competency"]);
const labels: Record<PublishableClassOutputType, string> = { schedule: "Lịch học", material: "Học liệu", score: "Điểm số", attendance: "Điểm danh", feedback: "Phản hồi", competency: "Hồ sơ năng lực" };

export class ClassOutputPublicationService {
  constructor(
    private readonly repository: ClassOutputPublicationRepository,
    private readonly resolveRecipients: ClassOutputRecipientResolver,
    private readonly publishNotification: ClassOutputNotificationPublisher,
    private readonly audit: ClassOutputPublicationAudit = async () => undefined,
    private readonly now: () => Date = () => new Date(),
    private readonly newId: () => string = randomUUID,
  ) {}

  async publish(actor: ClassOutputPublicationActor, outputId: string): Promise<ClassOutputPublication> {
    if (!actor.canPublishClassOutput) throw new ClassOutputPublicationError("forbidden", "class_output_publish_permission_required");
    const existing = await this.repository.findPublication({ organizationId: actor.organizationId, outputId });
    if (existing) return existing;
    const output = await this.repository.findOutput({ organizationId: actor.organizationId, outputId });
    if (!output || output.organizationId !== actor.organizationId) throw new ClassOutputPublicationError("not_found", "class_output_not_found");
    if (actor.classIds && !actor.classIds.has(output.classId)) throw new ClassOutputPublicationError("forbidden", "class_output_outside_class_scope");
    if (!publishable.has(output.type as PublishableClassOutputType)) throw new ClassOutputPublicationError("non_publishable_output", "internal_operational_output_cannot_be_published");
    if (output.status !== "confirmed") throw new ClassOutputPublicationError("invalid_status", "confirmed_class_output_required");
    const outputType = output.type as PublishableClassOutputType;
    const audienceUserIds = [...new Set(await this.resolveRecipients({ organizationId: actor.organizationId, studentId: output.studentId, outputType }))].filter(Boolean).sort();
    const publishedAt = this.now().toISOString();
    const notification = await this.publishNotification({
      organizationId: actor.organizationId, actorUserId: actor.userId, audienceUserIds, title: `${labels[outputType]} đã được công bố`,
      body: output.publicSummary?.trim() || `Có cập nhật ${labels[outputType].toLowerCase()} mới.`,
      context: { contextType: "class-output", contextId: output.id, outputType, classId: output.classId, enrollmentId: output.enrollmentId },
    });
    await this.repository.markPublished({ organizationId: actor.organizationId, outputId: output.id, publishedAt, publishedByUserId: actor.userId });
    const publication = await this.repository.savePublication({
      id: this.newId(), organizationId: actor.organizationId, outputId: output.id, outputType, classId: output.classId, enrollmentId: output.enrollmentId, studentId: output.studentId,
      publishedAt, publishedByUserId: actor.userId, notificationId: notification.notificationId,
    });
    await this.audit({ organizationId: actor.organizationId, actorUserId: actor.userId, action: "class-output.published", entityId: output.id, after: { outputType, classId: output.classId, enrollmentId: output.enrollmentId, notificationId: notification.notificationId } });
    return publication;
  }
}
