import { readDemoSession } from "./demo-auth";

const baseUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;
export type PayrollStatus = "draft" | "calculated" | "approved" | "locked" | "published";
export type PayrollPeriod = { id: string; period: string; label: string; staff: number; gross: number; net: number; status: PayrollStatus; calculationVersion: string; exceptions: string[]; updatedAt: string; publishedAt?: string };
async function request<T>(path: string, init?: RequestInit) {
  const session = readDemoSession();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", "x-user-id": session?.email ?? "demo", "x-organization-id": "org-demo", "x-role": session?.role ?? "payroll_officer", ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`payroll_api_${response.status}`);
  return (await response.json()) as T;
}
export const payrollApi = {
  list: () => request<{ data: PayrollPeriod[] }>("/payroll/periods"),
  create: (input: { period: string; label: string }) => request<PayrollPeriod>("/payroll/periods", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: { label: string }) => request<PayrollPeriod>(`/payroll/periods/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }),
  transition: (id: string, action: "calculate" | "approve" | "lock" | "publish") => request<PayrollPeriod>(`/payroll/periods/${encodeURIComponent(id)}/${action}`, { method: "POST" }),
};
