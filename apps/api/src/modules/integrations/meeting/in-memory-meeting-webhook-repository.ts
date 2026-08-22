import type { MeetingWebhookInboxRecord, MeetingWebhookRepository } from "./meeting-webhook-inbox.service";

export class InMemoryMeetingWebhookRepository implements MeetingWebhookRepository {
  readonly records: MeetingWebhookInboxRecord[] = [];

  async findByEventId(input: { organizationId: string; providerMappingId: string; eventId: string }) {
    const record = this.records.find(
      (candidate) =>
        candidate.organizationId === input.organizationId &&
        candidate.providerMappingId === input.providerMappingId &&
        candidate.eventId === input.eventId,
    );
    return record ? structuredClone(record) : null;
  }

  async save(record: MeetingWebhookInboxRecord) {
    const clone = structuredClone(record);
    this.records.push(clone);
    return structuredClone(clone);
  }
}
