export type TeacherOnlineApiRow = {
  id: string;
  className: string;
  title: string;
  time: string;
  provider: string;
  status: "Sắp diễn ra" | "Đang live" | "Đã kết thúc";
  attendance: string;
  recording: string;
};
const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const apiUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": "teacher-demo",
      "x-organization-id": "org-1",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`teacher_online_api_${response.status}`);
  return response.json() as Promise<T>;
}
export const teacherOnlineApi = {
  list: () => request<TeacherOnlineApiRow[]>("/online-sessions/teacher"),
  open: (id: string) => request<TeacherOnlineApiRow>(`/online-sessions/teacher/${id}/open`, { method: "POST" }),
  recording: (id: string) =>
    request<{ id: string; title: string; status: string }>(`/online-sessions/teacher/${id}/recording`, {
      method: "POST",
    }),
};
