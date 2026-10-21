import type { ProgramCompetencyBlueprint } from "@hnlms/domain-contracts";
import type { ProgramCompetencyRepository } from "./program-competency.service";

export class InMemoryProgramCompetencyRepository implements ProgramCompetencyRepository {
  readonly blueprints: ProgramCompetencyBlueprint[];

  constructor(blueprints: ProgramCompetencyBlueprint[] = createDefaultProgramBlueprints()) {
    this.blueprints = blueprints.map((blueprint) => structuredClone(blueprint));
  }

  async listBlueprints(input: { organizationId: string }) {
    return structuredClone(this.blueprints.filter((blueprint) => blueprint.organizationId === input.organizationId));
  }

  async findBlueprint(input: { organizationId: string; blueprintId: string; version?: number }) {
    const blueprint = this.blueprints.find((candidate) =>
      candidate.blueprintId === input.blueprintId &&
      (input.version === undefined || candidate.version === input.version) &&
      candidate.organizationId === input.organizationId);
    return blueprint ? structuredClone(blueprint) : null;
  }

  async saveBlueprint(input: ProgramCompetencyBlueprint) {
    if (this.blueprints.some((blueprint) => blueprint.blueprintId === input.blueprintId)) throw new Error("blueprint_id_already_exists");
    const saved = structuredClone(input);
    this.blueprints.push(saved);
    return structuredClone(saved);
  }

  async publishBlueprint(input: { organizationId: string; blueprintId: string; publishedAt: string }) {
    const index = this.blueprints.findIndex((blueprint) => blueprint.blueprintId === input.blueprintId);
    if (index < 0) throw new Error("blueprint_not_found");
    const published = { ...this.blueprints[index]!, status: "published" as const, publishedAt: input.publishedAt };
    this.blueprints[index] = published;
    return structuredClone(published);
  }
}

function rubric(name: string, max = 100) {
  return [{ code: "performance", name, weight: 1, levels: [
    { code: "needs_support", label: "Cần hỗ trợ", minScore: 0, maxScore: max * 0.59, descriptor: "Chưa ổn định; cần hướng dẫn theo bước." },
    { code: "meets", label: "Đạt", minScore: max * 0.6, maxScore: max * 0.79, descriptor: "Đáp ứng yêu cầu cơ bản của chương trình." },
    { code: "exceeds", label: "Vượt", minScore: max * 0.8, maxScore: max, descriptor: "Vận dụng linh hoạt và giải thích được lựa chọn." },
  ] }];
}

function definition(code: string, name: string, type: "skill" | "knowledge", scaleMax = 100) {
  return {
    code, name, type, required: true, version: 1,
    scoreScale: { min: 0, max: scaleMax, step: scaleMax === 100 ? 1 : 0.5, unit: "điểm" },
    rubric: rubric(name, scaleMax),
    normalizationPolicy: { version: code + "-v1", method: "linear_percent" as const, sourceMin: 0, sourceMax: scaleMax, targetMin: 0, targetMax: 100 },
  };
}

function createDefaultProgramBlueprints(): ProgramCompetencyBlueprint[] {
  const now = "2026-08-25T00:00:00.000Z";
  return [
    makeBlueprint("bp-english-teen-b1", "org-1", "subject-english", "Tiếng Anh", "program-teen-b1", "Teen B1", [
      definition("listening", "Nghe", "skill"), definition("speaking", "Nói", "skill"), definition("reading", "Đọc", "skill"), definition("writing", "Viết", "skill"),
    ], now),
    makeBlueprint("bp-math-foundation", "org-1", "subject-math", "Toán", "program-math-foundation", "Nền tảng THCS", [
      definition("algebra", "Đại số", "knowledge", 10), definition("geometry", "Hình học", "knowledge", 10), definition("problem-solving", "Giải quyết vấn đề", "skill", 10),
    ], now),
    makeBlueprint("bp-literature-grade-10", "org-1", "subject-literature", "Ngữ văn", "program-literature-grade-10", "Luyện thi 10", [
      definition("reading-comprehension", "Đọc hiểu", "knowledge", 10), definition("argumentation", "Lập luận", "skill", 10), definition("evidence-use", "Sử dụng dẫn chứng", "skill", 10),
    ], now),
  ];
}

function makeBlueprint(
  blueprintId: string,
  organizationId: string,
  subjectId: string,
  subjectName: string,
  programId: string,
  programName: string,
  competencyDefinitions: ReturnType<typeof definition>[],
  now: string,
): ProgramCompetencyBlueprint {
  return {
    blueprintId, organizationId, subjectId, subjectName, programId, programName, version: 1, status: "published",
    competencyDefinitions,
    placementThresholds: [
      { minScore: 0, maxScore: 59, levelCode: "needs_support" },
      { minScore: 60, maxScore: 79, levelCode: "meets" },
      { minScore: 80, maxScore: 100, levelCode: "exceeds" },
    ],
    targetOutcomes: competencyDefinitions.map((item) => ({ competencyCode: item.code, targetLabel: "meets", targetScore: 75 })),
    createdAt: now,
    publishedAt: now,
  };
}
