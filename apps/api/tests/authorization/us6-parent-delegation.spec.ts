import { describe, expect, it } from "vitest";
import { CommunicationService } from "../../src/modules/communication/communication.service.js";
import { InMemoryCommunicationRepository } from "../../src/modules/communication/in-memory-communication-repository.js";

const admin = { userId: "admin-1", organizationId: "org-1" };
const parent = { userId: "parent-1", organizationId: "org-1" };
const outsider = { userId: "outsider-1", organizationId: "org-1" };

function fixture() {
  const repository = new InMemoryCommunicationRepository();
  let n = 0;
  const service = new CommunicationService(repository, (kind) => `${kind}-${++n}`);
  return { service };
}

describe("US6 parent delegation authorization", () => {
  it("requires delegated message permission before parent can join three-party exchanges", () => {
    const { service } = fixture();
    const link = service.linkParent(admin, { studentId: "student-1", parentUserId: parent.userId, relationship: "Mẹ" });
    service.grantDelegation(admin, { parentLinkId: link.id, permissions: ["view_progress", "message_teacher"] });

    expect(() => service.assertParentPermission(parent, "student-1", "message_teacher")).not.toThrow();
    expect(() => service.assertParentPermission(parent, "student-1", "view_finance")).toThrow(
      "parent_permission_required",
    );

    const conversation = service.createThreePartyConversation(admin, {
      parentLinkId: link.id,
      teacherUserId: "teacher-1",
      subject: "Trao đổi học tập",
    });
    expect(() => service.sendMessage(parent, conversation.id, { body: "Gia đình đã nhận thông tin." })).not.toThrow();
    expect(() => service.sendMessage(outsider, conversation.id, { body: "Không thuộc cuộc trao đổi." })).toThrow(
      "conversation_member_required",
    );
  });
});
