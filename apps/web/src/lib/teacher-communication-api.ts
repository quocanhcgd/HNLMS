export type TeacherCommunicationApiItem = {
  id: string;
  title: string;
  role: string;
  channel: "parent" | "student" | "academic" | "support" | "finance";
  context: string;
  subject: string;
  lastMessage: string;
  updatedAt: string;
  unread: number;
  status: "Đang mở" | "Đã đóng";
  messages: Array<{ id: string; sender: "teacher" | "other"; author: string; body: string; sentAt: string }>;
};

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const apiUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;

function headers() {
  return { "Content-Type": "application/json", "x-user-id": "teacher-demo", "x-organization-id": "org-1" };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`teacher_communication_api_${response.status}`);
  return response.json() as Promise<T>;
}

export const teacherCommunicationApi = {
  list: (mode: "teaching" | "internal") =>
    request<TeacherCommunicationApiItem[]>(`/communications/teacher?mode=${mode}`),
  send: (conversationId: string, body: string) =>
    request<TeacherCommunicationApiItem>(`/communications/teacher/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  create: (input: { mode: "teaching" | "internal"; recipient: string; subject: string; firstMessage: string }) =>
    request<TeacherCommunicationApiItem>("/communications/teacher/conversations", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
