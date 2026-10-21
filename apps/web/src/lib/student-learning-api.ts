import type { StudentLearningOutput } from "@hnlms/domain-contracts";
import { readDemoSession } from "./demo-auth";

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;

export async function getStudentLearningOutput(studentId = "student-minh-anh", classId?: string): Promise<StudentLearningOutput[]> {
  const session = readDemoSession();
  const query = classId ? `?class_id=${encodeURIComponent(classId)}` : "";
  const response = await fetch(`${baseUrl}/students/${encodeURIComponent(studentId)}/learning-output${query}`, {
    headers: { "Content-Type": "application/json", "x-user-id": session?.email ?? "student@demo.hnlms.vn", "x-organization-id": "org-1", "x-student-id": studentId },
  });
  if (!response.ok) throw new Error(`student_learning_api_${response.status}`);
  return response.json() as Promise<StudentLearningOutput[]>;
}
