import { z } from "zod";

export const assessmentSourceSchema = z.enum([
  "entrance",
  "mock",
  "practice",
  "classwork",
  "teacher_review",
  "migration",
]);
export const evidenceStatusSchema = z.enum(["draft", "pending_review", "confirmed", "superseded", "voided"]);
export const competencyPublicationStatusSchema = z.enum(["draft", "pending_publication", "published", "withdrawn"]);
export const competencyReviewStatusSchema = z.enum(["pending_review", "confirmed", "needs_support"]);

export const competencyGroupSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  required: z.boolean(),
});

export const assessmentBlueprintSchema = z.object({
  version: z.number().int().positive(),
  subjectId: z.string().min(1),
  programId: z.string().min(1),
  competencyGroups: z.array(competencyGroupSchema).min(1),
  scoreScale: z.object({ min: z.number(), max: z.number() }).refine(({ min, max }) => max > min, {
    message: "score_scale_max_must_exceed_min",
  }),
  normalizationPolicyVersion: z.string().min(1),
});

export const competencyEvidenceSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  programId: z.string().min(1),
  blueprintVersion: z.number().int().positive(),
  competencyCode: z.string().min(1),
  sourceType: assessmentSourceSchema,
  sourceId: z.string().min(1),
  classId: z.string().min(1).optional(),
  rawScore: z.number().finite().optional(),
  normalizedScore: z.number().finite().optional(),
  normalizedLevel: z.string().min(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  status: evidenceStatusSchema,
  reviewerId: z.string().min(1).optional(),
  assessedAt: z.string().datetime({ offset: true }).optional(),
  reviewedAt: z.string().datetime({ offset: true }).optional(),
  legacyRecordId: z.string().min(1).optional(),
  notes: z.record(z.unknown()).optional(),
});

const competencyValueSchema = z.object({
  label: z.string().min(1),
  normalizedScore: z.number().finite().optional(),
});

export const competencyProfileReadModelSchema = z.object({
  profileId: z.string().min(1),
  organizationId: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  programId: z.string().min(1),
  programName: z.string().min(1),
  classId: z.string().min(1),
  className: z.string().min(1),
  branchId: z.string().min(1),
  competencyCode: z.string().min(1),
  competencyName: z.string().min(1),
  baseline: competencyValueSchema,
  current: competencyValueSchema,
  target: competencyValueSchema,
  evidence: z.object({
    sourceType: assessmentSourceSchema,
    sourceId: z.string().min(1),
    sourceLabel: z.string().min(1),
    assessedAt: z.string().datetime({ offset: true }),
    summary: z.string().min(1),
  }),
  confidence: z.number().min(0).max(100),
  publicationStatus: competencyPublicationStatusSchema,
  reviewStatus: competencyReviewStatusSchema,
  teacherFeedback: z.string().min(1).optional(),
  version: z.number().int().positive(),
});

export const competencyProfileListSchema = z.array(competencyProfileReadModelSchema);

export type AssessmentBlueprint = z.infer<typeof assessmentBlueprintSchema>;
export type CompetencyEvidence = z.infer<typeof competencyEvidenceSchema>;
export type CompetencyProfileReadModel = z.infer<typeof competencyProfileReadModelSchema>;
export type CompetencyPublicationStatus = z.infer<typeof competencyPublicationStatusSchema>;
export type CompetencyReviewStatus = z.infer<typeof competencyReviewStatusSchema>;

export function parseAssessmentBlueprint(input: unknown): AssessmentBlueprint {
  return assessmentBlueprintSchema.parse(input);
}

export function parseCompetencyEvidence(input: unknown): CompetencyEvidence {
  return competencyEvidenceSchema.parse(input);
}

export function parseCompetencyProfileReadModel(input: unknown): CompetencyProfileReadModel {
  return competencyProfileReadModelSchema.parse(input);
}

export function parseCompetencyProfileList(input: unknown): CompetencyProfileReadModel[] {
  return competencyProfileListSchema.parse(input);
}
