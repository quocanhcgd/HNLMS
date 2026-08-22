import { createHmac, timingSafeEqual } from "node:crypto";

export type MeetingProviderKind = "zoom" | "google_meet" | "teams" | "custom";

export type MeetingCreateInput = {
  title: string;
  startsAt: Date;
  endsAt: Date;
  hostUserId: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
};

export type MeetingProvisionResult = {
  provider: MeetingProviderKind;
  providerMeetingId: string;
  joinUrl: string;
  hostUrlSecretRef?: string;
  raw?: unknown;
};

export type MeetingWebhookEvent = {
  provider: MeetingProviderKind;
  eventId: string;
  eventType: "meeting.started" | "meeting.ended" | "attendance.updated" | "recording.ready" | "unknown";
  occurredAt: Date;
  providerMeetingId?: string;
  payload: unknown;
};

export type MeetingProviderAdapter = {
  readonly provider: MeetingProviderKind;
  createMeeting(input: MeetingCreateInput): Promise<MeetingProvisionResult>;
  parseWebhook(payload: unknown): MeetingWebhookEvent;
};

export class DeterministicMeetingProviderAdapter implements MeetingProviderAdapter {
  constructor(
    public readonly provider: MeetingProviderKind = "custom",
    private readonly idPrefix = "meeting",
  ) {}

  async createMeeting(input: MeetingCreateInput): Promise<MeetingProvisionResult> {
    const providerMeetingId = `${this.idPrefix}-${input.startsAt.toISOString()}-${input.title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return {
      provider: this.provider,
      providerMeetingId,
      joinUrl: `https://meeting.local/${providerMeetingId}`,
      hostUrlSecretRef: `secret://${providerMeetingId}/host-url`,
      raw: { timezone: input.timezone ?? "Asia/Ho_Chi_Minh", metadata: input.metadata ?? {} },
    };
  }

  parseWebhook(payload: unknown): MeetingWebhookEvent {
    const body = payload as Record<string, unknown>;
    return {
      provider: this.provider,
      eventId: String(body.eventId ?? body.id ?? "unknown"),
      eventType: normalizeEventType(String(body.eventType ?? body.type ?? "unknown")),
      occurredAt: new Date(String(body.occurredAt ?? body.timestamp ?? new Date().toISOString())),
      providerMeetingId: body.providerMeetingId ? String(body.providerMeetingId) : undefined,
      payload,
    };
  }
}

export function signMeetingWebhook(input: { secret: string; payload: string; timestamp: string }): string {
  return createHmac("sha256", input.secret).update(`${input.timestamp}.${input.payload}`).digest("hex");
}

export function verifyMeetingWebhookSignature(input: {
  secret: string;
  payload: string;
  timestamp: string;
  signature: string;
  toleranceSeconds?: number;
  now?: Date;
}): boolean {
  const toleranceSeconds = input.toleranceSeconds ?? 300;
  const timestampMs = Date.parse(input.timestamp);
  if (!Number.isFinite(timestampMs)) return false;
  const now = input.now ?? new Date();
  if (Math.abs(now.getTime() - timestampMs) > toleranceSeconds * 1000) return false;
  const expected = signMeetingWebhook(input);
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(input.signature, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function normalizeEventType(value: string): MeetingWebhookEvent["eventType"] {
  if (["meeting.started", "meeting.ended", "attendance.updated", "recording.ready"].includes(value)) {
    return value as MeetingWebhookEvent["eventType"];
  }
  return "unknown";
}


export type PaymentProviderKind = "test" | "stripe" | "vnpay" | "momo" | "custom";
export type PaymentCreateInput = { invoiceId: string; amount: number; currency: string; idempotencyKey: string; returnUrl?: string };
export type PaymentCreateResult = { provider: PaymentProviderKind; providerTransactionId: string; checkoutUrl: string };
export class DeterministicPaymentProviderAdapter {
  constructor(public readonly provider: PaymentProviderKind = "test") {}
  async createPayment(input: PaymentCreateInput): Promise<PaymentCreateResult> {
    return { provider: this.provider, providerTransactionId: `tx-${input.idempotencyKey}`, checkoutUrl: `/payment/${input.invoiceId}/${input.idempotencyKey}` };
  }
}
