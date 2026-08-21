import { describe, expect, it } from "vitest";
import {
  InMemoryCacheStore,
  InMemoryLockManager,
  RedisCacheStore,
  RedisLockManager,
  type RedisCacheClient,
} from "../../apps/api/src/shared/cache/index.js";

describe("Redis cache and lock adapters", () => {
  it("serializes Redis cache values and forwards TTLs", async () => {
    const calls: unknown[][] = [];
    const redis: RedisCacheClient = {
      get: async () => '{"enabled":true}',
      set: async (...args) => {
        calls.push(args);
        return "OK";
      },
      del: async () => 1,
      eval: async () => 1,
    };
    const cache = new RedisCacheStore(redis);

    await cache.set("license:org-1", { enabled: true }, 5_000);

    expect(await cache.get<{ enabled: boolean }>("license:org-1")).toEqual({ enabled: true });
    expect(calls).toEqual([["license:org-1", '{"enabled":true}', "PX", 5_000]]);
    expect(await cache.delete("license:org-1")).toBe(true);
    await expect(cache.set("bad", "value", 0)).rejects.toThrow("positive finite");
  });

  it("releases a Redis lock only when its token is still the owner", async () => {
    const evalCalls: unknown[][] = [];
    const setCalls: unknown[][] = [];
    const redis: RedisCacheClient = {
      get: async () => null,
      set: async (...args) => {
        setCalls.push(args);
        return "OK";
      },
      del: async () => 0,
      eval: async (...args) => {
        evalCalls.push(args);
        return 1;
      },
    };
    const lock = await new RedisLockManager(redis, () => "lock-token").acquire("report:org-1", 2_000);

    expect(lock?.token).toBe("lock-token");
    expect(setCalls).toEqual([["report:org-1", "lock-token", "PX", 2_000, "NX"]]);
    expect(await lock?.release()).toBe(true);
    expect(evalCalls[0]).toEqual([
      expect.stringContaining("redis.call('get', KEYS[1])"),
      1,
      "report:org-1",
      "lock-token",
    ]);

    const contended: RedisCacheClient = { ...redis, set: async () => null };
    expect(await new RedisLockManager(contended).acquire("report:org-1", 2_000)).toBeUndefined();
  });

  it("provides expiring cache and non-reentrant locks in memory", async () => {
    let now = 1_000;
    const cache = new InMemoryCacheStore(() => now);
    const locks = new InMemoryLockManager(() => now, () => "one");
    await cache.set("session", { userId: "u1" }, 10);

    expect(await cache.get("session")).toEqual({ userId: "u1" });
    now += 10;
    expect(await cache.get("session")).toBeUndefined();

    const first = await locks.acquire("tenant:sync", 10);
    expect(await locks.acquire("tenant:sync", 10)).toBeUndefined();
    expect(await first?.release()).toBe(true);
    expect(await first?.release()).toBe(false);

    const expiring = await locks.acquire("tenant:expiry", 10);
    now += 10;
    expect(await expiring?.release()).toBe(false);
    expect(await locks.acquire("tenant:expiry", 10)).toBeDefined();
  });
});
