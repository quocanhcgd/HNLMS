import { describe, expect, it } from "vitest";
import { NotificationWorker, NotificationWorkerError } from "../../worker/src/jobs/notifications/index.js";

describe("notification worker", () => {
  it("sends in-app and email notification deliveries", async () => {
    const worker = new NotificationWorker();
    const inApp = await worker.process({
      organizationId: "org-1",
      notificationId: "notification-1",
      deliveryId: "delivery-1",
      userId: "user-1",
      channel: "in_app",
      title: "Nhắc lịch học",
      body: "Lớp học bắt đầu lúc 18:00.",
    });
    const email = await worker.process({
      organizationId: "org-1",
      notificationId: "notification-1",
      deliveryId: "delivery-2",
      userId: "user-2",
      channel: "email",
      title: "Nhắc lịch học",
      body: "Lớp học bắt đầu lúc 18:00.",
      email: "parent@example.test",
    });

    expect(inApp).toMatchObject({ status: "sent", providerMessageId: "in-app:org-1:delivery-1" });
    expect(email).toMatchObject({ status: "sent", providerMessageId: "email:org-1:delivery-2" });
  });

  it("fails email delivery without address and increments retry count", async () => {
    const worker = new NotificationWorker();
    const result = await worker.process({
      organizationId: "org-1",
      notificationId: "notification-1",
      deliveryId: "delivery-3",
      userId: "user-3",
      channel: "email",
      title: "Thông báo",
      body: "Nội dung thông báo",
      retryCount: 2,
    });
    expect(result).toMatchObject({ status: "failed", retryCount: 3, errorMessage: "missing_email" });
  });

  it("rejects invalid notification jobs", async () => {
    const worker = new NotificationWorker();
    await expect(
      worker.process({
        organizationId: "org-1",
        notificationId: "",
        deliveryId: "delivery-4",
        userId: "user-4",
        channel: "in_app",
        title: "Thông báo",
        body: "Nội dung",
      }),
    ).rejects.toThrow(new NotificationWorkerError("invalid_job"));
  });
});
