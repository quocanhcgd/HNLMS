import { readDemoSession } from "./demo-auth";

const baseUrl = `${(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "")}/v1`;
const organizationId = process.env.NEXT_PUBLIC_DEMO_ORGANIZATION_ID ?? "org-demo";
export type AcademicRegistrySection = "programs" | "classes" | "students" | "assignments";
export type AcademicRegistryRow = Record<string, string | number> & { id: string; branchId: string };
export type AcademicRegistryOptions = {
  courses: Array<{ id: string; code: string; name: string }>;
  classes: Array<{ id: string; code: string; name: string; branchId?: string | null; status?: string }>;
  employees: Array<{ id: string; employeeCode: string; jobTitle: string; branchId?: string | null; status?: string }>;
  branches: Array<{ id: string; name: string }>;
};

function headers() {
  const session = readDemoSession();
  const branchId = process.env.NEXT_PUBLIC_DEMO_BRANCH_ID || session?.branchId || "b1";
  return {
    "x-user-id": session?.email ?? "demo",
    "x-organization-id": organizationId,
    "x-role": session?.role ?? "branch_manager",
    "x-branch-id": branchId,
    "x-branch-ids": branchId,
  };
}

export async function getAcademicRegistry(section: AcademicRegistrySection) {
  const response = await fetch(`${baseUrl}/academic/registry?section=${section}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`academic_registry_api_${response.status}`);
  return (await response.json()) as { data: AcademicRegistryRow[]; scope: string | string[] };
}

export async function getAcademicRegistryOptions() {
  const response = await fetch(`${baseUrl}/academic/registry/options`, { headers: headers(), cache: "no-store" });
  if (!response.ok) throw new Error(`academic_registry_options_api_${response.status}`);
  return (await response.json()) as { data: AcademicRegistryOptions; scope: string | string[] };
}

async function mutate<T>(section: AcademicRegistrySection, id: string | undefined, method: "POST" | "PATCH" | "DELETE", input?: Record<string, unknown>) {
  const response = await fetch(`${baseUrl}/academic/registry/${section}${id ? `/${id}` : ""}`, { method, headers: { "Content-Type": "application/json", ...headers() }, ...(input ? { body: JSON.stringify(input) } : {}), cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new Error(message ?? `academic_registry_api_${response.status}`);
  }
  return (await response.json()) as T;
}
export const academicRegistryApi = {
  create: (section: AcademicRegistrySection, input: Record<string, unknown>) => mutate<AcademicRegistryRow | undefined>(section, undefined, "POST", input),
  update: (section: AcademicRegistrySection, id: string, input: Record<string, unknown>) => mutate<AcademicRegistryRow | undefined>(section, id, "PATCH", input),
  archive: (section: AcademicRegistrySection, id: string) => mutate<AcademicRegistryRow | undefined>(section, id, "DELETE"),
};
