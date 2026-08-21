import type { LandingContent } from "../schema";
import type { ContentKind, ContentRepository, ContentStatus } from "./content.service";

/**
 * In-memory repository for tests. Not used in production.
 */
export class InMemoryContentRepository implements ContentRepository {
  readonly records: LandingContent[] = [];

  async findById({ organizationId, id }: { organizationId: string; id: string }): Promise<LandingContent | null> {
    const item = this.records.find((r) => r.id === id && r.organizationId === organizationId);
    return item ? structuredClone(item) : null;
  }

  async list(input: {
    organizationId: string;
    kind?: ContentKind;
    status?: ContentStatus;
    search?: string;
  }): Promise<LandingContent[]> {
    let items = this.records.filter((r) => r.organizationId === input.organizationId);
    if (input.kind) items = items.filter((r) => r.kind === input.kind);
    if (input.status) items = items.filter((r) => r.status === input.status);
    if (input.search) {
      const q = input.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.summary && r.summary.toLowerCase().includes(q)),
      );
    }
    items.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime());
    return structuredClone(items);
  }

  async create(input: LandingContent): Promise<LandingContent> {
    const record = structuredClone(input);
    this.records.push(record);
    return structuredClone(record);
  }

  async update({
    organizationId,
    id,
    changes,
  }: {
    organizationId: string;
    id: string;
    changes: Record<string, unknown>;
  }): Promise<LandingContent> {
    const idx = this.records.findIndex((r) => r.id === id && r.organizationId === organizationId);
    if (idx === -1) throw new Error("not_found");
    const existing = this.records[idx]!;
    const updated = { ...existing, ...changes } as LandingContent;
    this.records[idx] = structuredClone(updated);
    return structuredClone(updated);
  }

  async updateMany({
    organizationId,
    updates,
  }: {
    organizationId: string;
    updates: Array<{ id: string; changes: Record<string, unknown> }>;
  }): Promise<void> {
    for (const { id, changes } of updates) {
      await this.update({ organizationId, id, changes });
    }
  }

  async countBySlug({ organizationId, slug }: { organizationId: string; slug: string }): Promise<number> {
    return this.records.filter((r) => r.organizationId === organizationId && r.slug === slug).length;
  }

  async maxSortOrder({ organizationId, kind }: { organizationId: string; kind: string }): Promise<number> {
    const matches = this.records.filter((r) => r.organizationId === organizationId && r.kind === kind);
    if (matches.length === 0) return 0;
    return Math.max(...matches.map((r) => r.sortOrder));
  }
}
