import { describe, expect, it, vi } from "vitest";
import {
  ConsultationError,
  ConsultationService,
  InMemoryConsultationIdempotencyStore,
  InMemoryConsultationRepository,
  normalizeConsultationInput,
} from "./consultation.service";

const input = {
  fullName: "  Nguyen Minh Anh  ",
  phone: "090 123 4567",
  email: "anh@example.com",
  interest: "ielts",
  message: "  Can tu van buoi toi. ",
  source: "public-consultation-form",
  consent: true,
  clientSubmissionKey: "submission-1",
};

describe("ConsultationService", () => {
  it("requires explicit consent before it persists contact data", async () => {
    const repository = new InMemoryConsultationRepository();
    const service = new ConsultationService(repository, new InMemoryConsultationIdempotencyStore());

    await expect(
      service.submit({ organizationId: "org-a", correlationId: "request-a", input: { ...input, consent: false } }),
    ).rejects.toMatchObject({ code: "consent_required" } satisfies Partial<ConsultationError>);
    expect(repository.records).toEqual([]);
  });

  it("normalizes contact details and records the consent timestamp", async () => {
    const repository = new InMemoryConsultationRepository();
    const audit = vi.fn(async () => undefined);
    const now = new Date("2026-08-21T08:00:00Z");
    const service = new ConsultationService(
      repository,
      new InMemoryConsultationIdempotencyStore(),
      audit,
      () => "consultation-1",
      () => now,
    );

    await expect(service.submit({ organizationId: "org-a", correlationId: "request-a", input })).resolves.toEqual({
      consultationId: "consultation-1",
      status: "accepted",
    });
    expect(repository.records).toMatchObject([
      { fullName: "Nguyen Minh Anh", message: "Can tu van buoi toi.", consentedAt: now, organizationId: "org-a" },
    ]);
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "consultation.submitted", correlationId: "request-a" }),
    );
  });

  it("returns the original accepted response for a matching retry without creating another consultation", async () => {
    const repository = new InMemoryConsultationRepository();
    const service = new ConsultationService(
      repository,
      new InMemoryConsultationIdempotencyStore(),
      async () => undefined,
      () => "consultation-1",
    );
    const request = { organizationId: "org-a", correlationId: "request-a", input };

    const first = await service.submit(request);
    const retry = await service.submit(request);

    expect(retry).toEqual(first);
    expect(repository.records).toHaveLength(1);
  });

  it("rejects invalid contact inputs before creating an idempotency record", () => {
    expect(() => normalizeConsultationInput({ ...input, phone: "invalid" })).toThrow("phone_invalid");
    expect(() => normalizeConsultationInput({ ...input, email: "not-an-email" })).toThrow("email_invalid");
  });
});
