export type TeacherLearningMaterial = {
  id: string;
  title: string;
  contentType: string;
  version: number;
  locale: string;
  publishedAt: string;
  publicationStatus: "draft" | "published";
  classId?: string;
  programId?: string;
  sessionId?: string;
  source?: string;
  estimatedDurationMinutes?: number;
};

export type TeacherLearningSubmission = {
  id: string;
  studentId: string;
  enrollmentId: string;
  answer: string;
  lifecycle: "draft" | "submitted" | "graded";
  submittedAt?: string;
  score?: number;
  feedback?: string;
  gradePublicationStatus?: "draft" | "published" | "voided";
};
export type TeacherLearningAssignment = {
  id: string;
  classId: string;
  programId?: string;
  sessionId?: string;
  title: string;
  type: string;
  instructions: string;
  rubric?: string;
  dueAt?: string;
  maxScore: number;
  attempts: number;
  attachmentName?: string;
  lifecycle: "draft" | "assigned" | "archived";
  createdAt: string;
  publishedAt?: string;
  submissions?: TeacherLearningSubmission[];
};

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;
const headers = () => ({ "Content-Type": "application/json", "x-user-id": "teacher-demo", "x-organization-id": "org-1" });
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`teacher_learning_api_${response.status}`);
  return response.json() as Promise<T>;
}

export const teacherLearningApi = {
  listAssignments: (classId: string) => request<TeacherLearningAssignment[]>("/teacher/learning/assignments?classId=" + encodeURIComponent(classId)),
  createAssignment: (body: Omit<TeacherLearningAssignment, "id" | "lifecycle" | "createdAt" | "publishedAt" | "submissions">) => request<TeacherLearningAssignment>("/teacher/learning/assignments", { method: "POST", body: JSON.stringify(body) }),
  updateAssignment: (id: string, body: Partial<Pick<TeacherLearningAssignment, "title" | "type" | "instructions" | "rubric" | "dueAt" | "sessionId" | "programId" | "maxScore" | "attempts" | "attachmentName">>) => request<TeacherLearningAssignment>("/teacher/learning/assignments/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(body) }),
  publishAssignment: (id: string) => request<TeacherLearningAssignment>("/teacher/learning/assignments/" + encodeURIComponent(id) + "/publish", { method: "POST" }),
  archiveAssignment: (id: string) => request<TeacherLearningAssignment>("/teacher/learning/assignments/" + encodeURIComponent(id) + "/archive", { method: "POST" }),
  gradeSubmission: (assignmentId: string, submissionId: string, body: { score: number; feedback?: string; publicationStatus: "draft" | "published" }) => request<TeacherLearningSubmission>("/teacher/learning/assignments/" + encodeURIComponent(assignmentId) + "/submissions/" + encodeURIComponent(submissionId) + "/grade", { method: "POST", body: JSON.stringify(body) }),
  voidGrade: (assignmentId: string, submissionId: string) => request<TeacherLearningSubmission>("/teacher/learning/assignments/" + encodeURIComponent(assignmentId) + "/submissions/" + encodeURIComponent(submissionId) + "/void", { method: "POST" }),
  listMaterials: (classId: string) => request<TeacherLearningMaterial[]>(`/teacher/learning/materials?classId=${encodeURIComponent(classId)}`),
  createMaterial: (body: Omit<TeacherLearningMaterial, "id" | "version" | "locale" | "publishedAt">) => request<TeacherLearningMaterial>("/teacher/learning/materials", { method: "POST", body: JSON.stringify(body) }),
  updateMaterial: (id: string, body: Pick<TeacherLearningMaterial, "title" | "contentType" | "source" | "sessionId" | "estimatedDurationMinutes">) => request<TeacherLearningMaterial>(`/teacher/learning/materials/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) }),
  publishMaterial: (id: string) => request<TeacherLearningMaterial>(`/teacher/learning/materials/${encodeURIComponent(id)}/publish`, { method: "POST" }),
};
