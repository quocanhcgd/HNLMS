import type { ParentLearningOutput } from "@hnlms/domain-contracts";
import { readDemoSession } from "./demo-auth";

export type ParentLearningAssignmentSummary = {
  id: string;
  title: string;
  type: string;
  sessionId?: string;
  dueAt?: string;
  maxScore: number;
  submission: {
    lifecycle: "draft" | "submitted" | "graded";
    submittedAt?: string;
    score?: number;
    feedback?: string;
    gradePublicationStatus?: "published";
  } | null;
};

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;

const parentPermissions = [
  "view_schedule",
  "view_progress",
  "view_scores",
  "view_attendance",
  "view_feedback",
  "view_competency",
].join(",");

async function request<T>(path: string): Promise<T> {
  const session = readDemoSession();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": session?.email ?? "parent-demo",
      "x-organization-id": "org-1",
      "x-parent-permissions": parentPermissions,
    },
  });
  if (!response.ok) throw new Error(`parent_learning_api_${response.status}`);
  return response.json() as Promise<T>;
}

export const parentLearningApi = {
  listForStudent: (studentId: string, classId?: string) =>
    request<ParentLearningOutput[]>(
      `/parent/students/${encodeURIComponent(studentId)}/learning-output${classId ? `?class_id=${encodeURIComponent(classId)}` : ""}`,
    ),
  listAssignmentSummaries: (studentId: string, classId: string) =>
    request<ParentLearningAssignmentSummary[]>(
      `/parent/students/${encodeURIComponent(studentId)}/learning-assignments?class_id=${encodeURIComponent(classId)}`,
    ),
};
