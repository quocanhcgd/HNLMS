"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessmentAnswerSchema = exports.questionTypeDefinitionSchema = exports.lessonDocumentSchema = exports.lessonBlockSchema = exports.mediaAssetSchema = exports.mediaStateSchema = exports.mediaKindSchema = exports.organizationScopeSchema = exports.isoDateSchema = exports.idSchema = void 0;
exports.parseLessonDocument = parseLessonDocument;
exports.parseAssessmentAnswer = parseAssessmentAnswer;
const zod_1 = require("zod");
exports.idSchema = zod_1.z.string().min(1);
exports.isoDateSchema = zod_1.z.string().datetime({ offset: true });
exports.organizationScopeSchema = zod_1.z.object({ organizationId: exports.idSchema, branchId: exports.idSchema.optional() });
exports.mediaKindSchema = zod_1.z.enum(["image", "audio", "video", "document", "slide", "attachment"]);
exports.mediaStateSchema = zod_1.z.enum(["initiated", "uploading", "uploaded", "scanning", "processing", "ready", "rejected", "failed"]);
exports.mediaAssetSchema = zod_1.z.object({
    id: exports.idSchema, organizationId: exports.idSchema, sourceFilename: zod_1.z.string().min(1), detectedMime: zod_1.z.string().min(1),
    sizeBytes: zod_1.z.number().int().nonnegative(), checksum: zod_1.z.string().min(1), kind: exports.mediaKindSchema,
    accessScope: zod_1.z.enum(["organization", "branch", "class", "student", "private"]), state: exports.mediaStateSchema,
    createdAt: exports.isoDateSchema,
});
exports.lessonBlockSchema = zod_1.z.object({
    id: exports.idSchema, type: zod_1.z.string().min(1), schemaVersion: zod_1.z.number().int().positive(), position: zod_1.z.number().int().nonnegative(),
    payload: zod_1.z.record(zod_1.z.unknown()), accessibility: zod_1.z.object({ alt: zod_1.z.string().optional(), caption: zod_1.z.string().optional() }).optional(),
});
exports.lessonDocumentSchema = zod_1.z.object({ id: exports.idSchema, contentId: exports.idSchema, schemaVersion: zod_1.z.number().int().positive(), locale: zod_1.z.enum(["vi", "en"]), blocks: zod_1.z.array(exports.lessonBlockSchema) });
exports.questionTypeDefinitionSchema = zod_1.z.object({
    type: zod_1.z.string().min(1), schemaVersion: zod_1.z.number().int().positive(), capabilities: zod_1.z.object({ authoring: zod_1.z.boolean(), attempt: zod_1.z.boolean(), review: zod_1.z.boolean(), scoring: zod_1.z.boolean() }),
});
exports.assessmentAnswerSchema = zod_1.z.object({ attemptId: exports.idSchema, itemId: exports.idSchema, saveSequence: zod_1.z.number().int().positive(), payload: zod_1.z.unknown(), mediaAssetId: exports.idSchema.optional() });
function parseLessonDocument(input) { return exports.lessonDocumentSchema.parse(input); }
function parseAssessmentAnswer(input) { return exports.assessmentAnswerSchema.parse(input); }
