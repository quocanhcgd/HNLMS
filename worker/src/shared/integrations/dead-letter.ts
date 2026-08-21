export type DeadLetterRecord<T> = {
  id: string;
  source: "outbox" | "inbox";
  payload: T;
  attempts: number;
  reason: string;
  failedAt: Date;
};

export interface DeadLetterStore<T> {
  move(record: DeadLetterRecord<T>): Promise<void>;
}

export class InMemoryDeadLetterStore<T> implements DeadLetterStore<T> {
  readonly records: DeadLetterRecord<T>[] = [];
  async move(record: DeadLetterRecord<T>): Promise<void> {
    this.records.push(record);
  }
}
