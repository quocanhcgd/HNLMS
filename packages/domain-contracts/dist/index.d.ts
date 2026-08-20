import { z } from "zod";
export declare const idSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const organizationScopeSchema: z.ZodObject<{
    organizationId: z.ZodString;
    branchId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    organizationId: string;
    branchId?: string | undefined;
}, {
    organizationId: string;
    branchId?: string | undefined;
}>;
export declare const mediaKindSchema: z.ZodEnum<["image", "audio", "video", "document", "slide", "attachment"]>;
export declare const mediaStateSchema: z.ZodEnum<["initiated", "uploading", "uploaded", "scanning", "processing", "ready", "rejected", "failed"]>;
export declare const mediaAssetSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    sourceFilename: z.ZodString;
    detectedMime: z.ZodString;
    sizeBytes: z.ZodNumber;
    checksum: z.ZodString;
    kind: z.ZodEnum<["image", "audio", "video", "document", "slide", "attachment"]>;
    accessScope: z.ZodEnum<["organization", "branch", "class", "student", "private"]>;
    state: z.ZodEnum<["initiated", "uploading", "uploaded", "scanning", "processing", "ready", "rejected", "failed"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    state: "failed" | "ready" | "rejected" | "initiated" | "uploading" | "uploaded" | "scanning" | "processing";
    organizationId: string;
    sourceFilename: string;
    detectedMime: string;
    sizeBytes: number;
    checksum: string;
    kind: "attachment" | "audio" | "video" | "image" | "document" | "slide";
    accessScope: "private" | "organization" | "class" | "branch" | "student";
    createdAt: string;
}, {
    id: string;
    state: "failed" | "ready" | "rejected" | "initiated" | "uploading" | "uploaded" | "scanning" | "processing";
    organizationId: string;
    sourceFilename: string;
    detectedMime: string;
    sizeBytes: number;
    checksum: string;
    kind: "attachment" | "audio" | "video" | "image" | "document" | "slide";
    accessScope: "private" | "organization" | "class" | "branch" | "student";
    createdAt: string;
}>;
export declare const lessonBlockSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    schemaVersion: z.ZodNumber;
    position: z.ZodNumber;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    accessibility: z.ZodOptional<z.ZodObject<{
        alt: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        caption?: string | undefined;
        alt?: string | undefined;
    }, {
        caption?: string | undefined;
        alt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    id: string;
    position: number;
    schemaVersion: number;
    payload: Record<string, unknown>;
    accessibility?: {
        caption?: string | undefined;
        alt?: string | undefined;
    } | undefined;
}, {
    type: string;
    id: string;
    position: number;
    schemaVersion: number;
    payload: Record<string, unknown>;
    accessibility?: {
        caption?: string | undefined;
        alt?: string | undefined;
    } | undefined;
}>;
export declare const lessonDocumentSchema: z.ZodObject<{
    id: z.ZodString;
    contentId: z.ZodString;
    schemaVersion: z.ZodNumber;
    locale: z.ZodEnum<["vi", "en"]>;
    blocks: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        schemaVersion: z.ZodNumber;
        position: z.ZodNumber;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        accessibility: z.ZodOptional<z.ZodObject<{
            alt: z.ZodOptional<z.ZodString>;
            caption: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            caption?: string | undefined;
            alt?: string | undefined;
        }, {
            caption?: string | undefined;
            alt?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        id: string;
        position: number;
        schemaVersion: number;
        payload: Record<string, unknown>;
        accessibility?: {
            caption?: string | undefined;
            alt?: string | undefined;
        } | undefined;
    }, {
        type: string;
        id: string;
        position: number;
        schemaVersion: number;
        payload: Record<string, unknown>;
        accessibility?: {
            caption?: string | undefined;
            alt?: string | undefined;
        } | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    schemaVersion: number;
    contentId: string;
    locale: "vi" | "en";
    blocks: {
        type: string;
        id: string;
        position: number;
        schemaVersion: number;
        payload: Record<string, unknown>;
        accessibility?: {
            caption?: string | undefined;
            alt?: string | undefined;
        } | undefined;
    }[];
}, {
    id: string;
    schemaVersion: number;
    contentId: string;
    locale: "vi" | "en";
    blocks: {
        type: string;
        id: string;
        position: number;
        schemaVersion: number;
        payload: Record<string, unknown>;
        accessibility?: {
            caption?: string | undefined;
            alt?: string | undefined;
        } | undefined;
    }[];
}>;
export declare const questionTypeDefinitionSchema: z.ZodObject<{
    type: z.ZodString;
    schemaVersion: z.ZodNumber;
    capabilities: z.ZodObject<{
        authoring: z.ZodBoolean;
        attempt: z.ZodBoolean;
        review: z.ZodBoolean;
        scoring: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        authoring: boolean;
        attempt: boolean;
        review: boolean;
        scoring: boolean;
    }, {
        authoring: boolean;
        attempt: boolean;
        review: boolean;
        scoring: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    type: string;
    schemaVersion: number;
    capabilities: {
        authoring: boolean;
        attempt: boolean;
        review: boolean;
        scoring: boolean;
    };
}, {
    type: string;
    schemaVersion: number;
    capabilities: {
        authoring: boolean;
        attempt: boolean;
        review: boolean;
        scoring: boolean;
    };
}>;
export declare const assessmentAnswerSchema: z.ZodObject<{
    attemptId: z.ZodString;
    itemId: z.ZodString;
    saveSequence: z.ZodNumber;
    payload: z.ZodUnknown;
    mediaAssetId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    attemptId: string;
    itemId: string;
    saveSequence: number;
    payload?: unknown;
    mediaAssetId?: string | undefined;
}, {
    attemptId: string;
    itemId: string;
    saveSequence: number;
    payload?: unknown;
    mediaAssetId?: string | undefined;
}>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type LessonBlock = z.infer<typeof lessonBlockSchema>;
export type LessonDocument = z.infer<typeof lessonDocumentSchema>;
export type QuestionTypeDefinition = z.infer<typeof questionTypeDefinitionSchema>;
export type AssessmentAnswer = z.infer<typeof assessmentAnswerSchema>;
export declare function parseLessonDocument(input: unknown): LessonDocument;
export declare function parseAssessmentAnswer(input: unknown): AssessmentAnswer;
