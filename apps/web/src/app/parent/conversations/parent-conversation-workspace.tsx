"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { MessageSquare, Plus, Search, Send } from "lucide-react";
import { Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { parentCommunicationApi, type ParentCommunicationItem } from "@/lib/parent-communication-api";

type Conversation = {
  id: string;
  subject: string;
  student: string;
  studentId: string;
  teacher: string;
  classId: string;
  className: string;
  lastMessage: string;
  updatedAt: string;
  status: "Đang mở" | "Chờ phản hồi" | "Đã đóng";
  messages: string[];
};
const initialRows: Conversation[] = [
  {
    id: "c1",
    subject: "Trao đổi tiến độ tuần",
    student: "Nguyễn Minh Anh",
    studentId: "student-minh-anh",
    teacher: "Lan Anh",
    classId: "if-2609",
    className: "IF-2609",
    lastMessage: "Giáo viên đã gửi nhận xét mới",
    updatedAt: "22/08/2026 15:10",
    status: "Đang mở",
    messages: [
      "Giáo viên: Minh Anh đã hoàn thành tốt phần luyện nghe.",
      "Phụ huynh: Cảm ơn cô, gia đình sẽ nhắc con ôn lại từ vựng.",
    ],
  },
  {
    id: "c2",
    subject: "Xin nghỉ buổi 26/08",
    student: "Nguyễn Minh Anh",
    studentId: "student-minh-anh",
    teacher: "Minh Tuấn",
    classId: "toeic-2609",
    className: "TOEIC-2609",
    lastMessage: "Phụ huynh đã gửi lý do",
    updatedAt: "21/08/2026 20:00",
    status: "Chờ phản hồi",
    messages: ["Phụ huynh: Minh Anh xin nghỉ buổi 26/08 vì có lịch gia đình."],
  },
];
const studentMeta: Record<string, { id: string; name: string }> = {
  "if-2609": { id: "student-minh-anh", name: "Nguyễn Minh Anh" },
  "toeic-2609": { id: "student-minh-anh", name: "Nguyễn Minh Anh" },
  "math-2609": { id: "student-gia-huy", name: "Trần Gia Huy" },
};
const fromApi = (item: ParentCommunicationItem): Conversation => {
  const classId = item.context.match(/Phạm vi lớp ·\s*([\w-]+)/)?.[1] ?? "if-2609";
  const learner = studentMeta[classId] ?? studentMeta["if-2609"];
  return { id: item.id, subject: item.subject, student: learner.name, studentId: learner.id, teacher: item.title, classId, className: classId.toUpperCase(), lastMessage: item.lastMessage, updatedAt: new Date(item.updatedAt).toLocaleString("vi-VN"), status: item.status === "Đã đóng" ? "Đã đóng" : "Đang mở", messages: item.messages.map((message) => message.author + ": " + message.body) };
};

export function ParentConversationWorkspace() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<string | null>(searchParams.get("student") ?? "all");
  const [classId, setClassId] = useState<string | null>(searchParams.get("classId") ?? "all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [apiReady, setApiReady] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  useEffect(() => { let active = true; void parentCommunicationApi.list().then((items) => { if (!active || !items.length) return; const mapped = items.map(fromApi); const merged = [...mapped, ...initialRows.filter((initial) => !mapped.some((item) => item.id === initial.id))]; setRows(merged); setSelected(merged[0] ?? null); setApiReady(true); }).catch(() => undefined); return () => { active = false; }; }, []);
  const data = useMemo(
    () => rows.filter((row) => (student === "all" || !student || row.studentId === student) && (classId === "all" || !classId || row.classId === classId) && JSON.stringify(row).toLowerCase().includes(query.toLowerCase())),
    [classId, query, rows, student],
  );
  const columns = useMemo<ColumnDef<Conversation>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Chủ đề",
        cell: ({ row }) => (
          <Group gap="sm" wrap="nowrap">
            <MessageSquare size={17} />
            <div>
              <Text fw={600}>{row.original.subject}</Text>
              <Text size="xs" c="dimmed">
                {row.original.student} · {row.original.className}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "teacher", header: "Giáo viên" },
      { accessorKey: "className", header: "Lớp học" },
      { accessorKey: "lastMessage", header: "Tin cuối" },
      { accessorKey: "updatedAt", header: "Cập nhật" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<Conversation["status"]>();
          return (
            <UiStatusBadge role={value === "Đang mở" ? "success" : value === "Chờ phản hồi" ? "warning" : "neutral"}>
              {value}
            </UiStatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton
            size="compact-xs"
            variant="default"
            onClick={() => {
              setSelected(row.original);
              setDraft("");
            }}
          >
            Mở trao đổi
          </UiButton>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const sendMessage = async () => {
    if (!selected || !draft.trim()) return;
    if (apiReady) {
      try {
        const saved = fromApi(await parentCommunicationApi.send(selected.id, draft.trim()));
        setRows((value) => value.map((row) => (row.id === saved.id ? saved : row)));
        setSelected(saved); setDraft(""); setNotice("Đã gửi tin nhắn và lưu trên máy chủ."); return;
      } catch { setNotice("Không thể gửi tin nhắn: máy chủ chưa lưu nội dung."); return; }
    }
    setNotice("Máy chủ trao đổi chưa phản hồi; nội dung chưa được gửi."); return;
  };
  const createConversation = async () => {
    const subject = newSubject.trim();
    const firstMessage = newMessage.trim();
    if (!subject || !firstMessage || !classId || classId === "all") return;
    if (!apiReady) {
      setNotice("Máy chủ trao đổi chưa phản hồi; cuộc trao đổi chưa được tạo.");
      return;
    }
    try {
      const created = fromApi(await parentCommunicationApi.create({ subject, firstMessage, relatedClassId: classId }));
      setRows((current) => [created, ...current]);
      setSelected(created);
      setNewSubject("");
      setNewMessage("");
      setComposeOpen(false);
      setNotice("Đã tạo cuộc trao đổi và lưu trên máy chủ.");
    } catch {
      setNotice("Không thể tạo trao đổi: máy chủ chưa lưu nội dung.");
    }
  };
  return (
    <div className="page">
      <PageHeader
        title="Trao đổi với giáo viên"
        subtitle="Cuộc trao đổi ba bên theo từng học viên và phạm vi ủy quyền của phụ huynh."
      />
      {notice ? (
        <UiStatusBadge role="success" mb="md">
          {notice}
        </UiStatusBadge>
      ) : null}
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm trao đổi"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm chủ đề, giáo viên, học viên..."
          style={{ minWidth: 290 }}
        />
        <UiSelect
          aria-label="Lọc học viên"
          w={210}
          value={student}
          onChange={setStudent}
          data={[
            { value: "all", label: "Tất cả học viên" },
            { value: "student-minh-anh", label: "Nguyễn Minh Anh" },
            { value: "student-gia-huy", label: "Trần Gia Huy" },
          ]}
        />
        <UiSelect
          aria-label="Lọc lớp học"
          w={180}
          value={classId}
          onChange={setClassId}
          data={[
            { value: "all", label: "Tất cả lớp học" },
            { value: "if-2609", label: "IF-2609" },
            { value: "toeic-2609", label: "TOEIC-2609" },
            { value: "math-2609", label: "MATH-2609" },
          ]}
        />
        <UiButton leftSection={<Plus size={16} />} onClick={() => setComposeOpen(true)}>
          Tạo trao đổi
        </UiButton>
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1160}
        emptyTitle="Không tìm thấy trao đổi phù hợp."
      />
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.subject} · ${selected.student}` : "Trao đổi"}
      >
        {selected ? (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Giáo viên phụ trách: {selected.teacher} · Phạm vi: {selected.student} · {selected.className}
            </Text>
            <Stack gap="xs">
              {selected.messages.map((message, index) => (
                <Paper key={`${selected.id}-${index}`} className="panelHighlight" p="sm">
                  <Text size="sm">{message}</Text>
                </Paper>
              ))}
            </Stack>
            <Textarea
              label="Tin nhắn mới"
              value={draft}
              onChange={(event) => setDraft(event.currentTarget.value)}
              minRows={3}
              placeholder="Nhập nội dung cần trao đổi..."
            />
            <Group justify="flex-end">
              <UiButton variant="default" onClick={() => setSelected(null)}>
                Đóng
              </UiButton>
              <UiButton leftSection={<Send size={16} />} onClick={sendMessage} disabled={!draft.trim()}>
                Gửi tin nhắn
              </UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
      <UiModal opened={composeOpen} onClose={() => setComposeOpen(false)} title="Tạo trao đổi với giáo viên">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Chọn học viên và lớp ở bộ lọc trước khi tạo. Cuộc trao đổi chỉ thuộc lớp được chọn trong phạm vi ủy quyền còn hiệu lực.
          </Text>
          <UiTextInput
            label="Chủ đề"
            value={newSubject}
            onChange={(event) => setNewSubject(event.currentTarget.value)}
            placeholder="Ví dụ: Hỏi tiến độ buổi học"
          />
          <Textarea
            label="Nội dung"
            value={newMessage}
            onChange={(event) => setNewMessage(event.currentTarget.value)}
            minRows={4}
            placeholder="Nhập nội dung cần trao đổi..."
          />
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setComposeOpen(false)}>Hủy</UiButton>
            <UiButton onClick={createConversation} disabled={!newSubject.trim() || !newMessage.trim() || classId === "all" || !classId}>
              Tạo hội thoại
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
    </div>
  );
}
