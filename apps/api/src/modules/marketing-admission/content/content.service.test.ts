import { describe, expect, it, vi } from "vitest";
import {
  LandingContentService,
  ContentServiceError,
  type ContentActor,
  type ContentRepository,
} from "./content.service";
import { InMemoryContentRepository } from "./in-memory-content-repository";
import { type LandingContent } from "../schema";

/* ---------- helpers ---------- */

const orgActor: ContentActor = { userId: "admin-1", organizationId: "org-a" };

function makeContent(overrides: Record<string, unknown> = {}) {
  return {
    id: "content-1",
    organizationId: "org-a",
    kind: "course" as const,
    slug: "ielts-foundation",
    title: "IELTS Foundation",
    summary: "Khoá học nền tảng IELTS",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 1,
    version: 1,
    status: "draft" as const,
    publishedAt: null,
    revokedAt: null,
    publishedByUserId: null,
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: new Date("2026-08-21T00:00:00Z"),
    updatedAt: new Date("2026-08-21T00:00:00Z"),
    ...overrides,
  };
}

function seededRepo(items = [makeContent()]): InMemoryContentRepository {
  const repo = new InMemoryContentRepository();
  for (const item of items) {
    repo.records.push(item as LandingContent);
  }
  return repo;
}

function createTestFixture(repo?: ContentRepository, audit = vi.fn(async () => undefined)) {
  const r = repo ?? seededRepo();
  return {
    svc: new LandingContentService(
      r,
      audit,
      () => "new-id",
      () => new Date("2026-08-21T12:00:00Z"),
    ),
    repo: r,
    audit,
  };
}

/* ---------- create ---------- */

describe("LandingContentService.create", () => {
  it("creates a draft with normalized slug and title", async () => {
    const { svc, repo, audit } = createTestFixture();
    const content = await svc.create(orgActor, {
      kind: "course",
      slug: "  ielts-advanced ",
      title: "  IELTS Advanced  ",
      summary: "Intro",
      locale: "vi",
    });

    expect(content.id).toBe("new-id");
    expect(content.slug).toBe("ielts-advanced");
    expect(content.title).toBe("IELTS Advanced");
    expect(content.status).toBe("draft");
    expect(content.version).toBe(1);
    expect(content.createdByUserId).toBe("admin-1");
    expect(content.sortOrder).toBe(2); // maxSort=1 + 1
    expect((repo as InMemoryContentRepository).records).toHaveLength(2); // seeded + new
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "content.created", entityId: "new-id" }));
  });

  it("rejects duplicate slug within the same organization", async () => {
    const { svc } = createTestFixture();
    await expect(
      svc.create(orgActor, {
        kind: "course",
        slug: "ielts-foundation",
        title: "Duplicate",
      }),
    ).rejects.toMatchObject({ code: "slug_taken" } satisfies Partial<ContentServiceError>);
  });

  it("allows same slug in a different organization", async () => {
    const repo = seededRepo();
    const { svc } = createTestFixture(repo);
    const otherOrg: ContentActor = { userId: "admin-2", organizationId: "org-b" };
    const content = await svc.create(otherOrg, {
      kind: "course",
      slug: "ielts-foundation",
      title: "IELTS for Org B",
    });
    expect(content.organizationId).toBe("org-b");
    expect(content.slug).toBe("ielts-foundation");
  });

  it("rejects invalid slug format", async () => {
    const { svc } = createTestFixture();
    await expect(svc.create(orgActor, { kind: "course", slug: "Invalid Slug!", title: "Test" })).rejects.toMatchObject({
      code: "invalid_input",
    });
  });

  it("rejects missing title", async () => {
    const { svc } = createTestFixture();
    await expect(svc.create(orgActor, { kind: "course", slug: "test", title: "  " })).rejects.toMatchObject({
      code: "invalid_input",
    });
  });

  it("rejects invalid locale", async () => {
    const { svc } = createTestFixture();
    await expect(
      svc.create(orgActor, { kind: "course", slug: "test", title: "Test", locale: "fr" }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("uses custom sortOrder when provided", async () => {
    const { svc } = createTestFixture();
    const content = await svc.create(orgActor, {
      kind: "news",
      slug: "news-1",
      title: "News 1",
      sortOrder: 42,
    });
    expect(content.sortOrder).toBe(42);
  });
});

/* ---------- list & get ---------- */

describe("LandingContentService.list / get", () => {
  it("returns all content for the organization sorted by sortOrder", async () => {
    const repo = seededRepo([
      makeContent({ id: "c-2", slug: "second", title: "Second", sortOrder: 2, kind: "news" }),
      makeContent({ id: "c-1", slug: "first", title: "First", sortOrder: 0, kind: "course" }),
    ]);
    const { svc } = createTestFixture(repo);
    const items = await svc.list(orgActor);
    expect(items).toHaveLength(2);
    expect(items[0]!.id).toBe("c-1");
    expect(items[1]!.id).toBe("c-2");
  });

  it("filters by kind and status", async () => {
    const repo = seededRepo([
      makeContent({ id: "c-1", kind: "course", status: "draft" }),
      makeContent({ id: "c-2", slug: "published", title: "Published", kind: "news", status: "published" }),
    ]);
    const { svc } = createTestFixture(repo);
    const courses = await svc.list(orgActor, { kind: "course" });
    expect(courses).toHaveLength(1);
    expect(courses[0]!.kind).toBe("course");

    const published = await svc.list(orgActor, { status: "published" });
    expect(published).toHaveLength(1);
  });

  it("filters by search term in title or slug", async () => {
    const repo = seededRepo([
      makeContent({ id: "c-1", slug: "ielts-foundation", title: "IELTS Foundation" }),
      makeContent({ id: "c-2", slug: "toeic-prep", title: "TOEIC Preparation", kind: "news" }),
    ]);
    const { svc } = createTestFixture(repo);
    const results = await svc.list(orgActor, { search: "toeic" });
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("toeic-prep");
  });

  it("returns empty list for unknown organization", async () => {
    const { svc } = createTestFixture();
    const items = await svc.list({ userId: "u", organizationId: "org-z" });
    expect(items).toHaveLength(0);
  });

  it("get returns existing content", async () => {
    const { svc } = createTestFixture();
    const content = await svc.get(orgActor, "content-1");
    expect(content.id).toBe("content-1");
  });

  it("get throws not_found for missing content", async () => {
    const { svc } = createTestFixture();
    await expect(svc.get(orgActor, "nonexistent")).rejects.toMatchObject({ code: "not_found" });
  });

  it("get throws not_found when content belongs to another organization", async () => {
    const { svc } = createTestFixture();
    await expect(svc.get({ userId: "u", organizationId: "org-b" }, "content-1")).rejects.toMatchObject({
      code: "not_found",
    });
  });
});

/* ---------- update ---------- */

describe("LandingContentService.update", () => {
  it("updates draft content fields and audits", async () => {
    const { svc, audit } = createTestFixture();
    const updated = await svc.update(orgActor, "content-1", {
      title: "New Title",
      summary: "Updated summary",
    });
    expect(updated.title).toBe("New Title");
    expect(updated.summary).toBe("Updated summary");
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "content.updated", entityId: "content-1" }));
  });

  it("rejects update on published content", async () => {
    const repo = seededRepo([makeContent({ status: "published" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.update(orgActor, "content-1", { title: "Nope" })).rejects.toMatchObject({
      code: "invalid_status",
    });
  });

  it("rejects update on revoked content", async () => {
    const repo = seededRepo([makeContent({ status: "revoked" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.update(orgActor, "content-1", { title: "Nope" })).rejects.toMatchObject({
      code: "invalid_status",
    });
  });

  it("rejects slug change to a taken slug", async () => {
    const repo = seededRepo([
      makeContent({ id: "c-1", slug: "slug-a", title: "A" }),
      makeContent({ id: "c-2", slug: "slug-b", title: "B", kind: "news" }),
    ]);
    const { svc } = createTestFixture(repo);
    await expect(svc.update(orgActor, "c-1", { slug: "slug-b" })).rejects.toMatchObject({
      code: "slug_taken",
    });
  });

  it("allows keeping the same slug unchanged", async () => {
    const { svc } = createTestFixture();
    const updated = await svc.update(orgActor, "content-1", { slug: "ielts-foundation" });
    expect(updated.slug).toBe("ielts-foundation");
  });

  it("returns the existing content when no changes provided", async () => {
    const { svc } = createTestFixture();
    const result = await svc.update(orgActor, "content-1", {});
    expect(result.id).toBe("content-1");
  });
});

/* ---------- publish ---------- */

describe("LandingContentService.publish", () => {
  it("transitions draft to published with incremented version", async () => {
    const { svc, audit } = createTestFixture();
    const published = await svc.publish(orgActor, "content-1");
    expect(published.status).toBe("published");
    expect(published.version).toBe(2);
    expect(published.publishedByUserId).toBe("admin-1");
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "content.published",
        before: expect.objectContaining({ status: "draft", version: 1 }),
        after: expect.objectContaining({ status: "published", version: 2 }),
      }),
    );
  });

  it("allows publish from review status", async () => {
    const repo = seededRepo([makeContent({ status: "review" })]);
    const { svc } = createTestFixture(repo);
    const published = await svc.publish(orgActor, "content-1");
    expect(published.status).toBe("published");
  });

  it("rejects publish of already published content", async () => {
    const repo = seededRepo([makeContent({ status: "published" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.publish(orgActor, "content-1")).rejects.toMatchObject({
      code: "already_published",
    });
  });

  it("rejects publish of revoked content", async () => {
    const repo = seededRepo([makeContent({ status: "revoked" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.publish(orgActor, "content-1")).rejects.toMatchObject({
      code: "invalid_status",
    });
  });
});

/* ---------- revoke ---------- */

describe("LandingContentService.revoke", () => {
  it("transitions published to revoked", async () => {
    const repo = seededRepo([makeContent({ status: "published", version: 3 })]);
    const { svc, audit } = createTestFixture(repo);
    const revoked = await svc.revoke(orgActor, "content-1");
    expect(revoked.status).toBe("revoked");
    expect(revoked.revokedByUserId).toBe("admin-1");
    expect(revoked.revokedAt).toBeInstanceOf(Date);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "content.revoked",
        before: expect.objectContaining({ status: "published" }),
        after: expect.objectContaining({ status: "revoked" }),
      }),
    );
  });

  it("rejects revoke of draft content", async () => {
    const { svc } = createTestFixture();
    await expect(svc.revoke(orgActor, "content-1")).rejects.toMatchObject({ code: "not_published" });
  });

  it("rejects revoke of already revoked content", async () => {
    const repo = seededRepo([makeContent({ status: "revoked" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.revoke(orgActor, "content-1")).rejects.toMatchObject({ code: "not_published" });
  });
});

/* ---------- reorder ---------- */

describe("LandingContentService.reorder", () => {
  it("updates sort orders for a set of items and audits", async () => {
    const repo = seededRepo([
      makeContent({ id: "c-1", sortOrder: 0 }),
      makeContent({ id: "c-2", slug: "c-2", title: "C2", sortOrder: 1, kind: "news" }),
    ]);
    const { svc, audit } = createTestFixture(repo);
    await svc.reorder(orgActor, "course", [
      { id: "c-1", sortOrder: 5 },
      { id: "c-2", sortOrder: 0 },
    ]);

    const items = await svc.list(orgActor);
    const c1 = items.find((i) => i.id === "c-1")!;
    const c2 = items.find((i) => i.id === "c-2")!;
    expect(c1.sortOrder).toBe(5);
    expect(c2.sortOrder).toBe(0);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "content.reordered", entityId: "course" }));
  });

  it("returns silently for empty items", async () => {
    const { svc, audit } = createTestFixture();
    await svc.reorder(orgActor, "course", []);
    expect(audit).not.toHaveBeenCalled();
  });

  it("rejects items without id", async () => {
    const { svc } = createTestFixture();
    await expect(svc.reorder(orgActor, "course", [{ id: "", sortOrder: 0 }])).rejects.toMatchObject({
      code: "invalid_input",
    });
  });
});

/* ---------- remove ---------- */

describe("LandingContentService.remove", () => {
  it("revokes draft content via remove", async () => {
    const { svc, audit } = createTestFixture();
    const removed = await svc.remove(orgActor, "content-1");
    expect(removed.status).toBe("revoked");
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "content.removed" }));
  });

  it("rejects remove of published content (must revoke first)", async () => {
    const repo = seededRepo([makeContent({ status: "published" })]);
    const { svc } = createTestFixture(repo);
    await expect(svc.remove(orgActor, "content-1")).rejects.toMatchObject({
      code: "invalid_status",
    });
  });
});
