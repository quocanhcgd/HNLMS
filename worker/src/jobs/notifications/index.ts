export type NotificationChannel = "in_app" | "email";
export type NotificationDeliveryStatus = "pending" | "sent" | "read" | "failed" | "cancelled";

export type NotificationDeliveryJobPayload = {
  organizationId: string;
  notificationId: string;
  deliveryId: string;
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  email?: string;
  retryCount?: number;
};

export type NotificationDeliveryResult = {
  deliveryId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  providerMessageId?: string;
  errorMessage?: string;
  sentAt?: string;
  retryCount: number;
};

export type NotificationAdapter = {
  sendInApp(payload: NotificationDeliveryJobPayload): Promise<{ providerMessageId: string }>;
  sendEmail(payload: NotificationDeliveryJobPayload): Promise<{ providerMessageId: string }>;
};

export class DeterministicNotificationAdapter implements NotificationAdapter {
  async sendInApp(payload: NotificationDeliveryJobPayload): Promise<{ providerMessageId: string }> {
    return { providerMessageId: `in-app:${payload.organizationId}:${payload.deliveryId}` };
  }

  async sendEmail(payload: NotificationDeliveryJobPayload): Promise<{ providerMessageId: string }> {
    if (!payload.email) throw new NotificationWorkerError("missing_email");
    return { providerMessageId: `email:${payload.organizationId}:${payload.deliveryId}` };
  }
}

export class NotificationWorkerError extends Error {
  constructor(public readonly code: "invalid_job" | "missing_email" | "unsupported_channel") {
    super(code);
    this.name = "NotificationWorkerError";
  }
}

export class NotificationWorker {
  constructor(private readonly adapter: NotificationAdapter = new DeterministicNotificationAdapter()) {}

  async process(payload: NotificationDeliveryJobPayload): Promise<NotificationDeliveryResult> {
    this.validate(payload);
    const retryCount = payload.retryCount ?? 0;
    try {
      const sent =
        payload.channel === "in_app" ? await this.adapter.sendInApp(payload) : await this.adapter.sendEmail(payload);
      return {
        deliveryId: payload.deliveryId,
        channel: payload.channel,
        status: "sent",
        providerMessageId: sent.providerMessageId,
        sentAt: new Date().toISOString(),
        retryCount,
      };
    } catch (error) {
      return {
        deliveryId: payload.deliveryId,
        channel: payload.channel,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "unknown_error",
        retryCount: retryCount + 1,
      };
    }
  }

  private validate(payload: NotificationDeliveryJobPayload): void {
    if (
      !payload.organizationId ||
      !payload.notificationId ||
      !payload.deliveryId ||
      !payload.userId ||
      !payload.title ||
      !payload.body
    ) {
      throw new NotificationWorkerError("invalid_job");
    }
    if (payload.channel !== "in_app" && payload.channel !== "email")
      throw new NotificationWorkerError("unsupported_channel");
  }
}
