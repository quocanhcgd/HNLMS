import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import { readDemoSession, type DemoRole } from "./demo-auth";

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;

function requestHeaders(roleOverride?: DemoRole): Record<string, string> {
  const session = readDemoSession();
  const role = roleOverride ?? session?.role;
  const isAcademic = role === "academic_affairs" || role === "academic_manager" || role === "organization_admin";
  return {
    "Content-Type": "application/json",
    "x-user-id": isAcademic ? "academic-demo" : role === "teacher" ? "teacher-demo" : "staff-demo",
    "x-organization-id": "org-1",
    "x-role": role === "teacher" || role === "teaching_assistant" || isAcademic ? role : "teacher",
    "x-permissions": isAcademic ? "competency:read,competency:publish" : "competency:read,competency:review",
  };
}

async function request<T>(path: string, init?: RequestInit, role?: DemoRole): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...requestHeaders(role), ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`competency_api_${response.status}`);
  return response.json() as Promise<T>;
}

export const competencyProfileApi = {
  list: (role?: DemoRole) => request<CompetencyProfileReadModel[]>("/competency-profiles", undefined, role),
  review: (command: Record<string, unknown>) =>
    request<unknown>("/competency-profiles/reviews", { method: "POST", body: JSON.stringify(command) }),
  approvePublication: (profileIds: string[], note?: string) =>
    request<unknown>(
      "/competency-profiles/publications",
      { method: "POST", body: JSON.stringify({ profileIds, note }) },
      "academic_affairs",
    ),
};
