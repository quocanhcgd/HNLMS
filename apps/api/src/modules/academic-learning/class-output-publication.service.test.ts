import { describe, expect, it, vi } from "vitest";
import { ClassOutputPublicationError, ClassOutputPublicationService, type ClassOutputNotification, type ClassOutputRecord } from "./class-output-publication.service";
import { InMemoryClassOutputPublicationRepository } from "./in-memory-class-output-publication-repository";

const actor = { userId: "academic-1", organizationId: "org-1", canPublishClassOutput: true, classIds: new Set(["class-1"]) };
function output(overrides: Partial<ClassOutputRecord> = {}): ClassOutputRecord {
  return { id: "output-1", organizationId: "org-1", classId: "class-1", enrollmentId: "enrollment-1", studentId: "student-1", type: "score", status: "confirmed", publicSummary: "Điểm bài kiểm tra đã có.", privatePayload: { reviewerNote: "Không được đưa vào notification", worklogId: "worklog-1" }, ...overrides };
}

describe("T097 class-output publication policy", () => {
  it("publishes confirmed output once and sends a context-only notification", async () => {
    const repository = new InMemoryClassOutputPublicationRepository(); repository.outputs.push(output());
    const notification = vi.fn(async (_input: ClassOutputNotification) => ({ notificationId: "notification-1" })); const audit = vi.fn(async () => undefined);
    const service = new ClassOutputPublicationService(repository, async () => ["student-user-1", "parent-user-1", "parent-user-1"], notification, audit, () => new Date("2026-08-25T08:00:00.000Z"), () => "publication-1");
    const first = await service.publish(actor, "output-1"); const retry = await service.publish(actor, "output-1");
    expect(retry).toEqual(first); expect(repository.publications).toHaveLength(1); expect(notification).toHaveBeenCalledTimes(1);
    const payload = notification.mock.calls[0]?.[0];
    expect(payload).toMatchObject({ audienceUserIds: ["parent-user-1", "student-user-1"], context: { contextType: "class-output", contextId: "output-1", outputType: "score", classId: "class-1", enrollmentId: "enrollment-1" } });
    expect(JSON.stringify(payload)).not.toContain("reviewerNote"); expect(JSON.stringify(payload)).not.toContain("worklog-1");
    expect(repository.outputs[0]).toMatchObject({ status: "published", publishedByUserId: "academic-1" });
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "class-output.published" }));
  });

  it.each(["worklog", "private_note", "internal_handoff", "grading_queue", "payroll"] as const)("rejects non-publishable internal output %s", async (type) => {
    const repository = new InMemoryClassOutputPublicationRepository(); repository.outputs.push(output({ type }));
    const notification = vi.fn(async () => ({ notificationId: "notification-1" }));
    await expect(new ClassOutputPublicationService(repository, async () => [], notification).publish(actor, "output-1")).rejects.toMatchObject({ code: "non_publishable_output" } satisfies Partial<ClassOutputPublicationError>);
    expect(notification).not.toHaveBeenCalled(); expect(repository.publications).toEqual([]);
  });

  it("requires confirmed state, publish permission and class scope", async () => {
    const repository = new InMemoryClassOutputPublicationRepository(); repository.outputs.push(output({ status: "draft" }));
    const service = new ClassOutputPublicationService(repository, async () => [], async () => ({ notificationId: "notification-1" }));
    await expect(service.publish(actor, "output-1")).rejects.toMatchObject({ code: "invalid_status" });
    await expect(service.publish({ ...actor, canPublishClassOutput: false }, "output-1")).rejects.toMatchObject({ code: "forbidden" });
    repository.outputs[0]!.status = "confirmed";
    await expect(service.publish({ ...actor, classIds: new Set(["class-other"]) }, "output-1")).rejects.toMatchObject({ message: "class_output_outside_class_scope" });
  });
});
