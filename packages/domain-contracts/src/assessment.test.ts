import { describe, expect, it } from "vitest";
import { parseAssessmentBlueprint, parseCompetencyEvidence } from "./assessment";
import { normalizeCompetencyScore, parseProgramCompetencyBlueprint } from "./program-competency";

describe("generic assessment contracts", () => {
  it("requires subject, program and a versioned competency blueprint", () => {
    expect(
      parseAssessmentBlueprint({
        version: 2,
        subjectId: "subject-math",
        programId: "program-foundation",
        competencyGroups: [{ code: "algebra", name: "Đại số", required: true }],
        scoreScale: { min: 0, max: 100 },
        normalizationPolicyVersion: "math-foundation-v2",
      }),
    ).toMatchObject({ subjectId: "subject-math", programId: "program-foundation", version: 2 });

    expect(() =>
      parseAssessmentBlueprint({
        version: 1,
        competencyGroups: [{ code: "reading", name: "Reading", required: true }],
        scoreScale: { min: 0, max: 100 },
        normalizationPolicyVersion: "english-v1",
      }),
    ).toThrow();
  });

  it("keeps evidence source and publication state explicit", () => {
    const evidence = parseCompetencyEvidence({
      id: "evidence-1",
      organizationId: "org-1",
      studentId: "student-1",
      subjectId: "subject-literature",
      programId: "program-foundation",
      blueprintVersion: 1,
      competencyCode: "reading-comprehension",
      sourceType: "teacher_review",
      sourceId: "review-1",
      status: "pending_review",
    });

    expect(evidence).toMatchObject({ sourceType: "teacher_review", status: "pending_review" });
  });

  it("validates rubric, normalization and target outcome references", () => {
    const blueprint = parseProgramCompetencyBlueprint({
      blueprintId: "bp-math-1",
      organizationId: "org-1",
      subjectId: "subject-math",
      subjectName: "Toán",
      programId: "program-foundation",
      programName: "Nền tảng THCS",
      version: 1,
      status: "draft",
      competencyDefinitions: [{
        code: "algebra",
        name: "Đại số",
        type: "knowledge",
        required: true,
        version: 1,
        scoreScale: { min: 0, max: 10, step: 0.5, unit: "điểm" },
        rubric: [{ code: "reasoning", name: "Lập luận", weight: 1, levels: [
          { code: "basic", label: "Cơ bản", minScore: 0, maxScore: 5, descriptor: "Nhận diện được phương pháp." },
          { code: "good", label: "Khá", minScore: 5.1, maxScore: 10, descriptor: "Giải thích được các bước." },
        ] }],
        normalizationPolicy: { version: "math-v1", method: "linear_percent", sourceMin: 0, sourceMax: 10, targetMin: 0, targetMax: 100 },
      }],
      placementThresholds: [{ minScore: 0, maxScore: 100, levelCode: "foundation" }],
      targetOutcomes: [{ competencyCode: "algebra", targetLabel: "Khá", targetScore: 75 }],
      createdAt: "2026-08-25T00:00:00.000Z",
    });
    expect(blueprint.competencyDefinitions[0]?.rubric[0]?.levels).toHaveLength(2);
    expect(normalizeCompetencyScore(7.5, blueprint.competencyDefinitions[0]!.normalizationPolicy)).toBe(75);
    expect(() => parseProgramCompetencyBlueprint({ ...blueprint, targetOutcomes: [{ competencyCode: "geometry", targetLabel: "Khá" }] })).toThrow();
  });

  it("supports band normalization for levels", () => {
    expect(normalizeCompetencyScore(82, {
      version: "english-v1", method: "band", sourceMin: 0, sourceMax: 100, targetMin: 0, targetMax: 100,
      bands: [{ minScore: 0, maxScore: 59, levelCode: "A1" }, { minScore: 60, maxScore: 100, levelCode: "A2" }],
    })).toBe("A2");
  });
});
