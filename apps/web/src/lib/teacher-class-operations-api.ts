export type TeacherSessionOperation = { id: string; date: string; time: string; className: string; title: string; students: number; materials: number; attendance: number; status: "Cần chuẩn bị" | "Sẵn sàng" | "Đã điểm danh" | "Đã xác nhận"; worklog: "Chưa gửi" | "Đã gửi"; materialAttachmentName?: string; worklogNote?: string };
const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;
const demoSessionId = () => {
  if (typeof window === "undefined") return "server";
  const key = "hnlms.teacher.demo-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const created = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  window.sessionStorage.setItem(key, created);
  return created;
};
const headers = () => ({ "Content-Type": "application/json", "x-user-id": `teacher-demo-${demoSessionId()}`, "x-organization-id": "org-1" });
async function request<T>(path: string, init?: RequestInit): Promise<T> { const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } }); if (!response.ok) throw new Error(`teacher_operations_api_${response.status}`); return response.json() as Promise<T>; }
export const teacherClassOperationsApi = {
  list: () => request<TeacherSessionOperation[]>("/teacher/operations/sessions"),
  materials: (id: string, body: { title: string; type: string; description: string; attachmentName?: string }) => request<TeacherSessionOperation>(`/teacher/operations/sessions/${id}/materials`, { method: "POST", body: JSON.stringify(body) }),
  attendance: (id: string, attendance: number) => request<TeacherSessionOperation>(`/teacher/operations/sessions/${id}/attendance`, { method: "POST", body: JSON.stringify({ attendance }) }),
  worklog: (id: string, note: string) => request<TeacherSessionOperation>(`/teacher/operations/sessions/${id}/worklog`, { method: "POST", body: JSON.stringify({ note }) }),
};
