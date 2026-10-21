import { z } from "zod";

export const learningOutputPublicationStatusSchema = z.enum(["draft", "published"]);

const competencyValueOutputSchema = z.object({
  label: z.string().min(1),
  normalizedScore: z.number().finite().optional(),
});

export const studentLearningOutputSchema = z.object({
  organizationId: z.string().min(1),
  studentId: z.string().min(1),
  enrollmentId: z.string().min(1),
  enrollmentStatus: z.enum(["pending", "active", "completed", "cancelled", "withdrawn"]),
  classId: z.string().min(1),
  className: z.string().min(1),
  branchId: z.string().min(1).nullable(),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  programId: z.string().min(1),
  programName: z.string().min(1),
  progressPercent: z.number().min(0).max(100),
  schedule: z.array(z.object({
    id: z.string().min(1),
    weekday: z.number().int().min(1).max(7),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    roomId: z.string().nullable(),
    teacherUserId: z.string().nullable(),
  })),
  materials: z.array(z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    contentType: z.string().min(1),
    version: z.number().int().positive(),
    locale: z.string().min(1),
    publishedAt: z.string().datetime({ offset: true }),
    estimatedDurationMinutes: z.number().int().positive().optional(),
    sessionId: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
  })),
  scores: z.array(z.object({
    id: z.string().min(1),
    assessmentId: z.string().min(1),
    title: z.string().min(1),
    score: z.number().finite(),
    maxScore: z.number().finite().positive(),
    weight: z.number().finite().optional(),
    recordedAt: z.string().datetime({ offset: true }),
  })),
  attendance: z.array(z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    occurredAt: z.string().datetime({ offset: true }),
    status: z.enum(["present", "late", "absent", "excused"]),
  })),
  feedback: z.array(z.object({
    id: z.string().min(1),
    authorName: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.string().datetime({ offset: true }),
  })),
  competencySummaries: z.array(z.object({
    profileId: z.string().min(1),
    competencyCode: z.string().min(1),
    competencyName: z.string().min(1),
    baseline: competencyValueOutputSchema,
    current: competencyValueOutputSchema,
    target: competencyValueOutputSchema,
    confidence: z.number().min(0).max(100),
    assessedAt: z.string().datetime({ offset: true }),
  })),
});

export const studentLearningOutputListSchema = z.array(studentLearningOutputSchema);

export const parentLearningOutputSchema = studentLearningOutputSchema.extend({
  progressPercent: z.number().min(0).max(100).nullable(),
  visibility: z.object({
    schedule: z.boolean(),
    progress: z.boolean(),
    scores: z.boolean(),
    attendance: z.boolean(),
    feedback: z.boolean(),
    competency: z.boolean(),
  }),
});

export const parentLearningOutputListSchema = z.array(parentLearningOutputSchema);

export type StudentLearningOutput = z.infer<typeof studentLearningOutputSchema>;
export type ParentLearningOutput = z.infer<typeof parentLearningOutputSchema>;

export function parseStudentLearningOutput(input: unknown): StudentLearningOutput {
  return studentLearningOutputSchema.parse(input);
}

export function parseStudentLearningOutputList(input: unknown): StudentLearningOutput[] {
  return studentLearningOutputListSchema.parse(input);
}

export function parseParentLearningOutput(input: unknown): ParentLearningOutput {
  return parentLearningOutputSchema.parse(input);
}

export function parseParentLearningOutputList(input: unknown): ParentLearningOutput[] {
  return parentLearningOutputListSchema.parse(input);
}
