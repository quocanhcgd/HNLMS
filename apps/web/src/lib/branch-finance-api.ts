import { readDemoSession } from "./demo-auth";

const baseUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;
export type BranchFinanceRow = { id: string; branchId: string; branch: string; period: string; income: number; expense: number; balance: number; budget: number; status: "Đang theo dõi" | "Cần đối soát" };
async function request<T>(path: string, init?: RequestInit) {
  const session = readDemoSession();
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { "Content-Type": "application/json", "x-user-id": session?.email ?? "demo", "x-organization-id": "org-demo", "x-role": session?.role ?? "branch_manager", "x-branch-ids": session?.branchId ?? "b1", ...(init?.headers ?? {}) }, cache: "no-store" });
  if (!response.ok) throw new Error(`branch_finance_api_${response.status}`);
  return (await response.json()) as T;
}
export const branchFinanceApi = {
  list: () => request<{ data: BranchFinanceRow[] }>("/finance/branches"),
  addLedger: (branchId: string, input: { kind: "income" | "expense"; amount: number; description: string }) => request<BranchFinanceRow>(`/finance/branches/${branchId}/ledger`, { method: "POST", body: JSON.stringify(input) }),
  updateBudget: (branchId: string, input: { period: string; amount: number }) => request<BranchFinanceRow>(`/finance/branches/${branchId}/budget`, { method: "PATCH", body: JSON.stringify(input) }),
  reconcile: (branchId: string) => request<BranchFinanceRow>(`/finance/branches/${branchId}/reconcile`, { method: "POST" }),
};
