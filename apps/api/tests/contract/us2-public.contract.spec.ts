import { describe, expect, it, vi } from "vitest";
import { InMemoryContentRepository, LandingContentService } from "../../src/modules/marketing-admission/content";
import {
  ConsultationService,
  InMemoryConsultationIdempotencyStore,
  InMemoryConsultationRepository,
} from "../../src/modules/marketing-admission/consultation/consultation.service";

const actor = { userId: "admin-a", organizationId: "org-a" };
const now = new Date("2026-08-21T12:00:00.000Z");

describe("US2 public acquisition contract", () => {
  it("exposes content only while it is published", async () => {
    const repository = new InMemoryContentRepository();
    const service = new LandingContentService(
      repository,
      async () => undefined,
      () => "content-1",
      () => now,
    );

    const draft = await service.create(actor, {
      kind: "course",
      slug: "ielts-foundation",
      title: "IELTS Foundation",
      summary: "Published catalog contract",
    });

    expect(await service.list(actor, { status: "published" })).toEqual([]);

    const published = await service.publish(actor, draft.id);
    expect(published).toMatchObject({ status: "published", version: 2, publishedByUserId: actor.userId });
    expect(await service.list(actor, { status: "published" })).toEqual([
      expect.objectContaining({ id: draft.id, slug: "ielts-foundation" }),
    ]);

    await service.revoke(actor, draft.id);
    expect(await service.list(actor, { status: "published" })).toEqual([]);
  });

  it("keeps public content queries inside organization scope", async () => {
    const repository = new InMemoryContentRepository();
    const service = new LandingContentService(
      repository,
      async () => undefined,
      () => "content-a",
      () => now,
    );
    const draft = await service.create(actor, {
      kind: "news",
      slug: "opening-news",
      title: "Opening news",
    });
    await service.publish(actor, draft.id);

    await expect(service.get({ userId: "admin-b", organizationId: "org-b" }, draft.id)).rejects.toMatchObject({
      code: "not_found",
    });
    expect(await service.list({ userId: "admin-b", organizationId: "org-b" }, { status: "published" })).toEqual([]);
  });

  it("persists consent and source once for an idempotent consultation", async () => {
    const repository = new InMemoryConsultationRepository();
    const audit = vi.fn(async () => undefined);
    const service = new ConsultationService(
      repository,
      new InMemoryConsultationIdempotencyStore(),
      audit,
      () => "consultation-1",
      () => now,
    );
    const request = {
      organizationId: "org-a",
      correlationId: "corr-1",
      input: {
        fullName: "Nguyen Minh Anh",
        phone: "090 123 4567",
        email: "minhanh@example.com",
        interest: "ielts",
        branchId: "branch-a",
        message: "Muc tieu IELTS 7.0",
        source: "public-consultation-form",
        consent: true,
        clientSubmissionKey: "submission-1",
      },
    } as const;

    const first = await service.submit(request);
    const duplicate = await service.submit(request);

    expect(duplicate).toEqual(first);
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0]).toMatchObject({
      organizationId: "org-a",
      source: "public-consultation-form",
      branchId: "branch-a",
      consentedAt: now,
    });
    expect(audit).toHaveBeenCalledTimes(1);
  });

  it("rejects a consultation without consent before persisting it", async () => {
    const repository = new InMemoryConsultationRepository();
    const service = new ConsultationService(repository, new InMemoryConsultationIdempotencyStore());

    await expect(
      service.submit({
        organizationId: "org-a",
        correlationId: "corr-no-consent",
        input: {
          fullName: "Nguyen Minh Anh",
          phone: "090 123 4567",
          interest: "ielts",
          source: "public-consultation-form",
          consent: false,
          clientSubmissionKey: "submission-no-consent",
        },
      }),
    ).rejects.toMatchObject({ code: "consent_required" });
    expect(repository.records).toEqual([]);
  });
});
