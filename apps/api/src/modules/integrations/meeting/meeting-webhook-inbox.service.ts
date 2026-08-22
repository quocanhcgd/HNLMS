import type { MeetingProviderAdapter, MeetingWebhookEvent } from "@hnlms/integration-adapters";
import { verifyMeetingWebhookSignature } from "@hnlms/integration-adapters";

export type MeetingWebhookInboxRecord = {
  id: string;
  organizationId: string;
  providerMappingId: string;
  eventId: string;
  eventType: MeetingWebhookEvent["eventType"];
  providerMeetingId: string | null;
  receivedAt: Date;
  verified: boolean;
  payload: unknown;
};

export type MeetingWebhookRepository = {
  findByEventId(input: { organizationId: string; providerMappingId: string; eventId: string }): Promise<MeetingWebhookInboxRecord | null>;
  save(record: MeetingWebhookInboxRecord): Promise<MeetingWebhookInboxRecord>;
};

export type MeetingWebhookSecretResolver = (input: {
  organizationId: string;
  providerMappingId: string;
}) => Promise<string | null>;

export type MeetingWebhookHeaders = {
  signature: string;
  timestamp: string;
};

export type MeetingWebhookErrorCode = "invalid_signature" | "secret_not_found" | "invalid_payload";

export class MeetingWebhookError extends Error {
  constructor(
    public readonly code: MeetingWebhookErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "MeetingWebhookError";
  }
}

export class MeetingWebhookInboxService {
  constructor(
    private readonly repository: MeetingWebhookRepository,
    private readonly adapter: MeetingProviderAdapter,
    private readonly resolveSecret: MeetingWebhookSecretResolver,
    private readonly newId: () => string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async receive(input: {
    organizationId: string;
    providerMappingId: string;
    rawPayload: string;
    headers: MeetingWebhookHeaders;
  }): Promise<MeetingWebhookInboxRecord> {
    const secret = await this.resolveSecret({
      organizationId: input.organizationId,
      providerMappingId: input.providerMappingId,
    });
    if (!secret) throw new MeetingWebhookError("secret_not_found");
    const verified = verifyMeetingWebhookSignature({
      secret,
      payload: input.rawPayload,
      timestamp: input.headers.timestamp,
      signature: input.headers.signature,
      now: this.now(),
    });
    if (!verified) throw new MeetingWebhookError("invalid_signature");

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(input.rawPayload) as unknown;
    } catch {
      throw new MeetingWebhookError("invalid_payload");
    }
    const event = this.adapter.parseWebhook(parsedPayload);
    const existing = await this.repository.findByEventId({
      organizationId: input.organizationId,
      providerMappingId: input.providerMappingId,
      eventId: event.eventId,
    });
    if (existing) return existing;

    return this.repository.save({
      id: this.newId(),
      organizationId: input.organizationId,
      providerMappingId: input.providerMappingId,
      eventId: event.eventId,
      eventType: event.eventType,
      providerMeetingId: event.providerMeetingId ?? null,
      receivedAt: this.now(),
      verified: true,
      payload: event.payload,
    });
  }
}
