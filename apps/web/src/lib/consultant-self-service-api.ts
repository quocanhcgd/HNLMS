import { readDemoSession } from "./demo-auth";

export type WorkStatus = "Sắp diễn ra" | "Đang diễn ra" | "Đã hoàn tất" | "Thiếu chấm công" | "Chờ điều chỉnh";
export type WorkRow = { id: string; date: string; time: string; activity: string; lead: string; channel: string; status: WorkStatus; checkIn: string; checkOut: string; note: string };
export type LeaveStatus = "Nháp" | "Chờ duyệt" | "Đã duyệt" | "Từ chối" | "Đã hủy";
export type LeaveRow = { id: string; type: string; from: string; to: string; days: number; reason: string; status: LeaveStatus; submitted: string };
export type CommissionRow = { id: string; date: string; lead: string; source: string; conversion: string; commission: number; status: "Đã đối soát" | "Chờ đối soát" };
export type PayrollSummary = { period: string; base: number; bonus: number; deduction: number; commissions: CommissionRow[]; leaveBalance: number };

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "").endsWith("/v1")
  ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")
  : `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;

function headers() {
  const session = readDemoSession();
  if (!session || !["organization_admin", "branch_manager", "consultant", "admission_manager", "marketing_manager", "academic_manager", "academic_affairs", "content_reviewer", "support_staff", "finance_officer", "payroll_officer", "hr_officer", "executive", "teacher", "teaching_assistant"].includes(session.role)) throw new Error("Vui lòng đăng nhập bằng tài khoản nhân sự phù hợp.");
  return { "Content-Type": "application/json", "x-user-id": session.email, "x-organization-id": "org-demo", "x-role": session.role, "x-branch-ids": session.branchId ?? "b1" };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || `Yêu cầu thất bại (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const consultantSelfServiceApi = {
  listWork: () => request<WorkRow[]>("/consultant/self/work"),
  startWork: (id: string) => request<WorkRow>(`/consultant/self/work/${id}/start`, { method: "POST" }),
  endWork: (id: string) => request<WorkRow>(`/consultant/self/work/${id}/end`, { method: "POST" }),
  adjustWork: (id: string, reason: string) => request<WorkRow>(`/consultant/self/work/${id}/adjust`, { method: "POST", body: JSON.stringify({ reason }) }),
  listLeaves: () => request<LeaveRow[]>("/consultant/self/leaves"),
  createLeave: (input: { type: string; from: string; to: string; days: number; reason: string }) => request<LeaveRow>("/consultant/self/leaves", { method: "POST", body: JSON.stringify(input) }),
  cancelLeave: (id: string) => request<LeaveRow>(`/consultant/self/leaves/${id}/cancel`, { method: "POST" }),
  payroll: (period: string) => request<PayrollSummary>(`/consultant/self/payroll?period=${encodeURIComponent(period)}`),
};
