import { CommunicationService } from "../communication/communication.service";
import type { ClassOutputNotification, ClassOutputNotificationPublisher } from "./class-output-publication.service";

export class CommunicationClassOutputNotificationPublisher {
  constructor(private readonly communication: CommunicationService) {}

  readonly publish: ClassOutputNotificationPublisher = async (input: ClassOutputNotification) => {
    const actor = { userId: input.actorUserId, organizationId: input.organizationId };
    const notification = this.communication.createNotification(actor, {
      title: input.title,
      body: input.body,
      audience: { userIds: input.audienceUserIds },
      metadata: { context: input.context },
    });
    this.communication.publishNotification(actor, notification.id);
    return { notificationId: notification.id };
  };
}
