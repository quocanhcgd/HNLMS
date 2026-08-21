export interface RedisQueueClient {
  lpush(key: string, value: string): Promise<number>;
  brpop(key: string, timeoutSeconds: number): Promise<[string, string] | null>;
  zadd(key: string, score: number, value: string): Promise<number>;
  zrangebyscore(key: string, min: number, max: number): Promise<string[]>;
  zrem(key: string, value: string): Promise<number>;
}

export interface QueueJob<T> {
  id: string;
  payload: T;
  enqueuedAt: string;
}

export interface ScheduledJob<T> extends QueueJob<T> {
  runAt: string;
}

export interface JobQueue<T> {
  enqueue(job: QueueJob<T>): Promise<void>;
  dequeue(timeoutSeconds?: number): Promise<QueueJob<T> | undefined>;
}

export interface JobScheduler<T> {
  schedule(job: ScheduledJob<T>): Promise<void>;
  promoteDue(now?: Date): Promise<number>;
}

export class RedisJobQueue<T> implements JobQueue<T>, JobScheduler<T> {
  private readonly scheduledKey: string;

  constructor(
    private readonly redis: RedisQueueClient,
    private readonly queueKey: string,
    scheduledKey?: string,
  ) {
    this.scheduledKey = scheduledKey ?? `${queueKey}:scheduled`;
  }

  async enqueue(job: QueueJob<T>): Promise<void> {
    await this.redis.lpush(this.queueKey, JSON.stringify(job));
  }

  async dequeue(timeoutSeconds = 0): Promise<QueueJob<T> | undefined> {
    assertTimeout(timeoutSeconds);
    const result = await this.redis.brpop(this.queueKey, timeoutSeconds);
    return result ? (JSON.parse(result[1]) as QueueJob<T>) : undefined;
  }

  async schedule(job: ScheduledJob<T>): Promise<void> {
    const runAt = Date.parse(job.runAt);
    if (Number.isNaN(runAt)) throw new Error("job.runAt must be an ISO-8601 timestamp");
    await this.redis.zadd(this.scheduledKey, runAt, JSON.stringify(job));
  }

  async promoteDue(now = new Date()): Promise<number> {
    const due = await this.redis.zrangebyscore(this.scheduledKey, Number.NEGATIVE_INFINITY, now.getTime());
    let promoted = 0;
    for (const serialized of due) {
      // Only the scheduler that removes the member owns its promotion.
      if ((await this.redis.zrem(this.scheduledKey, serialized)) !== 1) continue;
      const job = JSON.parse(serialized) as ScheduledJob<T>;
      await this.enqueue({ id: job.id, payload: job.payload, enqueuedAt: job.enqueuedAt });
      promoted += 1;
    }
    return promoted;
  }
}

export class InMemoryJobQueue<T> implements JobQueue<T>, JobScheduler<T> {
  private readonly ready: QueueJob<T>[] = [];
  private readonly scheduled: ScheduledJob<T>[] = [];

  async enqueue(job: QueueJob<T>): Promise<void> {
    this.ready.unshift(job);
  }

  async dequeue(timeoutSeconds = 0): Promise<QueueJob<T> | undefined> {
    assertTimeout(timeoutSeconds);
    return this.ready.pop();
  }

  async schedule(job: ScheduledJob<T>): Promise<void> {
    if (Number.isNaN(Date.parse(job.runAt))) throw new Error("job.runAt must be an ISO-8601 timestamp");
    this.scheduled.push(job);
  }

  async promoteDue(now = new Date()): Promise<number> {
    const dueAt = now.getTime();
    const due = this.scheduled.filter((job) => Date.parse(job.runAt) <= dueAt);
    this.scheduled.splice(0, this.scheduled.length, ...this.scheduled.filter((job) => Date.parse(job.runAt) > dueAt));
    for (const job of due) {
      await this.enqueue({ id: job.id, payload: job.payload, enqueuedAt: job.enqueuedAt });
    }
    return due.length;
  }
}

function assertTimeout(timeoutSeconds: number): void {
  if (!Number.isInteger(timeoutSeconds) || timeoutSeconds < 0) {
    throw new Error("timeoutSeconds must be a non-negative integer");
  }
}
