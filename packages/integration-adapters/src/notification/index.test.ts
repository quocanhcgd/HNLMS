import { describe, expect, it } from "vitest";
import { assertDeliverable, createDeliveryReceipt, nextNotificationAttempt, NotificationContractError, renderTemplate, sandboxNotificationProviders, type NotificationRequest } from "./index";

const template = { key: "class.reminder", category: "academic" as const, variables: ["className"], versions: { vi: { subject: "Nhắc lớp {className}", body: "Bạn có lịch học {className}." }, en: { subject: "Class {className}", body: "Your class is {className}." } } };
const request: NotificationRequest = { organizationId: "org1", notificationId: "n1", deliveryId: "d1", recipientId: "u1", channel: "email", locale: "vi", category: "academic", template, variables: { className: "Toán 6" }, destination: "student@example.test" };

describe("notification contracts", () => {
  it("renders localized templates and sends through sandbox providers", async () => {
    expect(renderTemplate(template, "vi", request.variables).subject).toBe("Nhắc lớp Toán 6");
    assertDeliverable(request);
    const sent = await sandboxNotificationProviders.email.send(request, renderTemplate(template, "vi", request.variables));
    expect(sent.providerMessageId).toContain("sandbox:email:org1:d1");
    expect(createDeliveryReceipt(request, "delivered", 1, sent)).toMatchObject({ status: "delivered", attempt: 1 });
  });
  it("enforces variables, destinations, opt-out and bounded retry", () => {
    expect(() => renderTemplate(template, "vi", {})).toThrow("variable_missing");
    expect(() => assertDeliverable({ ...request, destination: undefined })).toThrow("destination_required");
    expect(() => assertDeliverable(request, { userId: "u1", optedOutChannels: new Set(["email"]), optedOutCategories: new Set() })).toThrow(new NotificationContractError("opted_out"));
    expect(nextNotificationAttempt(0, 3, new Date(0))).toMatchObject({ status: "retry", attempt: 1, availableAt: new Date(1000) });
    expect(nextNotificationAttempt(2, 3)).toMatchObject({ status: "dead_letter", attempt: 3 });
  });
});
