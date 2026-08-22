import { describe, expect, it, vi } from "vitest";
import { EnglishPathwayService } from "../../src/modules/assessment-english/english-pathway.service.js";
import { InMemoryEnglishPathwayRepository } from "../../src/modules/assessment-english/in-memory-english-pathway-repository.js";

const now = new Date("2026-08-22T09:00:00.000Z");
const actor = { userId: "teacher-1", organizationId: "org-1", canReviewEnglishPathway: true };
const repository = new InMemoryEnglishPathwayRepository();

repository.placementRules.push({
  id: "rule-1",
  organizationId: "org-1",
  pathwayId: "pathway-1",
  status: "active",
  thresholds: [
    { levelCode: "B1", minPercent: 70 },
    { levelCode: "A2", minPercent: 45 },
    { levelCode: "A1", minPercent: 0 },
  ],
  skillWeights: { listening: 1, speaking: 1.2, reading: 1, writing: 1.2 },
});

let n = 0;
const service = new EnglishPathwayService(repository, vi.fn(), () => `us9-${++n}`, () => now);

describe("US9 English pathway integration", () => {
  it("creates four-skill records from placement and keeps manual review as latest skill record", async () => {
    const decision = await service.calculatePlacement(actor, {
      studentId: "student-1",
      ruleId: "rule-1",
      skills: [
        { skill: "listening", score: 6, maxScore: 10 },
        { skill: "speaking", score: 6, maxScore: 10 },
        { skill: "reading", score: 8, maxScore: 10 },
        { skill: "writing", score: 7, maxScore: 10 },
      ],
    });
    expect(decision.recordIds).toHaveLength(4);

    const reviewService = new EnglishPathwayService(
      repository,
      vi.fn(),
      () => `us9-${++n}`,
      () => new Date("2026-08-22T10:00:00.000Z"),
    );
    await reviewService.recordManualReview(actor, {
      studentId: "student-1",
      skill: "listening",
      levelCode: "B1",
      note: "Nghe hiểu tốt hơn khi luyện trong ngữ cảnh lớp học.",
    });

    const progress = await reviewService.getProgress(actor, "student-1");
    expect(progress.skills.listening.levelCode).toBe("B1");
    expect(progress.overallLevel).toBe("A2");
  });
});
