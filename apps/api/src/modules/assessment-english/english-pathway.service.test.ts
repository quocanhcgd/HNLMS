import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnglishPathwayError, EnglishPathwayService } from "./english-pathway.service";
import { InMemoryEnglishPathwayRepository } from "./in-memory-english-pathway-repository";

const now = new Date("2026-08-22T08:00:00.000Z");
const actor = { userId: "teacher-1", organizationId: "org-1", canReviewEnglishPathway: true };

describe("T087 English pathway workflow", () => {
  let repository: InMemoryEnglishPathwayRepository;
  let audit: ReturnType<typeof vi.fn>;
  let service: EnglishPathwayService;

  beforeEach(() => {
    repository = new InMemoryEnglishPathwayRepository();
    repository.placementRules.push({
      id: "rule-1",
      organizationId: "org-1",
      pathwayId: "pathway-1",
      status: "active",
      thresholds: [
        { levelCode: "B2", minPercent: 80 },
        { levelCode: "B1", minPercent: 65 },
        { levelCode: "A2", minPercent: 45 },
        { levelCode: "A1", minPercent: 0 },
      ],
      skillWeights: { listening: 1, speaking: 1.2, reading: 1, writing: 1.2 },
    });
    audit = vi.fn(async () => undefined);
    let n = 0;
    service = new EnglishPathwayService(repository, audit, () => `record-${++n}`, () => now);
  });

  it("calculates four-skill placement and stores skill records", async () => {
    const decision = await service.calculatePlacement(actor, {
      studentId: "student-1",
      ruleId: "rule-1",
      sourceRef: "assessment-result-1",
      skills: [
        { skill: "listening", score: 8, maxScore: 10, confidence: 90 },
        { skill: "speaking", score: 6, maxScore: 10, confidence: 70 },
        { skill: "reading", score: 7, maxScore: 10, confidence: 88 },
        { skill: "writing", score: 5, maxScore: 10, confidence: 66 },
      ],
    });

    expect(decision).toMatchObject({ studentId: "student-1", overallLevel: "A2", recordIds: ["record-1", "record-2", "record-3", "record-4"] });
    expect(decision.skills.reading.levelCode).toBe("B1");
    expect(repository.skillRecords).toHaveLength(4);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ action: "english.placement-calculated" }));
  });

  it("derives progress from latest records and flags low-confidence review", async () => {
    await service.calculatePlacement(actor, {
      studentId: "student-1",
      ruleId: "rule-1",
      skills: [
        { skill: "listening", score: 4, maxScore: 10, confidence: 55 },
        { skill: "speaking", score: 5, maxScore: 10, confidence: 65 },
        { skill: "reading", score: 7, maxScore: 10, confidence: 75 },
        { skill: "writing", score: 5, maxScore: 10, confidence: 65 },
      ],
    });

    const progress = await service.getProgress(actor, "student-1");

    expect(progress.needsManualReview).toBe(true);
    expect(progress.skills.listening.confidence).toBe(55);
  });

  it("records manual review as the latest skill level", async () => {
    await service.calculatePlacement(actor, {
      studentId: "student-1",
      ruleId: "rule-1",
      skills: [
        { skill: "listening", score: 4, maxScore: 10, confidence: 55 },
        { skill: "speaking", score: 5, maxScore: 10, confidence: 65 },
        { skill: "reading", score: 7, maxScore: 10, confidence: 75 },
        { skill: "writing", score: 5, maxScore: 10, confidence: 65 },
      ],
    });
    service = new EnglishPathwayService(repository, audit, () => "manual-1", () => new Date("2026-08-22T09:00:00.000Z"));
    await service.recordManualReview(actor, {
      studentId: "student-1",
      skill: "listening",
      levelCode: "A2",
      score: 62,
      note: "Nghe hiểu tốt hơn khi có ngữ cảnh lớp học.",
    });

    const progress = await service.getProgress(actor, "student-1");

    expect(progress.skills.listening.levelCode).toBe("A2");
    expect(progress.skills.listening.confidence).toBe(100);
    expect(audit).toHaveBeenLastCalledWith(expect.objectContaining({ action: "english.manual-review-recorded" }));
  });

  it("requires four skills and review permission", async () => {
    await expect(
      service.calculatePlacement({ ...actor, canReviewEnglishPathway: false }, { studentId: "student-1", ruleId: "rule-1", skills: [] }),
    ).rejects.toMatchObject({ code: "forbidden" } satisfies Partial<EnglishPathwayError>);
    await expect(
      service.calculatePlacement(actor, { studentId: "student-1", ruleId: "rule-1", skills: [{ skill: "reading", score: 8, maxScore: 10 }] }),
    ).rejects.toMatchObject({ code: "invalid_input" } satisfies Partial<EnglishPathwayError>);
  });
});
