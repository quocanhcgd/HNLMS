export interface RedisCacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: "PX", ttlMs: number, condition?: "NX"): Promise<unknown>;
  del(key: string): Promise<number>;
  eval(script: string, keyCount: number, ...args: string[]): Promise<number>;
}

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<boolean>;
}

export interface LockHandle {
  readonly key: string;
  readonly token: string;
  release(): Promise<boolean>;
}

export interface LockManager {
  acquire(key: string, ttlMs: number): Promise<LockHandle | undefined>;
}

const RELEASE_IF_OWNER = [
  "if redis.call('get', KEYS[1]) == ARGV[1] then",
  "  return redis.call('del', KEYS[1])",
  "end",
  "return 0",
].join("\n");

export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisCacheClient) {}

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.redis.get(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    assertPositiveTtl(ttlMs);
    await this.redis.set(key, JSON.stringify(value), "PX", ttlMs);
  }

  async delete(key: string): Promise<boolean> {
    return (await this.redis.del(key)) > 0;
  }
}

export class RedisLockManager implements LockManager {
  constructor(
    private readonly redis: RedisCacheClient,
    private readonly createToken: () => string = defaultToken,
  ) {}

  async acquire(key: string, ttlMs: number): Promise<LockHandle | undefined> {
    assertPositiveTtl(ttlMs);
    const token = this.createToken();
    const result = await this.redis.set(key, token, "PX", ttlMs, "NX");
    if (result !== "OK") return undefined;

    return {
      key,
      token,
      release: async () => (await this.redis.eval(RELEASE_IF_OWNER, 1, key, token)) === 1,
    };
  }
}

export class InMemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, { value: unknown; expiresAt: number }>();

  constructor(private readonly now: () => number = Date.now) {}

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    assertPositiveTtl(ttlMs);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async delete(key: string): Promise<boolean> {
    return this.entries.delete(key);
  }
}

export class InMemoryLockManager implements LockManager {
  private readonly locks = new Map<string, { token: string; expiresAt: number }>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly createToken: () => string = defaultToken,
  ) {}

  async acquire(key: string, ttlMs: number): Promise<LockHandle | undefined> {
    assertPositiveTtl(ttlMs);
    const existing = this.locks.get(key);
    if (existing && existing.expiresAt > this.now()) return undefined;
    if (existing) this.locks.delete(key);

    const token = this.createToken();
    this.locks.set(key, { token, expiresAt: this.now() + ttlMs });
    return {
      key,
      token,
      release: async () => {
        const current = this.locks.get(key);
        if (!current || current.expiresAt <= this.now() || current.token !== token) return false;
        this.locks.delete(key);
        return true;
      },
    };
  }
}

function assertPositiveTtl(ttlMs: number): void {
  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error("ttlMs must be a positive finite number");
  }
}

function defaultToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
