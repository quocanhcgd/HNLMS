import { describe, expect, it, vi } from "vitest";
import { InMemoryDeadLetterStore, decideRetry, deliverWithRetry } from "../../worker/src/shared/integrations";

describe("outbox retry and dead-letter primitives", () => {
  it("uses bounded exponential backoff with deterministic jitter", () => {
    expect(
      decideRetry(
        0,
        "retryable_error",
        { maxAttempts: 3, initialDelayMs: 100, maxDelayMs: 500, multiplier: 2, jitterRatio: 0.2 },
        new Date(0),
        () => 1,
      ),
    ).toEqual({ action: "retry", attempts: 1, availableAt: new Date(120) });
    expect(
      decideRetry(2, "unavailable", { maxAttempts: 3, initialDelayMs: 100, maxDelayMs: 500, multiplier: 2 }),
    ).toEqual({ action: "dead_letter", attempts: 3, reason: "attempts_exhausted" });
    expect(decideRetry(0, "business_error")).toMatchObject({ action: "dead_letter", reason: "business_error" });
  });
  it("records retryable failures and dead-letters terminal failures", async () => {
    const store = { markPublished: vi.fn(), reschedule: vi.fn(), markDeadLettered: vi.fn() };
    const deadLetters = new InMemoryDeadLetterStore<{ invoiceId: string }>();
    await expect(
      deliverWithRetry(
        { id: "out-1", payload: { invoiceId: "i1" }, attempts: 0 },
        async () => ({ kind: "unavailable", message: "timeout" }) as const,
        store,
        deadLetters,
        { maxAttempts: 2, initialDelayMs: 100, maxDelayMs: 100, multiplier: 2 },
        new Date(0),
      ),
    ).resolves.toBe("retry");
    expect(store.reschedule).toHaveBeenCalledWith("out-1", 1, new Date(100), "timeout");
    await expect(
      deliverWithRetry(
        { id: "out-1", payload: { invoiceId: "i1" }, attempts: 1 },
        async () => ({ kind: "business_error", message: "mapping failed" }) as const,
        store,
        deadLetters,
      ),
    ).resolves.toBe("dead_letter");
    expect(store.markDeadLettered).toHaveBeenCalledWith("out-1", 2, "mapping failed");
    expect(deadLetters.records[0]).toMatchObject({ id: "out-1", source: "outbox", reason: "business_error" });
  });
  it("treats a provider duplicate acknowledgement as a successful publish", async () => {
    const store = { markPublished: vi.fn(), reschedule: vi.fn(), markDeadLettered: vi.fn() };
    await expect(
      deliverWithRetry(
        { id: "out-2", payload: {}, attempts: 0 },
        async () => ({ kind: "duplicate" }) as const,
        store,
        new InMemoryDeadLetterStore(),
      ),
    ).resolves.toBe("published");
    expect(store.markPublished).toHaveBeenCalledWith("out-2");
  });
});
