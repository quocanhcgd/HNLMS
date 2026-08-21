export type RetryPolicy = {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  multiplier: number;
  jitterRatio?: number;
};

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 5,
  initialDelayMs: 1_000,
  maxDelayMs: 5 * 60_000,
  multiplier: 2,
  jitterRatio: 0.2,
};

export type DeliveryFailure = "retryable_error" | "unavailable" | "business_error";
export type RetryDecision =
  | { action: "retry"; attempts: number; availableAt: Date }
  | { action: "dead_letter"; attempts: number; reason: string };

export function decideRetry(
  attempts: number,
  failure: DeliveryFailure,
  policy: RetryPolicy = defaultRetryPolicy,
  now = new Date(),
  random: () => number = Math.random,
): RetryDecision {
  const nextAttempts = attempts + 1;
  if (failure === "business_error") return { action: "dead_letter", attempts: nextAttempts, reason: failure };
  if (nextAttempts >= policy.maxAttempts)
    return { action: "dead_letter", attempts: nextAttempts, reason: "attempts_exhausted" };
  const delay = Math.min(policy.initialDelayMs * policy.multiplier ** (nextAttempts - 1), policy.maxDelayMs);
  const jitter = 1 + (random() * 2 - 1) * (policy.jitterRatio ?? 0);
  return { action: "retry", attempts: nextAttempts, availableAt: new Date(now.getTime() + Math.round(delay * jitter)) };
}
