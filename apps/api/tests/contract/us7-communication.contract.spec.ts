import { describe, expect, it } from "vitest";
import { CommunicationService } from "../../src/modules/communication/communication.service.js";
import { InMemoryCommunicationRepository } from "../../src/modules/communication/in-memory-communication-repository.js";

const actor = { userId: "admin-1", organizationId: "org-1" };

describe("US7 communication contract", () => {
  it("creates conversations, resolves notification audience and creates per-channel deliveries", () => {
    const repository = new InMemoryCommunicationRepository();
    let n = 0;
    const service = new CommunicationService(repository, (kind) => `${kind}-${++n}`);
    const conversation = service.createConversation(actor, {
      type: "class",
      subject: "Thông báo lớp",
      relatedClassId: "class-1",
      memberUserIds: ["teacher-1", "student-1"],
    });
    const notification = service.createNotification(actor, {
      title: "Nhắc lịch học",
      body: "Lớp học bắt đầu lúc 18:00.",
      audience: { conversationId: conversation.id },
    });
    const deliveries = service.publishNotification(actor, notification.id, ["in_app", "email"]);

    expect(service.resolveNotificationAudience(actor, notification.audience)).toEqual([
      "admin-1",
      "student-1",
      "teacher-1",
    ]);
    expect(deliveries).toHaveLength(6);
    expect(deliveries.map((x) => `${x.userId}:${x.channel}`).sort()).toContain("student-1:email");
  });
});
