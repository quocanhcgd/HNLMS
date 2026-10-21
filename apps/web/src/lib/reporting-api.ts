import { readDemoSession } from "./demo-auth";

const baseUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;
export type BranchMetric = { branchId: string; branchName: string; learners: number; activeClasses: number; revenue: number; expenses: number; payroll: number; updatedAt: string };
export async function getReportingMetrics(branchId?: string) {
  const session = readDemoSession();
  const params = branchId ? `?branch_id=${encodeURIComponent(branchId)}` : "";
  const response = await fetch(`${baseUrl}/reporting/metrics${params}`, { headers: { "x-user-id": session?.email ?? "demo", "x-organization-id": "org-demo", "x-role": session?.role ?? "branch_manager", "x-branch-id": session?.branchId ?? "b1", "x-branch-ids": session?.branchId ?? "b1" }, cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được báo cáo vận hành.");
  return (await response.json()) as { data: BranchMetric[]; freshness: { generatedAt: string; freshnessSeconds: number; source: string } };
}
