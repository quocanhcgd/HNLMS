import { describe, expect, it } from "vitest";
import { DeterministicMeetingProviderAdapter, signMeetingWebhook } from "@hnlms/integration-adapters";
import { InMemoryMeetingWebhookRepository } from "../../src/modules/integrations/meeting/in-memory-meeting-webhook-repository";
import { MeetingWebhookInboxService } from "../../src/modules/integrations/meeting/meeting-webhook-inbox.service";

describe("US10 meeting provider contract", () => {
  it.each(["zoom", "google_meet", "teams", "custom"] as const)("provisions a stable %s meeting contract", async (provider) => {
    const adapter = new DeterministicMeetingProviderAdapter(provider);
    const result = await adapter.createMeeting({ title: "Unit 5", startsAt: new Date("2026-08-25T11:00:00.000Z"), endsAt: new Date("2026-08-25T12:00:00.000Z"), hostUserId: "teacher-1" });
    expect(result.provider).toBe(provider);
    expect(result.providerMeetingId).toMatch(/^meeting-/);
    expect(result.joinUrl).toContain(result.providerMeetingId);
    expect(result.hostUrlSecretRef).toContain(result.providerMeetingId);
  });

  it("accepts a signed webhook once and makes duplicate delivery idempotent", async () => {
    const secret = "contract-secret";
    const now = new Date("2026-08-25T11:00:00.000Z");
    const timestamp = now.toISOString();
    const rawPayload = JSON.stringify({ eventId: "evt-contract-1", type: "attendance.updated", providerMeetingId: "meeting-contract-1", timestamp });
    const repository = new InMemoryMeetingWebhookRepository();
    let sequence = 0;
    const service = new MeetingWebhookInboxService(repository, new DeterministicMeetingProviderAdapter("zoom"), async () => secret, () => `inbox-${++sequence}`, () => now);
    const input = { organizationId: "org-1", providerMappingId: "mapping-1", rawPayload, headers: { timestamp, signature: signMeetingWebhook({ secret, payload: rawPayload, timestamp }) } };
    const first = await service.receive(input);
    const duplicate = await service.receive(input);
    expect(first).toMatchObject({ eventId: "evt-contract-1", eventType: "attendance.updated", verified: true });
    expect(duplicate.id).toBe(first.id);
    expect(repository.records).toHaveLength(1);
  });

  it("rejects replayed, unsigned or malformed webhook requests", async () => {
    const now = new Date("2026-08-25T11:00:00.000Z");
    const repository = new InMemoryMeetingWebhookRepository();
    const service = new MeetingWebhookInboxService(repository, new DeterministicMeetingProviderAdapter("custom"), async () => "secret", () => "inbox-1", () => now);
    const oldTimestamp = new Date(now.getTime() - 301_000).toISOString();
    await expect(service.receive({ organizationId: "org-1", providerMappingId: "mapping-1", rawPayload: "{}", headers: { timestamp: oldTimestamp, signature: "bad" } })).rejects.toMatchObject({ code: "invalid_signature" });
    await expect(service.receive({ organizationId: "org-1", providerMappingId: "mapping-1", rawPayload: "not-json", headers: { timestamp: now.toISOString(), signature: signMeetingWebhook({ secret: "secret", payload: "not-json", timestamp: now.toISOString() }) } })).rejects.toMatchObject({ code: "invalid_payload" });
  });
});
