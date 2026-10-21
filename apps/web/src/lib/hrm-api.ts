import { readDemoSession } from "./demo-auth";

const baseUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;
export type HrmEmployee = { id: string; employeeCode: string; name: string; jobTitle: string; branchId: string; branch: string; status: "invited" | "active" | "on_leave" | "suspended" | "terminated"; workloadHours: number };
export type HrmLeave = { id: string; employeeId: string; employeeName: string; startsAt: string; endsAt: string; days: number; reason: string; status: "requested" | "approved" | "rejected" | "cancelled" };

async function request<T>(path: string, init?: RequestInit) {
  const session = readDemoSession();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", "x-user-id": session?.email ?? "demo", "x-organization-id": "org-demo", "x-role": session?.role ?? "hr_officer", "x-branch-ids": session?.branchId ?? "b1", ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`hrm_api_${response.status}`);
  return (await response.json()) as T;
}

export const hrmApi = {
  list: () => request<{ data: HrmEmployee[] }>("/hrm/employees"),
  create: (input: { employeeCode: string; name: string; jobTitle: string; branchId: string; branch: string; status: HrmEmployee["status"]; workloadHours: number }) => request<HrmEmployee>("/hrm/employees", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<Omit<HrmEmployee, "id" | "employeeCode">>) => request<HrmEmployee>(`/hrm/employees/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  activate: (id: string) => request<HrmEmployee>(`/hrm/employees/${encodeURIComponent(id)}/activate`, { method: "POST" }),
  listLeaves: () => request<{ data: HrmLeave[] }>("/hrm/leaves"),
  requestLeave: (input: { employeeId: string; startsAt: string; endsAt: string; days: number; reason: string }) => request<HrmLeave>("/hrm/leaves", { method: "POST", body: JSON.stringify(input) }),
  approveLeave: (id: string) => request<HrmLeave>(`/hrm/leaves/${encodeURIComponent(id)}/approve`, { method: "POST" }),
  rejectLeave: (id: string) => request<HrmLeave>(`/hrm/leaves/${encodeURIComponent(id)}/reject`, { method: "POST" }),
};
