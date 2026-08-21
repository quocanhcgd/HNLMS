import type { DeadLetterStore } from "./dead-letter.js";
import { decideRetry, type DeliveryFailure, type RetryDecision, type RetryPolicy } from "./retry.js";

export type DeliverableEvent<T> = { id: string; payload: T; attempts: number };
export type DeliveryResult = { kind: "accepted" | "duplicate" } | { kind: DeliveryFailure; message: string };
export type DeliveryStore<T> = {
  markPublished(id: string): Promise<void>;
  reschedule(id: string, attempts: number, availableAt: Date, error: string): Promise<void>;
  markDeadLettered(id: string, attempts: number, error: string): Promise<void>;
};

export async function deliverWithRetry<T>(
  event: DeliverableEvent<T>,
  send: (event: DeliverableEvent<T>) => Promise<DeliveryResult>,
  store: DeliveryStore<T>,
  deadLetters: DeadLetterStore<T>,
  policy?: RetryPolicy,
  now = new Date(),
): Promise<"published" | RetryDecision["action"]> {
  const result = await send(event);
  if (result.kind === "accepted" || result.kind === "duplicate") {
    await store.markPublished(event.id);
    return "published";
  }
  const decision = decideRetry(event.attempts, result.kind, policy, now);
  if (decision.action === "retry") {
    await store.reschedule(event.id, decision.attempts, decision.availableAt, result.message);
    return "retry";
  }
  await store.markDeadLettered(event.id, decision.attempts, result.message);
  await deadLetters.move({
    id: event.id,
    source: "outbox",
    payload: event.payload,
    attempts: decision.attempts,
    reason: decision.reason,
    failedAt: now,
  });
  return "dead_letter";
}
