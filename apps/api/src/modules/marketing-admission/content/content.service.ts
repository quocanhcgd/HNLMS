import { type LandingContent } from "../schema";

/* ---------- public types ---------- */

export type ContentKind = "page" | "course" | "instructor" | "studentHighlight" | "news" | "announcement" | "cta";

export type ContentStatus = "draft" | "review" | "published" | "revoked";

export type ContentActor = {
  userId: string;
  organizationId: string;
};

export type CreateContentInput = {
  kind: ContentKind;
  slug: string;
  title: string;
  summary?: string;
  body?: unknown;
  media?: unknown;
  locale?: string;
  sortOrder?: number;
};

export type UpdateContentInput = {
  slug?: string;
  title?: string;
  summary?: string;
  body?: unknown;
  media?: unknown;
  locale?: string;
  sortOrder?: number;
};

export type ReorderItem = {
  id: string;
  sortOrder: number;
};

/* ---------- repository contract ---------- */

export type ContentRepository = {
  findById(input: { organizationId: string; id: string }): Promise<LandingContent | null>;
  list(input: {
    organizationId: string;
    kind?: ContentKind;
    status?: ContentStatus;
    search?: string;
  }): Promise<LandingContent[]>;
  create(input: LandingContent): Promise<LandingContent>;
  update(input: {
    organizationId: string;
    id: string;
    changes: Partial<
      Pick<
        LandingContent,
        "slug" | "title" | "summary" | "body" | "media" | "locale" | "sortOrder" | "status" | "version"
      >
    > &
      Record<string, unknown>;
  }): Promise<LandingContent>;
  updateMany(input: {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<Pick<LandingContent, "sortOrder" | "status" | "version">>;
    }>;
  }): Promise<void>;
  countBySlug(input: { organizationId: string; slug: string }): Promise<number>;
  maxSortOrder(input: { organizationId: string; kind: ContentKind }): Promise<number>;
};

/* ---------- audit contract ---------- */

export type ContentAudit = (event: {
  organizationId: string;
  actorUserId: string;
  action: string;
  entityId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}) => Promise<void>;

/* ---------- error contract ---------- */

export type ContentErrorCode =
  | "not_found"
  | "forbidden"
  | "invalid_input"
  | "invalid_status"
  | "slug_taken"
  | "already_published"
  | "not_published"
  | "revoked";

export class ContentServiceError extends Error {
  constructor(
    public readonly code: ContentErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "ContentServiceError";
  }
}

/* ---------- validation helpers ---------- */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validateSlug(slug: string): void {
  if (!slug || !slug.trim()) throw new ContentServiceError("invalid_input", "slug_required");
  if (!SLUG_RE.test(slug)) {
    throw new ContentServiceError("invalid_input", "slug_invalid_format");
  }
  if (slug.length > 200) throw new ContentServiceError("invalid_input", "slug_too_long");
}

function validateTitle(title: string): void {
  if (!title || !title.trim()) throw new ContentServiceError("invalid_input", "title_required");
  if (title.length > 500) throw new ContentServiceError("invalid_input", "title_too_long");
}

function normalizeLocale(locale?: string): string {
  const v = locale?.trim() || "vi";
  if (!["vi", "en"].includes(v)) throw new ContentServiceError("invalid_input", "locale_invalid");
  return v;
}

function normalizeSortOrder(value?: number): number {
  if (value === undefined || value === null) return 0;
  if (!Number.isInteger(value)) throw new ContentServiceError("invalid_input", "sort_order_invalid");
  return value;
}

/* ---------- service ---------- */

export class LandingContentService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly audit: ContentAudit = async () => undefined,
    private readonly newId: () => string = () => crypto.randomUUID(),
    private readonly now: () => Date = () => new Date(),
  ) {}

  /* ---- list ---- */

  async list(
    actor: ContentActor,
    filters: { kind?: ContentKind; status?: ContentStatus; search?: string } = {},
  ): Promise<LandingContent[]> {
    return this.repository.list({
      organizationId: actor.organizationId,
      kind: filters.kind,
      status: filters.status,
      search: filters.search,
    });
  }

  /* ---- get ---- */

  async get(actor: ContentActor, id: string): Promise<LandingContent> {
    const item = await this.repository.findById({ organizationId: actor.organizationId, id });
    if (!item) throw new ContentServiceError("not_found", "content not found");
    if (item.organizationId !== actor.organizationId) {
      throw new ContentServiceError("not_found", "content not found");
    }
    return item;
  }

  /* ---- create ---- */

  async create(actor: ContentActor, input: CreateContentInput): Promise<LandingContent> {
    const slug = input.slug.trim().toLowerCase();
    const title = input.title.trim();
    validateSlug(slug);
    validateTitle(title);

    const existingCount = await this.repository.countBySlug({
      organizationId: actor.organizationId,
      slug,
    });
    if (existingCount > 0) throw new ContentServiceError("slug_taken", "slug already in use");

    const maxSort = await this.repository.maxSortOrder({
      organizationId: actor.organizationId,
      kind: input.kind,
    });

    const id = this.newId();
    const now = this.now();
    const content = await this.repository.create({
      id,
      organizationId: actor.organizationId,
      kind: input.kind,
      slug,
      title,
      summary: input.summary?.trim() || null,
      body: input.body ?? null,
      media: input.media ?? null,
      locale: normalizeLocale(input.locale),
      sortOrder: input.sortOrder !== undefined ? normalizeSortOrder(input.sortOrder) : maxSort + 1,
      version: 1,
      status: "draft",
      publishedAt: null,
      revokedAt: null,
      publishedByUserId: null,
      revokedByUserId: null,
      createdByUserId: actor.userId,
      createdAt: now,
      updatedAt: now,
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.created",
      entityId: content.id,
      after: { kind: content.kind, slug: content.slug, title: content.title },
    });

    return content;
  }

  /* ---- update ---- */

  async update(actor: ContentActor, id: string, changes: UpdateContentInput): Promise<LandingContent> {
    const existing = await this.get(actor, id);

    if (existing.status === "published" || existing.status === "revoked") {
      throw new ContentServiceError("invalid_status", "content in terminal status cannot be edited");
    }

    const updateChanges: Parameters<ContentRepository["update"]>[0]["changes"] = {};

    if (changes.slug !== undefined) {
      const slug = changes.slug.trim().toLowerCase();
      validateSlug(slug);
      if (slug !== existing.slug) {
        const count = await this.repository.countBySlug({
          organizationId: actor.organizationId,
          slug,
        });
        if (count > 0) throw new ContentServiceError("slug_taken", "slug already in use");
      }
      updateChanges.slug = slug;
    }

    if (changes.title !== undefined) {
      const title = changes.title.trim();
      validateTitle(title);
      updateChanges.title = title;
    }

    if (changes.summary !== undefined) {
      updateChanges.summary = changes.summary?.trim() || null;
    }
    if (changes.body !== undefined) updateChanges.body = changes.body ?? null;
    if (changes.media !== undefined) updateChanges.media = changes.media ?? null;
    if (changes.locale !== undefined) updateChanges.locale = normalizeLocale(changes.locale);
    if (changes.sortOrder !== undefined) updateChanges.sortOrder = normalizeSortOrder(changes.sortOrder);

    if (Object.keys(updateChanges).length === 0) return existing;

    updateChanges.updatedAt = this.now();

    const updated = await this.repository.update({
      organizationId: actor.organizationId,
      id,
      changes: updateChanges,
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.updated",
      entityId: id,
      before: { slug: existing.slug, title: existing.title, status: existing.status },
      after: { slug: updated.slug, title: updated.title, status: updated.status },
    });

    return updated;
  }

  /* ---- publish ---- */

  async publish(actor: ContentActor, id: string): Promise<LandingContent> {
    const existing = await this.get(actor, id);

    if (existing.status === "published") {
      throw new ContentServiceError("already_published", "content is already published");
    }
    if (existing.status === "revoked") {
      throw new ContentServiceError("invalid_status", "revoked content cannot be republished");
    }

    const now = this.now();
    const updated = await this.repository.update({
      organizationId: actor.organizationId,
      id,
      changes: {
        status: "published" as const,
        version: existing.version + 1,
        publishedAt: now,
        revokedAt: null,
        publishedByUserId: actor.userId,
        revokedByUserId: null,
        updatedAt: now,
      },
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.published",
      entityId: id,
      before: { status: existing.status, version: existing.version },
      after: { status: "published", version: updated.version, publishedAt: now.toISOString() },
    });

    return updated;
  }

  /* ---- revoke ---- */

  async revoke(actor: ContentActor, id: string): Promise<LandingContent> {
    const existing = await this.get(actor, id);

    if (existing.status !== "published") {
      throw new ContentServiceError("not_published", "only published content can be revoked");
    }

    const now = this.now();
    const updated = await this.repository.update({
      organizationId: actor.organizationId,
      id,
      changes: {
        status: "revoked" as const,
        revokedAt: now,
        revokedByUserId: actor.userId,
        updatedAt: now,
      },
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.revoked",
      entityId: id,
      before: { status: "published", version: existing.version },
      after: { status: "revoked", revokedAt: now.toISOString() },
    });

    return updated;
  }

  /* ---- reorder ---- */

  async reorder(actor: ContentActor, kind: ContentKind, items: ReorderItem[]): Promise<void> {
    if (!items.length) return;

    for (const item of items) {
      if (!item.id) throw new ContentServiceError("invalid_input", "reorder item id required");
      if (!Number.isInteger(item.sortOrder)) {
        throw new ContentServiceError("invalid_input", "reorder sort_order invalid");
      }
    }

    const updates = items.map((item) => ({
      id: item.id,
      changes: { sortOrder: item.sortOrder, updatedAt: this.now() },
    }));

    await this.repository.updateMany({
      organizationId: actor.organizationId,
      updates,
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.reordered",
      entityId: kind,
      after: { kind, count: items.length, sortOrder: items.map((i) => ({ id: i.id, order: i.sortOrder })) },
    });
  }

  /* ---- remove (soft: set status to draft or archive) ---- */

  async remove(actor: ContentActor, id: string): Promise<LandingContent> {
    const existing = await this.get(actor, id);

    if (existing.status === "published") {
      throw new ContentServiceError("invalid_status", "content must be revoked before deletion");
    }

    const now = this.now();
    const updated = await this.repository.update({
      organizationId: actor.organizationId,
      id,
      changes: {
        status: "revoked" as const,
        revokedAt: now,
        revokedByUserId: actor.userId,
        updatedAt: now,
      },
    });

    await this.audit({
      organizationId: actor.organizationId,
      actorUserId: actor.userId,
      action: "content.removed",
      entityId: id,
      before: { status: existing.status, version: existing.version },
      after: { status: "revoked" },
    });

    return updated;
  }
}
