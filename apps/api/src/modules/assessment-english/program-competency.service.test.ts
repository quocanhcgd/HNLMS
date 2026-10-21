import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramCompetencyError, ProgramCompetencyService } from "./program-competency.service";
import { InMemoryProgramCompetencyRepository } from "./in-memory-program-competency-repository";

const actor = {
  userId: "academic-1",
  organizationId: "org-1",
  canManagePrograms: true,
};

describe("T090 program competency blueprints", () => {
  let repository: InMemoryProgramCompetencyRepository;
  let service: ProgramCompetencyService;
  let audit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    repository = new InMemoryProgramCompetencyRepository();
    audit = vi.fn(async () => undefined);
    service = new ProgramCompetencyService(repository, audit, () => new Date("2026-08-25T08:00:00.000Z"), () => "generated-id");
  });

  it("ships English, Mathematics and Literature blueprints with distinct competency sets", async () => {
    const blueprints = await service.listBlueprints(actor);
    expect(blueprints).toHaveLength(3);
    expect(blueprints.map((item) => item.subjectId)).toEqual(["subject-english", "subject-math", "subject-literature"]);
    expect(blueprints.find((item) => item.subjectId === "subject-english")?.competencyDefinitions.map((item) => item.code))
      .toEqual(["listening", "speaking", "reading", "writing"]);
    expect(blueprints.find((item) => item.subjectId === "subject-math")?.competencyDefinitions.map((item) => item.code))
      .toEqual(["algebra", "geometry", "problem-solving"]);
    expect(blueprints.find((item) => item.subjectId === "subject-literature")?.competencyDefinitions.map((item) => item.code))
      .toEqual(["reading-comprehension", "argumentation", "evidence-use"]);
  });

  it("normalizes scores using the selected program policy", async () => {
    const blueprint = await service.getBlueprint(actor, "bp-math-foundation");
    expect(service.normalizeScore(actor, blueprint, "algebra", 7.5)).toBe(75);
    expect(() => service.normalizeScore(actor, blueprint, "algebra", 11)).toThrow(
      expect.objectContaining({ code: "invalid_input" }) satisfies Partial<ProgramCompetencyError>,
    );
  });

  it("requires the next immutable version for a new draft and publishes it", async () => {
    const original = await service.getBlueprint(actor, "bp-math-foundation");
    const draft = { ...original, blueprintId: "bp-math-foundation-v2", version: 2 as const, status: "draft" as const, publishedAt: undefined };
    const saved = await service.createDraft(actor, draft);
    expect(saved.status).toBe("draft");
    const published = await service.publishBlueprint(actor, saved.blueprintId);
    expect(published).toMatchObject({ status: "published", version: 2, publishedAt: "2026-08-25T08:00:00.000Z" });
    expect(audit).toHaveBeenCalledTimes(2);
    await expect(service.createDraft(actor, { ...draft, blueprintId: "bad-v3", version: 4 })).rejects.toMatchObject({
      code: "invalid_input",
      message: "blueprint_version_must_be_next",
    });
  });

  it("enforces subject and program scope for reads and writes", async () => {
    const scopedActor = { ...actor, subjectIds: new Set(["subject-math"]), programIds: new Set(["program-math-foundation"]) };
    await expect(service.getBlueprint(scopedActor, "bp-english-teen-b1")).rejects.toMatchObject({
      code: "forbidden",
      message: "program_subject_scope_denied",
    });
    const math = await service.getBlueprint(scopedActor, "bp-math-foundation");
    await expect(service.createDraft(scopedActor, { ...math, blueprintId: "bp-math-v2", version: 2, status: "draft", publishedAt: undefined })).resolves.toMatchObject({ version: 2 });
  });

  it("does not allow non-managers to publish configuration", async () => {
    await expect(service.publishBlueprint({ ...actor, canManagePrograms: false }, "bp-math-foundation")).rejects.toMatchObject({
      code: "forbidden",
      message: "program_management_required",
    });
  });
});
