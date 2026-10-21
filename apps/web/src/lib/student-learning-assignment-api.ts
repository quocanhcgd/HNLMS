import { readDemoSession } from "./demo-auth";
import type { TeacherLearningAssignment, TeacherLearningSubmission } from "./teacher-learning-api";

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : configuredBaseUrl + "/v1";
const headers = (studentId: string) => ({ "Content-Type": "application/json", "x-user-id": readDemoSession()?.email ?? "student@demo.hnlms.vn", "x-organization-id": "org-1", "x-student-id": studentId });
async function request<T>(path: string, studentId: string, init?: RequestInit): Promise<T> {
  const response = await fetch(baseUrl + path, { ...init, headers: { ...headers(studentId), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error("student_assignment_api_" + response.status);
  return response.json() as Promise<T>;
}
export type StudentAssignment = Omit<TeacherLearningAssignment, "submissions"> & { submission: TeacherLearningSubmission | null };
export const studentLearningAssignmentApi = {
  list: (studentId = "student-minh-anh", classId = "if-2609") => request<StudentAssignment[]>("/student/learning/assignments?studentId=" + encodeURIComponent(studentId) + "&classId=" + encodeURIComponent(classId), studentId),
  saveSubmission: (assignmentId: string, body: { enrollmentId: string; answer: string; lifecycle: "draft" | "submitted" }, studentId = "student-minh-anh") => request<TeacherLearningSubmission>("/student/learning/assignments/" + encodeURIComponent(assignmentId) + "/submission", studentId, { method: "POST", body: JSON.stringify({ ...body, studentId }) }),
};
