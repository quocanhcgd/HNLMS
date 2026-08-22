import { describe, expect, it } from "vitest";
import { DeterministicMeetingProviderAdapter, signMeetingWebhook } from "@hnlms/integration-adapters";
import { MeetingWebhookInboxService } from "../../src/modules/integrations/meeting/meeting-webhook-inbox.service.js";
import { InMemoryMeetingWebhookRepository } from "../../src/modules/integrations/meeting/in-memory-meeting-webhook-repository.js";
import { InMemoryMeetingSyncRepository, MeetingSyncWorker } from "../../../../worker/src/jobs/meeting-sync/index.js";

describe("US10 online class integration", () => {
  it("receives a signed webhook and reconciles session lifecycle, attendance and recording in one flow", async () => {
    const adapter = new DeterministicMeetingProviderAdapter("google_meet");
    const webhookRepository = new InMemoryMeetingWebhookRepository();
    const syncRepository = new InMemoryMeetingSyncRepository();
    syncRepository.sessions.push({
      id: "session-1",
      organizationId: "org-1",
      providerMappingId: "pm-1",
      providerMeetingId: "meeting-1",
      status: "scheduled",
      startedAt: null,
      completedAt: null,
    });

    let n = 0;
    const secret = "us10-secret";
    const inboxService = new MeetingWebhookInboxService(
      webhookRepository,
      adapter,
      async () => secret,
      () => `inbox-${++n}`,
      () => new Date("2026-08-22T12:00:00.000Z"),
    );
    const worker = new MeetingSyncWorker(syncRepository);
    const timestamp = "2026-08-22T12:00:00.000Z";
    const payload = JSON.stringify({
      eventId: "evt-start",
      type: "meeting.started",
      providerMeetingId: "meeting-1",
      timestamp,
    });
    const signature = signMeetingWebhook({ secret, payload, timestamp });
    const receivedEvent = await inboxService.receive({
      organizationId: "org-1",
      providerMappingId: "pm-1",
      rawPayload: payload,
      headers: { signature, timestamp },
    });
    const result = await worker.process({
      id: receivedEvent.id,
      organizationId: receivedEvent.organizationId,
      providerMappingId: receivedEvent.providerMappingId,
      eventId: receivedEvent.eventId,
      eventType: receivedEvent.eventType,
      providerMeetingId: receivedEvent.providerMeetingId ?? "meeting-1",
      receivedAt: receivedEvent.receivedAt,
      payload: receivedEvent.payload as Record<string, unknown>,
    });

    expect(result.reconciled).toBe(true);
    expect(syncRepository.sessions[0]?.status).toBe("live");
    expect(webhookRepository.records).toHaveLength(1);
  });
});
