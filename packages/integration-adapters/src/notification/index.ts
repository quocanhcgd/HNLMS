export type NotificationChannel = "in_app" | "email" | "sms";
export type NotificationLocale = "vi" | "en";
export type NotificationCategory = "transactional" | "academic" | "marketing" | "security";
export type NotificationDeliveryStatus = "queued" | "sent" | "delivered" | "read" | "failed" | "opted_out" | "dead_letter";

export type NotificationTemplate = {
  key: string;
  category: NotificationCategory;
  versions: Record<NotificationLocale, { subject: string; body: string }>;
  variables: readonly string[];
};

export type NotificationRequest = {
  organizationId: string;
  notificationId: string;
  deliveryId: string;
  recipientId: string;
  channel: NotificationChannel;
  locale: NotificationLocale;
  category: NotificationCategory;
  template: NotificationTemplate;
  variables: Record<string, string | number>;
  destination?: string;
};

export type DeliveryReceipt = {
  deliveryId: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  providerMessageId?: string;
  occurredAt: Date;
  attempt: number;
  errorCode?: string;
};

export type NotificationProvider = {
  readonly channel: NotificationChannel;
  send(request: NotificationRequest, rendered: { subject: string; body: string }): Promise<{ providerMessageId: string }>;
};

export type NotificationPreferences = { userId: string; optedOutChannels: ReadonlySet<NotificationChannel>; optedOutCategories: ReadonlySet<NotificationCategory> };

export class NotificationContractError extends Error {
  constructor(public readonly code: "template_invalid" | "variable_missing" | "destination_required" | "opted_out" | "retry_exhausted") { super(code); this.name = "NotificationContractError"; }
}

export function renderTemplate(template: NotificationTemplate, locale: NotificationLocale, variables: Record<string, string | number>) {
  const copy = template.versions[locale] ?? template.versions.vi;
  if (!copy || !template.key || !template.variables.length) throw new NotificationContractError("template_invalid");
  for (const variable of template.variables) if (variables[variable] === undefined) throw new NotificationContractError("variable_missing");
  const render = (value: string) => value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key: string) => String(variables[key] ?? `{${key}}`));
  return { subject: render(copy.subject), body: render(copy.body) };
}

export function assertDeliverable(request: NotificationRequest, preferences?: NotificationPreferences) {
  if (!request.organizationId || !request.notificationId || !request.deliveryId || !request.recipientId) throw new NotificationContractError("template_invalid");
  if (!request.template.versions[request.locale] && !request.template.versions.vi) throw new NotificationContractError("template_invalid");
  if ((request.channel === "email" || request.channel === "sms") && !request.destination?.trim()) throw new NotificationContractError("destination_required");
  if (preferences && (preferences.optedOutChannels.has(request.channel) || preferences.optedOutCategories.has(request.category))) throw new NotificationContractError("opted_out");
}

export function nextNotificationAttempt(attempt: number, maxAttempts = 5, now = new Date()): { status: "retry" | "dead_letter"; attempt: number; availableAt?: Date } {
  const next = attempt + 1;
  if (next >= maxAttempts) return { status: "dead_letter", attempt: next };
  return { status: "retry", attempt: next, availableAt: new Date(now.getTime() + Math.min(300_000, 1000 * 2 ** (next - 1))) };
}

export function createDeliveryReceipt(request: NotificationRequest, status: NotificationDeliveryStatus, attempt: number, details: Partial<Pick<DeliveryReceipt, "providerMessageId" | "errorCode">> = {}): DeliveryReceipt {
  return { deliveryId: request.deliveryId, channel: request.channel, status, occurredAt: new Date(), attempt, ...details };
}

export class SandboxNotificationProvider implements NotificationProvider {
  constructor(public readonly channel: NotificationChannel) {}
  async send(request: NotificationRequest): Promise<{ providerMessageId: string }> {
    return { providerMessageId: `sandbox:${this.channel}:${request.organizationId}:${request.deliveryId}` };
  }
}

export const sandboxNotificationProviders: Record<NotificationChannel, NotificationProvider> = {
  in_app: new SandboxNotificationProvider("in_app"), email: new SandboxNotificationProvider("email"), sms: new SandboxNotificationProvider("sms"),
};
