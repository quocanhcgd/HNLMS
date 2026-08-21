import { z } from "zod";

export const idSchema = z.string().min(1);
export const isoDateSchema = z.string().datetime({ offset: true });
export const organizationScopeSchema = z.object({ organizationId: idSchema, branchId: idSchema.optional() });

export const mediaKindSchema = z.enum(["image", "audio", "video", "document", "slide", "attachment"]);
export const mediaStateSchema = z.enum([
  "initiated",
  "uploading",
  "uploaded",
  "scanning",
  "processing",
  "ready",
  "rejected",
  "failed",
]);
export const mediaAssetSchema = z.object({
  id: idSchema,
  organizationId: idSchema,
  sourceFilename: z.string().min(1),
  detectedMime: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  checksum: z.string().min(1),
  kind: mediaKindSchema,
  accessScope: z.enum(["organization", "branch", "class", "student", "private"]),
  state: mediaStateSchema,
  createdAt: isoDateSchema,
});

export const lessonBlockSchema = z.object({
  id: idSchema,
  type: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  position: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
  accessibility: z.object({ alt: z.string().optional(), caption: z.string().optional() }).optional(),
});
export const lessonDocumentSchema = z.object({
  id: idSchema,
  contentId: idSchema,
  schemaVersion: z.number().int().positive(),
  locale: z.enum(["vi", "en"]),
  blocks: z.array(lessonBlockSchema),
});

export const questionTypeDefinitionSchema = z.object({
  type: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  capabilities: z.object({ authoring: z.boolean(), attempt: z.boolean(), review: z.boolean(), scoring: z.boolean() }),
});
export const assessmentAnswerSchema = z.object({
  attemptId: idSchema,
  itemId: idSchema,
  saveSequence: z.number().int().positive(),
  payload: z.unknown(),
  mediaAssetId: idSchema.optional(),
});

export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonDocument = z.infer<typeof lessonDocumentSchema>;
export type QuestionTypeDefinition = z.infer<typeof questionTypeDefinitionSchema>;
export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>;

export function parseLessonDocument(input: unknown): LessonDocument {
  return lessonDocumentSchema.parse(input);
}
export function parseAssessmentAnswer(input: unknown): AssessmentAnswer {
  return assessmentAnswerSchema.parse(input);
}
export * from "./remote-command";
