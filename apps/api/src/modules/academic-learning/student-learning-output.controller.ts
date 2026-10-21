import { BadRequestException, Controller, ForbiddenException, Get, Headers, Param, Query } from "@nestjs/common";
import { demoStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";
import { demoLearningAssignmentRepository } from "./in-memory-learning-assignment-repository";
import { StudentLearningOutputService } from "./student-learning-output.service";
import { ParentLearningOutputError, ParentLearningOutputService, type ParentLearningOutputPermission } from "./parent-learning-output.service";
import { ensureLearningAssignmentsLoaded, ensureLearningOutputLoaded } from "./durable-workflow-state";

type HeaderMap = Record<string, string | string[] | undefined>;

const allLearningPermissions: ParentLearningOutputPermission[] = [
  "view_schedule",
  "view_progress",
  "view_scores",
  "view_attendance",
  "view_feedback",
  "view_competency",
];

const demoParentDelegations = new Map<string, Map<string, { permissions: Set<ParentLearningOutputPermission>; classIds: Set<string> }>>([
  [
    "parent@demo.hnlms.vn",
    new Map([
      ["student-minh-anh", { permissions: new Set(allLearningPermissions), classIds: new Set(["if-2609", "toeic-2609"]) }],
      ["student-gia-huy", { permissions: new Set(allLearningPermissions), classIds: new Set(["math-2609"]) }],
    ]),
  ],
  [
    "parent-demo",
    new Map([
      ["student-minh-anh", { permissions: new Set(allLearningPermissions), classIds: new Set(["if-2609", "toeic-2609"]) }],
      ["student-gia-huy", { permissions: new Set(allLearningPermissions), classIds: new Set(["math-2609"]) }],
    ]),
  ],
]);

function header(headers: HeaderMap, key: string): string {
  const value = headers[key];
  return Array.isArray(value) ? value[0] ?? "" : String(value ?? "");
}

function permissions(headers: HeaderMap): Set<ParentLearningOutputPermission> {
  return new Set(
    header(headers, "x-parent-permissions")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean) as ParentLearningOutputPermission[],
  );
}

@Controller()
export class StudentLearningOutputController {
  // Demo API instances expose published learning records so the parent portal can exercise the full read flow.
  private readonly repository = demoStudentLearningOutputRepository;
  private readonly service = new StudentLearningOutputService(this.repository);
  private readonly parentService = new ParentLearningOutputService(this.service);

  @Get("students/:studentId/learning-output")
  async listStudent(
    @Headers() headers: HeaderMap,
    @Param("studentId") studentId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    await ensureLearningOutputLoaded(header(headers, "x-organization-id") || "org-1");
    return this.service.listForStudent(
      {
        userId: header(headers, "x-user-id"),
        organizationId: header(headers, "x-organization-id"),
        role: "student",
        studentId: header(headers, "x-student-id") || studentId,
      },
      studentId,
      { enrollmentId: query.enrollment_id, classId: query.class_id, programId: query.program_id },
    );
  }

  @Get("parent/students/:studentId/learning-output")
  async listParent(
    @Headers() headers: HeaderMap,
    @Param("studentId") studentId: string,
    @Query() query: Record<string, string | undefined>,
  ) {
    await ensureLearningOutputLoaded(header(headers, "x-organization-id") || "org-1");
    const parentUserId = header(headers, "x-user-id") || "parent-demo";
    const persistedDelegation = demoParentDelegations.get(parentUserId)?.get(studentId);
    const requestedPermissions = permissions(headers);
    // Demo accounts use server-owned delegation records; headers remain a compatibility path for isolated tests.
    const effectivePermissions = persistedDelegation?.permissions ?? requestedPermissions;
    return this.execute(() =>
      this.parentService.listForParent(
        {
          userId: parentUserId,
          organizationId: header(headers, "x-organization-id"),
          role: "parent",
          parentPermissionsByStudentId: new Map([[studentId, effectivePermissions]]),
          parentClassIdsByStudentId: persistedDelegation
            ? new Map([[studentId, persistedDelegation.classIds]])
            : undefined,
        },
        studentId,
        { enrollmentId: query.enrollment_id, classId: query.class_id, programId: query.program_id },
      ),
    );
  }

  @Get("parent/students/:studentId/learning-assignments")
  async listParentAssignments(
    @Headers() headers: HeaderMap,
    @Param("studentId") studentId: string,
    @Query("class_id") classId?: string,
  ) {
    await ensureLearningAssignmentsLoaded(header(headers, "x-organization-id") || "org-1");
    const parentUserId = header(headers, "x-user-id") || "parent-demo";
    const delegation = demoParentDelegations.get(parentUserId)?.get(studentId);
    if (!delegation || !classId?.trim() || !delegation.classIds.has(classId.trim())) {
      throw new ForbiddenException("parent_class_delegation_required");
    }
    return demoLearningAssignmentRepository
      .listAssignments({ organizationId: header(headers, "x-organization-id") || "org-1", classId: classId.trim() })
      .filter((assignment) => assignment.lifecycle === "assigned")
      .map((assignment) => {
        const submission = demoLearningAssignmentRepository
          .listSubmissions({ organizationId: assignment.organizationId, assignmentId: assignment.id, studentId })[0];
        const published = submission?.lifecycle === "graded" && submission.gradePublicationStatus === "published";
        return {
          id: assignment.id,
          title: assignment.title,
          type: assignment.type,
          sessionId: assignment.sessionId,
          dueAt: assignment.dueAt,
          maxScore: assignment.maxScore,
          submission: submission
            ? {
                lifecycle: submission.lifecycle,
                submittedAt: submission.submittedAt,
                ...(published ? { score: submission.score, feedback: submission.feedback, gradePublicationStatus: "published" as const } : {}),
              }
            : null,
        };
      });
  }

  private async execute<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await work();
    } catch (error) {
      if (error instanceof ParentLearningOutputError) {
        if (error.code === "forbidden") throw new ForbiddenException(error.message);
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
