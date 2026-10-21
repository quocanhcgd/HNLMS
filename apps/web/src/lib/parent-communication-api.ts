export type ParentCommunicationItem = {
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

const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const baseUrl = configuredBaseUrl.endsWith("/v1") ? configuredBaseUrl : `${configuredBaseUrl}/v1`;
const headers = () => ({ "Content-Type": "application/json", "x-user-id": "parent@demo.hnlms.vn", "x-organization-id": "org-1" });

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) throw new Error(`parent_communication_api_${response.status}`);
  return response.json() as Promise<T>;
}

export const parentCommunicationApi = {
  list: () => request<ParentCommunicationItem[]>("/communications/parent"),
  send: (conversationId: string, body: string) => request<ParentCommunicationItem>(`/communications/parent/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ body }) }),
  create: (input: { subject: string; firstMessage: string; relatedClassId?: string }) => request<ParentCommunicationItem>("/communications/parent/conversations", { method: "POST", body: JSON.stringify(input) }),
};
