import { z } from "zod";

export const rubricLevelSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  minScore: z.number().finite(),
  maxScore: z.number().finite(),
  descriptor: z.string().min(1),
}).refine(({ minScore, maxScore }) => maxScore >= minScore, {
  message: "rubric_level_max_must_not_be_less_than_min",
});

export const rubricCriterionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().positive(),
  levels: z.array(rubricLevelSchema).min(2),
});

export const competencyScoreScaleSchema = z.object({
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
}).refine(({ min, max }) => max > min, {
  message: "score_scale_max_must_exceed_min",
});

export const normalizationBandSchema = z.object({
  minScore: z.number().finite(),
  maxScore: z.number().finite(),
  levelCode: z.string().min(1),
}).refine(({ minScore, maxScore }) => maxScore >= minScore, {
  message: "normalization_band_max_must_not_be_less_than_min",
});

export const normalizationPolicySchema = z.object({
  version: z.string().min(1),
  method: z.enum(["linear_percent", "band", "rubric"]),
  sourceMin: z.number().finite(),
  sourceMax: z.number().finite(),
  targetMin: z.number().finite(),
  targetMax: z.number().finite(),
  bands: z.array(normalizationBandSchema).optional(),
}).refine(({ sourceMin, sourceMax }) => sourceMax > sourceMin, {
  message: "normalization_source_max_must_exceed_min",
}).refine(({ targetMin, targetMax }) => targetMax > targetMin, {
  message: "normalization_target_max_must_exceed_min",
}).superRefine((policy, context) => {
  if (policy.method === "band" && (!policy.bands || policy.bands.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "band_normalization_requires_bands", path: ["bands"] });
  }
});

export const competencyDefinitionSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["skill", "knowledge", "behavior", "composite"]),
  required: z.boolean(),
  version: z.number().int().positive(),
  scoreScale: competencyScoreScaleSchema,
  rubric: z.array(rubricCriterionSchema).min(1),
  normalizationPolicy: normalizationPolicySchema,
});

export const placementThresholdSchema = z.object({
  minScore: z.number().finite(),
  maxScore: z.number().finite(),
  levelCode: z.string().min(1),
  recommendedProgramId: z.string().min(1).optional(),
}).refine(({ minScore, maxScore }) => maxScore >= minScore, {
  message: "placement_threshold_max_must_not_be_less_than_min",
});

export const targetOutcomeSchema = z.object({
  competencyCode: z.string().min(1),
  targetLabel: z.string().min(1),
  targetScore: z.number().finite().optional(),
});

export const programCompetencyBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  organizationId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  programId: z.string().min(1),
  programName: z.string().min(1),
  version: z.number().int().positive(),
  status: z.enum(["draft", "published", "archived"]),
  competencyDefinitions: z.array(competencyDefinitionSchema).min(1),
  placementThresholds: z.array(placementThresholdSchema).min(1),
  targetOutcomes: z.array(targetOutcomeSchema).min(1),
  createdAt: z.string().datetime({ offset: true }),
  publishedAt: z.string().datetime({ offset: true }).optional(),
}).superRefine((blueprint, context) => {
  const codes = new Set(blueprint.competencyDefinitions.map((definition) => definition.code));
  const duplicate = blueprint.competencyDefinitions.find((definition, index) =>
    blueprint.competencyDefinitions.findIndex((candidate) => candidate.code === definition.code) !== index);
  if (duplicate) context.addIssue({ code: z.ZodIssueCode.custom, message: "duplicate_competency_code", path: ["competencyDefinitions"] });
  for (const outcome of blueprint.targetOutcomes) {
    if (!codes.has(outcome.competencyCode)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "target_outcome_competency_not_found", path: ["targetOutcomes"] });
    }
  }
});

export type RubricLevel = z.infer<typeof rubricLevelSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type CompetencyScoreScale = z.infer<typeof competencyScoreScaleSchema>;
export type NormalizationPolicy = z.infer<typeof normalizationPolicySchema>;
export type CompetencyDefinition = z.infer<typeof competencyDefinitionSchema>;
export type PlacementThreshold = z.infer<typeof placementThresholdSchema>;
export type TargetOutcome = z.infer<typeof targetOutcomeSchema>;
export type ProgramCompetencyBlueprint = z.infer<typeof programCompetencyBlueprintSchema>;

export function parseProgramCompetencyBlueprint(input: unknown): ProgramCompetencyBlueprint {
  return programCompetencyBlueprintSchema.parse(input);
}

export function normalizeCompetencyScore(rawScore: number, policy: NormalizationPolicy): number | string {
  if (!Number.isFinite(rawScore) || rawScore < policy.sourceMin || rawScore > policy.sourceMax) {
    throw new Error("raw_score_out_of_range");
  }
  if (policy.method === "band") {
    const band = policy.bands?.find(({ minScore, maxScore }) => rawScore >= minScore && rawScore <= maxScore);
    if (!band) throw new Error("normalization_band_not_found");
    return band.levelCode;
  }
  const ratio = (rawScore - policy.sourceMin) / (policy.sourceMax - policy.sourceMin);
  return Math.round((policy.targetMin + ratio * (policy.targetMax - policy.targetMin)) * 100) / 100;
}
