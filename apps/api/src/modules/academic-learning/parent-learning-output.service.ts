import type { ParentLearningOutput } from "@hnlms/domain-contracts";
import {
  StudentLearningOutputService,
  type StudentLearningOutputActor,
  type StudentLearningOutputFilters,
} from "./student-learning-output.service";

export type ParentLearningOutputPermission =
  | "view_schedule"
  | "view_progress"
  | "view_scores"
  | "view_attendance"
  | "view_feedback"
  | "view_competency";

export type ParentLearningOutputActor = {
  userId: string;
  organizationId: string;
  role: "parent";
  parentPermissionsByStudentId: ReadonlyMap<string, ReadonlySet<ParentLearningOutputPermission>>;
  /** Optional class scope resolved from active parent delegations. */
  parentClassIdsByStudentId?: ReadonlyMap<string, ReadonlySet<string>>;
};

export class ParentLearningOutputError extends Error {
  constructor(public readonly code: "forbidden" | "invalid_input" | string, message = code) {
    super(message);
    this.name = "ParentLearningOutputError";
  }
}

function permissionsFor(actor: ParentLearningOutputActor, studentId: string): ReadonlySet<ParentLearningOutputPermission> {
  if (actor.role !== "parent") {
    throw new ParentLearningOutputError("forbidden", "parent_role_required");
  }
  const permissions = actor.parentPermissionsByStudentId.get(studentId);
  if (!permissions || permissions.size === 0) {
    throw new ParentLearningOutputError("forbidden", "parent_learning_output_delegation_required");
  }
  return permissions;
}

export class ParentLearningOutputService {
  constructor(private readonly studentOutput: StudentLearningOutputService) {}

  async listForParent(
    actor: ParentLearningOutputActor,
    studentId: string,
    filters: StudentLearningOutputFilters = {},
  ): Promise<ParentLearningOutput[]> {
    const permissions = permissionsFor(actor, studentId);
    if (filters.classId && actor.parentClassIdsByStudentId) {
      const classIds = actor.parentClassIdsByStudentId.get(studentId);
      if (!classIds?.has(filters.classId)) {
        throw new ParentLearningOutputError("forbidden", "parent_class_delegation_required");
      }
    }
    const rows = await this.studentOutput.listForStudent(
      {
        userId: actor.userId,
        organizationId: actor.organizationId,
        role: "student",
        studentId,
      } satisfies StudentLearningOutputActor,
      studentId,
      filters,
    );
    const canSchedule = permissions.has("view_schedule");
    const canProgress = permissions.has("view_progress");
    const canScores = permissions.has("view_scores");
    const canAttendance = permissions.has("view_attendance");
    const canFeedback = permissions.has("view_feedback");
    const canCompetency = permissions.has("view_competency");
    return rows.map((row) => ({
      ...row,
      progressPercent: canProgress ? row.progressPercent : null,
      schedule: canSchedule ? row.schedule : [],
      materials: canSchedule ? row.materials : [],
      scores: canScores ? row.scores : [],
      attendance: canAttendance ? row.attendance : [],
      feedback: canFeedback ? row.feedback : [],
      competencySummaries: canCompetency ? row.competencySummaries : [],
      visibility: {
        schedule: canSchedule,
        progress: canProgress,
        scores: canScores,
        attendance: canAttendance,
        feedback: canFeedback,
        competency: canCompetency,
      },
    }));
  }
}
