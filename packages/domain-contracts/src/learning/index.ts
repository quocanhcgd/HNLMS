import { z } from "zod";
export const LessonBlockSchema=z.object({id:z.string(),type:z.enum(["text","image","gallery","audio","video","pdf","quiz","flashcard","speaking"]),data:z.record(z.unknown())});
export const LessonDocumentSchema=z.object({schemaVersion:z.number().int().positive(),title:z.string().min(1),blocks:z.array(LessonBlockSchema)});
export type LessonDocument=z.infer<typeof LessonDocumentSchema>;export type LessonBlock=z.infer<typeof LessonBlockSchema>;
export const AnswerPayloadSchema=z.object({questionId:z.string(),value:z.unknown(),sequence:z.number().int().nonnegative()});
export const lessonMigrationRegistry={currentVersion:1,migrate:(document:unknown)=>LessonDocumentSchema.parse(document)};
