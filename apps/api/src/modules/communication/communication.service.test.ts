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
