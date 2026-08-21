import { describe, expect, it } from "vitest";
import { InMemoryJobQueue, RedisJobQueue, type RedisQueueClient } from "../../worker/src/shared/queue/index.js";

describe("Redis queue and scheduling adapters", () => {
  it("enqueues, dequeues, schedules, and promotes due Redis jobs", async () => {
    const ready: string[] = [];
    const scheduled = new Map<string, number>();
    const redis: RedisQueueClient = {
      lpush: async (_key, value) => ready.unshift(value),
      brpop: async (_key, _timeout) => (ready.length ? ["jobs", ready.pop()!] : null),
      zadd: async (_key, score, value) => {
        scheduled.set(value, score);
        return 1;
      },
      zrangebyscore: async (_key, _min, max) => [...scheduled.entries()]
        .filter(([, score]) => score <= max)
        .map(([value]) => value),
      zrem: async (_key, value) => Number(scheduled.delete(value)),
    };
    const queue = new RedisJobQueue<{ event: string }>(redis, "jobs");
    const job = { id: "job-1", payload: { event: "reconcile" }, enqueuedAt: "2026-08-21T00:00:00.000Z" };

    await queue.schedule({ ...job, runAt: "2026-08-21T00:01:00.000Z" });
    expect(await queue.promoteDue(new Date("2026-08-21T00:00:59.999Z"))).toBe(0);
    expect(await queue.promoteDue(new Date("2026-08-21T00:01:00.000Z"))).toBe(1);
    expect(await queue.dequeue()).toEqual(job);
  });

  it("keeps FIFO ordering and only promotes due in-memory jobs", async () => {
    const queue = new InMemoryJobQueue<{ index: number }>();
    const first = { id: "first", payload: { index: 1 }, enqueuedAt: "2026-08-21T00:00:00.000Z" };
    const later = { id: "later", payload: { index: 2 }, enqueuedAt: "2026-08-21T00:00:00.000Z", runAt: "2026-08-21T00:02:00.000Z" };

    await queue.enqueue(first);
    await queue.schedule(later);
    expect(await queue.promoteDue(new Date("2026-08-21T00:01:00.000Z"))).toBe(0);
    expect(await queue.dequeue()).toEqual(first);
    expect(await queue.promoteDue(new Date("2026-08-21T00:02:00.000Z"))).toBe(1);
    expect(await queue.dequeue()).toEqual({ id: "later", payload: { index: 2 }, enqueuedAt: "2026-08-21T00:00:00.000Z" });
    await expect(queue.dequeue(-1)).rejects.toThrow("non-negative integer");
  });
});
