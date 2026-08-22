import { describe, expect, it } from "vitest";
import { DeterministicMeetingProviderAdapter, signMeetingWebhook } from "@hnlms/integration-adapters";
import { MeetingWebhookInboxService } from "../../src/modules/integrations/meeting/meeting-webhook-inbox.service";
import { InMemoryMeetingWebhookRepository } from "../../src/modules/integrations/meeting/in-memory-meeting-webhook-repository";

const secret = "test-secret";
const adapter = new DeterministicMeetingProviderAdapter("zoom");
let n = 0;
const repository = new InMemoryMeetingWebhookRepository();
const service = new MeetingWebhookInboxService(
  repository,
  adapter,
  async () => secret,
  () => `id-${++n}`,
  () => new Date("2026-08-22T10:00:00.000Z"),
);

describe("T091 meeting webhook inbox", () => {
  it("receives a signed webhook and deduplicates by event id", async () => {
    const timestamp = new Date("2026-08-22T10:00:00.000Z").toISOString();
    const payload = JSON.stringify({ eventId: "evt-1", type: "meeting.ended", providerMeetingId: "meeting-1", timestamp });
    const signature = signMeetingWebhook({ secret, payload, timestamp });
    const first = await service.receive({
      organizationId: "org-1",
      providerMappingId: "pm-1",
      rawPayload: payload,
      headers: { signature, timestamp },
    });
    const second = await service.receive({
      organizationId: "org-1",
      providerMappingId: "pm-1",
      rawPayload: payload,
      headers: { signature, timestamp },
    });

    expect(first.eventType).toBe("meeting.ended");
    expect(second.id).toBe(first.id);
    expect(repository.records).toHaveLength(1);
  });

  it("rejects invalid signature and missing secret", async () => {
    const timestamp = new Date("2026-08-22T10:05:00.000Z").toISOString();
    const payload = JSON.stringify({ id: "evt-2", timestamp });
    await expect(
      service.receive({
        organizationId: "org-1",
        providerMappingId: "pm-1",
        rawPayload: payload,
        headers: { timestamp, signature: "bad" },
      }),
    ).rejects.toMatchObject({ code: "invalid_signature" });
    await expect(
      new MeetingWebhookInboxService(repository, adapter, async () => null, () => "id-1", () => new Date("2026-08-22T10:05:00.000Z")).receive({
        organizationId: "org-1",
        providerMappingId: "pm-1",
        rawPayload: payload,
        headers: { timestamp, signature: "bad" },
      }),
    ).rejects.toMatchObject({ code: "secret_not_found" });
  });
});
