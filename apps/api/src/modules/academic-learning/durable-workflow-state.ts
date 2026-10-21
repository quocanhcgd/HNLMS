import { configuredAppStateStore } from "../../database/app-state";
import { demoLearningAssignmentRepository, type LearningAssignment, type LearningGradeAudit, type LearningSubmission } from "./in-memory-learning-assignment-repository";
import { demoStudentLearningOutputRepository } from "./in-memory-student-learning-output-repository";

type AssignmentSnapshot = {
  assignments: LearningAssignment[];
  submissions: LearningSubmission[];
  gradeAudits: LearningGradeAudit[];
};

type OutputSnapshot = {
  enrollments: typeof demoStudentLearningOutputRepository.enrollments;
  schedules: typeof demoStudentLearningOutputRepository.schedules;
  materials: typeof demoStudentLearningOutputRepository.materials;
  scores: typeof demoStudentLearningOutputRepository.scores;
  attendance: typeof demoStudentLearningOutputRepository.attendance;
  feedback: typeof demoStudentLearningOutputRepository.feedback;
  competencies: typeof demoStudentLearningOutputRepository.competencies;
};

const loadedAssignments = new Set<string>();
const loadedOutputs = new Set<string>();

function clone<T>(value: T): T {
  return structuredClone(value);
}

export async function ensureLearningAssignmentsLoaded(organizationId: string): Promise<void> {
  if (loadedAssignments.has(organizationId)) return;
  loadedAssignments.add(organizationId);
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    const snapshot = await store.read<AssignmentSnapshot>(organizationId, "academic-learning", "assignments");
    if (snapshot) {
      demoLearningAssignmentRepository.assignments.splice(0, demoLearningAssignmentRepository.assignments.length, ...clone(snapshot.assignments));
      demoLearningAssignmentRepository.submissions.splice(0, demoLearningAssignmentRepository.submissions.length, ...clone(snapshot.submissions));
      demoLearningAssignmentRepository.gradeAudits.splice(0, demoLearningAssignmentRepository.gradeAudits.length, ...clone(snapshot.gradeAudits));
      return;
    }
    await persistLearningAssignments(organizationId);
  } catch {
    // A configured database may be unavailable during local UI work. Keep the
    // demo projection alive and retry on the next process start.
  }
}

export async function persistLearningAssignments(organizationId: string): Promise<void> {
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    await store.write(organizationId, "academic-learning", "assignments", {
      assignments: clone(demoLearningAssignmentRepository.assignments),
      submissions: clone(demoLearningAssignmentRepository.submissions),
      gradeAudits: clone(demoLearningAssignmentRepository.gradeAudits),
    } satisfies AssignmentSnapshot);
  } catch {
    // Preserve the command response in demo mode if storage is temporarily down.
  }
}

export async function ensureLearningOutputLoaded(organizationId: string): Promise<void> {
  if (loadedOutputs.has(organizationId)) return;
  loadedOutputs.add(organizationId);
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    const snapshot = await store.read<OutputSnapshot>(organizationId, "academic-learning", "learning-output");
    if (snapshot) {
      for (const [key, records] of Object.entries(snapshot) as Array<[keyof OutputSnapshot, OutputSnapshot[keyof OutputSnapshot]]>) {
        const target = demoStudentLearningOutputRepository[key];
        target.splice(0, target.length, ...clone(records) as never[]);
      }
      return;
    }
    await persistLearningOutput(organizationId);
  } catch {
    // See ensureLearningAssignmentsLoaded.
  }
}

export async function persistLearningOutput(organizationId: string): Promise<void> {
  const store = configuredAppStateStore();
  if (!store) return;
  try {
    await store.write(organizationId, "academic-learning", "learning-output", {
      enrollments: clone(demoStudentLearningOutputRepository.enrollments),
      schedules: clone(demoStudentLearningOutputRepository.schedules),
      materials: clone(demoStudentLearningOutputRepository.materials),
      scores: clone(demoStudentLearningOutputRepository.scores),
      attendance: clone(demoStudentLearningOutputRepository.attendance),
      feedback: clone(demoStudentLearningOutputRepository.feedback),
      competencies: clone(demoStudentLearningOutputRepository.competencies),
    } satisfies OutputSnapshot);
  } catch {
    // Preserve demo-mode behaviour when the optional database is unavailable.
  }
}
