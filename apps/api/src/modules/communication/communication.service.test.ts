import { describe, expect, it } from "vitest";
import { CommunicationService } from "./communication.service";
import { InMemoryCommunicationRepository } from "./in-memory-communication-repository";

const actor = { userId: "admin-1", organizationId: "org-1" };
const parent = { userId: "parent-1", organizationId: "org-1" };
function fixture() {
  const repository = new InMemoryCommunicationRepository();
  let n = 0;
  const service = new CommunicationService(repository, (kind) => `${kind}-${++n}`);
  return { repository, service };
}

describe("Phase 9 parent delegation", () => {
  it("grants parent permissions and resolves scoped student access", () => {
    const { service } = fixture();
    const link = service.linkParent(actor, { studentId: "student-1", parentUserId: parent.userId, relationship: "Mẹ" });
    const delegation = service.grantDelegation(actor, {
      parentLinkId: link.id,
      permissions: ["view_progress", "view_scores", "view_scores"],
    });
    expect(delegation.permissions).toEqual(["view_progress", "view_scores"]);

    const scope = service.resolveParentScope(parent);
    expect([...scope.studentIds]).toEqual(["student-1"]);
    expect(scope.permissionsByStudentId.get("student-1")?.has("view_scores")).toBe(true);
    expect(() => service.assertParentPermission(parent, "student-1", "view_finance")).toThrow(
      "parent_permission_required",
    );
  });

  it("revokes links/delegations and expires scoped access", () => {
    const { service } = fixture();
    const link = service.linkParent(actor, { studentId: "student-2", parentUserId: parent.userId, relationship: "Bố" });
    const delegation = service.grantDelegation(actor, {
      parentLinkId: link.id,
      permissions: ["view_attendance"],
      effectiveFrom: "2026-01-01T00:00:00.000Z",
      effectiveTo: "2026-01-02T00:00:00.000Z",
    });

    expect(
      service
        .resolveParentScope(parent, parent.userId, new Date("2026-01-01T12:00:00.000Z"))
        .studentIds.has("student-2"),
    ).toBe(true);
    expect(service.expireDelegations(new Date("2026-01-03T00:00:00.000Z"))).toHaveLength(1);
    expect(delegation.status).toBe("expired");
    expect(
      service.resolveParentScope(parent, parent.userId, new Date("2026-01-03T00:00:00.000Z")).studentIds.size,
    ).toBe(0);

    const second = service.linkParent(actor, {
      studentId: "student-3",
      parentUserId: parent.userId,
      relationship: "Người giám hộ",
    });
    const active = service.grantDelegation(actor, { parentLinkId: second.id, permissions: ["message_teacher"] });
    service.revokeParentLink(actor, second.id);
    expect(second.status).toBe("revoked");
    expect(active.status).toBe("revoked");
  });
});

describe("Phase 9/10 conversations and notifications", () => {
  it("creates three-party parent-teacher conversations and enforces membership and moderation", () => {
    const { service, repository } = fixture();
    const link = service.linkParent(actor, {
      studentId: "student-10",
      parentUserId: parent.userId,
      relationship: "Mẹ",
    });
    service.grantDelegation(actor, { parentLinkId: link.id, permissions: ["message_teacher"] });

    const conversation = service.createThreePartyConversation(actor, {
      parentLinkId: link.id,
      teacherUserId: "teacher-1",
      subject: "Trao đổi tiến độ học viên",
      initialMessage: "Phụ huynh cần cập nhật tiến độ tuần này.",
    });
    expect(conversation).toMatchObject({ type: "parent_teacher", relatedStudentId: "student-10", status: "open" });
    expect(repository.conversationMembers.map((x) => x.role).sort()).toEqual(["moderator", "parent", "teacher"]);
    expect(repository.messages[0]).toMatchObject({ senderUserId: actor.userId, status: "sent" });

    const parentMessage = service.sendMessage(parent, conversation.id, { body: "Gia đình đã nắm lịch học." });
    expect(parentMessage.senderUserId).toBe(parent.userId);
    expect(() =>
      service.sendMessage({ ...actor, userId: "outsider" }, conversation.id, { body: "Không được gửi" }),
    ).toThrow("conversation_member_required");
    expect(() => service.moderateMessage(parent, parentMessage.id, "hidden")).toThrow("moderator_required");
    expect(service.moderateMessage(actor, parentMessage.id, "hidden").status).toBe("hidden");
  });

  it("manages member lifecycle and resolves notification audiences", () => {
    const { service } = fixture();
    const conversation = service.createConversation(actor, {
      type: "class",
      subject: "Thông báo lớp IF-2609",
      relatedClassId: "class-1",
      memberUserIds: ["teacher-1", "student-1"],
    });
    service.addConversationMember(actor, conversation.id, { userId: "parent-1", role: "parent" });
    service.changeConversationMemberStatus(actor, conversation.id, "student-1", "muted");
    service.changeConversationMemberStatus(actor, conversation.id, "teacher-1", "left");

    const notification = service.createNotification(actor, {
      title: "Nhắc lịch học",
      body: "Lớp IF-2609 học lúc 18:00 hôm nay.",
      audience: { conversationId: conversation.id, userIds: ["branch-manager-1"] },
    });
    expect(service.resolveNotificationAudience(actor, notification.audience)).toEqual([
      "admin-1",
      "branch-manager-1",
      "parent-1",
    ]);
    const deliveries = service.publishNotification(actor, notification.id, ["in_app", "email"]);
    expect(deliveries).toHaveLength(6);
    expect(deliveries.every((x) => x.status === "pending")).toBe(true);
  });
});
