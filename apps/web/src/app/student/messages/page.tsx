"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Avatar, Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { MailOpen, MessageSquare, Plus, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { studentCommunicationApi, type StudentCommunicationItem } from "@/lib/student-communication-api";

type ChatMessage = { id: number; author: string; role: string; text: string; time: string; mine?: boolean };
type Conversation = { id: string; subject: string; type: "Lớp học" | "Giáo viên" | "Trung tâm"; className: string; course: string; participant: string; lastMessage: string; time: string; unread: number; status: "Đang mở" | "Đã đóng"; messages: ChatMessage[] };
const initialConversations: Conversation[] = [
  { id: "if-2609", subject: "Writing Task 1 · Buổi 05", type: "Giáo viên", className: "IF-2609", course: "IELTS Foundation", participant: "Nguyễn Lan Anh", lastMessage: "Em nhớ hoàn thành bài trước 21:00 nhé.", time: "18:12", unread: 1, status: "Đang mở", messages: [{ id: 1, author: "Lan Anh", role: "Giảng viên", text: "Em nhớ hoàn thành bài Writing Task 1 trước 21:00 nhé.", time: "18:12" }] },
  { id: "center-01", subject: "Thông báo học vụ tháng 9", type: "Trung tâm", className: "Tất cả lớp", course: "Học vụ", participant: "Trung tâm HN Learning", lastMessage: "Lịch học tuần sau đã được cập nhật.", time: "Hôm qua", unread: 0, status: "Đang mở", messages: [{ id: 2, author: "Trung tâm HN Learning", role: "Học vụ", text: "Lịch học tuần sau đã được cập nhật trên cổng học viên.", time: "Hôm qua" }] },
  { id: "math-2609", subject: "Hỏi bài hàm số", type: "Lớp học", className: "MATH-2609", course: "Toán 9 nâng cao", participant: "Trần Minh Đức", lastMessage: "Thầy đã gửi thêm tài liệu tham khảo.", time: "10/09", unread: 0, status: "Đã đóng", messages: [{ id: 3, author: "Trần Minh Đức", role: "Giảng viên", text: "Thầy đã gửi thêm tài liệu tham khảo.", time: "10/09" }] },
];
const fromApi = (item: StudentCommunicationItem): Conversation => ({
  id: item.id,
  subject: item.subject,
  type: item.channel === "student" ? "Giáo viên" : item.channel === "parent" ? "Lớp học" : "Trung tâm",
  className: item.context.match(/\b[A-Z]+-\d+\b/)?.[0] ?? "IF-2609",
  course: item.context.includes("TOEIC") ? "TOEIC 700+" : "IELTS Foundation",
  participant: item.title,
  lastMessage: item.lastMessage,
  time: new Date(item.updatedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
  unread: item.unread,
  status: item.status,
  messages: item.messages.map((message, index) => ({ id: index + 1, author: message.author, role: message.author === "Bạn" ? "Học viên" : "Giảng viên", text: message.body, time: new Date(message.sentAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), mine: message.author === "Bạn" })),
});

export default function StudentMessagesPage() {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0].id);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [draft, setDraft] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [apiReady, setApiReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => { let active = true; void studentCommunicationApi.list().then((items) => { if (!active || !items.length) return; const mapped = items.map(fromApi); setConversations(mapped); setSelectedId(mapped[0]?.id ?? ""); setApiReady(true); }).catch(() => undefined); return () => { active = false; }; }, []);
  const selected = conversations.find((item) => item.id === selectedId) ?? conversations[0];
  const unreadCount = conversations.reduce((sum, item) => sum + item.unread, 0);
  const data = useMemo(() => conversations.filter((item) => (filter === "all" || !filter || item.type === filter) && JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [conversations, filter, query]);
  const openConversation = (id: string) => { setSelectedId(id); setConversations((current) => current.map((item) => item.id === id ? { ...item, unread: 0 } : item)); };
  const columns = useMemo<ColumnDef<Conversation>[]>(() => [
    { accessorKey: "subject", header: "Chủ đề", cell: ({ row }) => <div><Text fw={600}>{row.original.subject}</Text><Text size="xs" c="dimmed">{row.original.participant}</Text></div> },
    { accessorKey: "className", header: "Lớp / chương trình", cell: ({ row }) => <div><Text size="sm">{row.original.className}</Text><Text size="xs" c="dimmed">{row.original.course}</Text></div> },
    { accessorKey: "type", header: "Kênh" },
    { accessorKey: "lastMessage", header: "Tin nhắn gần nhất" },
    { accessorKey: "time", header: "Thời gian" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => <UiStatusBadge role={getValue<Conversation["status"]>() === "Đang mở" ? "success" : "neutral"}>{getValue<string>()}</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <Group gap="xs" wrap="nowrap"><UiButton size="compact-xs" onClick={() => openConversation(row.original.id)}>Mở hội thoại</UiButton>{row.original.unread > 0 ? <UiButton size="compact-xs" variant="subtle" leftSection={<MailOpen size={14} />} onClick={() => openConversation(row.original.id)}>Đánh dấu đã đọc</UiButton> : null}</Group> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const sendMessage = async () => { const text = draft.trim(); if (!text || !selected || selected.status === "Đã đóng") return; if (!apiReady) { setNotice("Máy chủ trao đổi chưa phản hồi; nội dung chưa được gửi."); return; } try { const saved = fromApi(await studentCommunicationApi.send(selected.id, text)); setConversations((current) => current.map((item) => item.id === saved.id ? saved : item)); setDraft(""); setNotice("Đã gửi tin nhắn và lưu trên máy chủ."); } catch { setNotice("Không thể gửi tin nhắn: máy chủ chưa lưu nội dung."); } };
  const createConversation = async () => { const subject = newSubject.trim(); if (!subject) return; if (!apiReady) { setNotice("Máy chủ trao đổi chưa phản hồi; cuộc trao đổi chưa được tạo."); return; } try { const created = fromApi(await studentCommunicationApi.create({ subject, firstMessage: "Em muốn trao đổi về nội dung học tập.", relatedClassId: "if-2609" })); setConversations((current) => [created, ...current]); setSelectedId(created.id); setNewSubject(""); setComposeOpen(false); setNotice("Đã tạo và lưu cuộc trao đổi trên máy chủ."); } catch { setNotice("Không thể tạo cuộc trao đổi: máy chủ chưa lưu nội dung."); } };
  return <div className="page"><PageHeader title="Tin nhắn học tập" subtitle="Trao đổi đúng phạm vi lớp học với giáo viên và trung tâm; mỗi cuộc hội thoại lưu lịch sử riêng." />{notice ? <Text size="sm" c={notice.includes("Không thể") || notice.includes("chưa") ? "orange" : "teal"} mb="sm">{notice}</Text> : null}<PageToolbar className="toolbar"><UiTextInput aria-label="Tìm cuộc hội thoại" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm chủ đề, lớp, người gửi..." style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc kênh trao đổi" w={170} value={filter} onChange={setFilter} data={[{ value: "all", label: "Tất cả kênh" }, { value: "Giáo viên", label: "Giáo viên" }, { value: "Lớp học", label: "Lớp học" }, { value: "Trung tâm", label: "Trung tâm" }]} /><UiButton leftSection={<Plus size={16} />} onClick={() => setComposeOpen(true)}>Tạo trao đổi</UiButton>{unreadCount > 0 ? <UiStatusBadge role="info">{unreadCount} chưa đọc</UiStatusBadge> : null}</PageToolbar><Stack gap="md"><UiDataTable table={table} columnCount={columns.length} minWidth={1220} emptyTitle="Không có cuộc hội thoại phù hợp." /><Group align="flex-start" wrap="nowrap" gap="md" className="studentMessageLayout"><Paper className="panel" p="md" withBorder style={{ flex: 1 }}>{selected ? <><Group gap="xs" mb="sm"><MessageSquare size={18} /><Text fw={700}>{selected.subject}</Text></Group><Text size="xs" c="dimmed" mb="md">{selected.className} · {selected.course} · {selected.participant}</Text><Stack gap="sm" mah={280} style={{ overflowY: "auto" }}>{selected.messages.length ? selected.messages.map((message) => <Group key={message.id} align="flex-start" wrap="nowrap" justify={message.mine ? "flex-end" : "flex-start"}><Avatar size="sm" color={message.mine ? "teal" : "blue"}>{message.author.slice(0, 1)}</Avatar><Paper p="xs" withBorder maw="80%" className={`studentMessageBubble ${message.mine ? "studentMessageBubbleMine" : ""}`}><Text size="xs" className="studentMessageMeta">{message.author} · {message.time}</Text><Text size="sm" className="studentMessageText">{message.text}</Text></Paper></Group>) : <Text size="sm" c="dimmed">Chưa có tin nhắn. Hãy gửi câu hỏi đầu tiên.</Text>}</Stack>{selected.status === "Đang mở" ? <><Textarea mt="md" value={draft} onChange={(event) => setDraft(event.currentTarget.value)} minRows={3} placeholder="Nhập câu hỏi hoặc phản hồi..." aria-label="Nội dung tin nhắn" /><Group justify="flex-end" mt="sm"><UiButton leftSection={<Send size={16} />} onClick={sendMessage} disabled={!draft.trim()}>Gửi tin nhắn</UiButton></Group></> : <Text size="sm" c="dimmed" mt="md">Hội thoại đã đóng; hãy tạo trao đổi mới nếu cần hỗ trợ thêm.</Text>}</> : <Text c="dimmed">Chọn một cuộc hội thoại để xem nội dung.</Text>}</Paper></Group></Stack><UiModal opened={composeOpen} onClose={() => setComposeOpen(false)} title="Tạo trao đổi mới"><Stack><Text size="sm" c="dimmed">Trao đổi mới sẽ gửi trong phạm vi lớp IF-2609 đến giáo viên phụ trách.</Text><UiTextInput label="Chủ đề" value={newSubject} onChange={(event) => setNewSubject(event.currentTarget.value)} placeholder="Ví dụ: Hỏi bài buổi 05" /><Group justify="flex-end"><UiButton variant="default" onClick={() => setComposeOpen(false)}>Hủy</UiButton><UiButton onClick={createConversation} disabled={!newSubject.trim()}>Tạo hội thoại</UiButton></Group></Stack></UiModal></div>;
}
