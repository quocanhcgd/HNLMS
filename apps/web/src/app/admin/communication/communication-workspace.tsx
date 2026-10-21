"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { Bell, MessageSquare, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiBadge, UiButton, UiDataTable, UiModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type Section = "conversations" | "notifications";
type ConversationRow = {
  subject: string;
  type: string;
  members: string;
  lastMessage: string;
  updatedAt: string;
  status: "Đang mở" | "Đã ghim" | "Đã đóng";
};
type NotificationRow = {
  title: string;
  source: string;
  scope: string;
  receivedAt: string;
  status: "Chưa đọc" | "Đã đọc";
};

const conversations: ConversationRow[] = [
  {
    subject: "Bàn giao hồ sơ Lê Bảo Ngọc",
    type: "Tuyển sinh · Học vụ · Tài chính",
    members: "Quản lý tuyển sinh, Học vụ, Tài chính",
    lastMessage: "Đề nghị xác nhận lớp và nghĩa vụ tài chính",
    updatedAt: "22/08/2026 14:45",
    status: "Đang mở",
  },
  {
    subject: "Trao đổi tiến độ Nguyễn An",
    type: "Phụ huynh · Giáo viên · CSKH",
    members: "Lan Anh, Phụ huynh, Học vụ",
    lastMessage: "Đã cập nhật điểm danh tuần này",
    updatedAt: "22/08/2026 15:10",
    status: "Đang mở",
  },
  {
    subject: "Thông báo lớp IF-2609",
    type: "Lớp học",
    members: "14 thành viên",
    lastMessage: "Lịch học bù thứ Bảy",
    updatedAt: "21/08/2026 18:00",
    status: "Đã ghim",
  },
  {
    subject: "Hỗ trợ học phí TOEIC-2609",
    type: "Hỗ trợ",
    members: "Tài chính, Phụ huynh",
    lastMessage: "Đã xác nhận thanh toán",
    updatedAt: "20/08/2026 09:30",
    status: "Đã đóng",
  },
];

const notifications: NotificationRow[] = [
  {
    title: "Nhắc lịch học hôm nay",
    source: "Học vụ",
    scope: "Lớp IF-2609",
    receivedAt: "Hôm nay 08:00",
    status: "Chưa đọc",
  },
  {
    title: "Hồ sơ cần xác nhận bàn giao",
    source: "Hệ thống tuyển sinh",
    scope: "Lê Bảo Ngọc · TOEIC 700+",
    receivedAt: "Hôm nay 09:20",
    status: "Chưa đọc",
  },
  {
    title: "Kỳ lương tháng 08/2026 đã công bố",
    source: "Phụ trách lương",
    scope: "Cá nhân",
    receivedAt: "21/08/2026 17:00",
    status: "Đã đọc",
  },
];

const conversationRole = { "Đang mở": "success", "Đã ghim": "info", "Đã đóng": "neutral" } as const;
const notificationRole = { "Chưa đọc": "warning", "Đã đọc": "success" } as const;

export function CommunicationWorkspace({ section }: { section: Section }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [conversationRows, setConversationRows] = useState(conversations);
  const [notificationRows, setNotificationRows] = useState(notifications);
  const [selectedConversation, setSelectedConversation] = useState<ConversationRow | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<NotificationRow | null>(null);
  const [message, setMessage] = useState("");
  const isNotifications = section === "notifications";
  const baseData = isNotifications ? notificationRows : conversationRows;
  const data = useMemo(
    () =>
      baseData.filter(
        (item) =>
          (status === "all" || !status || item.status === status) &&
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
      ),
    [baseData, query, status],
  );
  const conversationColumns = useMemo<ColumnDef<ConversationRow>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Cuộc trao đổi",
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            <MessageSquare size={16} />
            <div>
              <Text fw={600}>{row.original.subject}</Text>
              <Text size="xs" c="dimmed">
                {row.original.type}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "members", header: "Thành viên" },
      { accessorKey: "lastMessage", header: "Tin cuối" },
      { accessorKey: "updatedAt", header: "Cập nhật" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ConversationRow["status"]>();
          return <UiStatusBadge role={conversationRole[value]}>{value}</UiStatusBadge>;
        },
      },
      { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ view: () => { setSelectedConversation(row.original); setMessage(""); } }} labels={{ view: "Mở trao đổi" }} /> },
    ],
    [],
  );
  const notificationColumns = useMemo<ColumnDef<NotificationRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Thông báo",
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            <Bell size={16} />
            <div>
              <Text fw={600}>{row.original.title}</Text>
              <Text size="xs" c="dimmed">
                {row.original.scope}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "source", header: "Nguồn" },
      { accessorKey: "scope", header: "Phạm vi" },
      { accessorKey: "receivedAt", header: "Thời gian" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<NotificationRow["status"]>();
          return <UiStatusBadge role={notificationRole[value]}>{value}</UiStatusBadge>;
        },
      },
      { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ view: () => setSelectedNotification(row.original) }} labels={{ view: "Xem thông báo" }} /> },
    ],
    [],
  );
  const columns = (isNotifications ? notificationColumns : conversationColumns) as ColumnDef<Record<string, unknown>>[];
  const unreadCount = notificationRows.filter((item) => item.status === "Chưa đọc").length;
  const readCount = notificationRows.length - unreadCount;
  const openCount = conversationRows.filter((item) => item.status === "Đang mở").length;
  const pinnedCount = conversationRows.filter((item) => item.status === "Đã ghim").length;
  const closedCount = conversationRows.filter((item) => item.status === "Đã đóng").length;
  const currentCount = data.length;
  const table = useReactTable({
    data: data as Record<string, unknown>[],
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className="page">
      <PageHeader
        title={isNotifications ? "Hộp thông báo" : "Trung tâm trao đổi"}
        subtitle={
          isNotifications
            ? "Xem thông báo được gửi đến vai trò của bạn và theo dõi trạng thái đã đọc."
            : "Quản lý trao đổi nội bộ giữa tuyển sinh, học vụ, tài chính, nhân sự và các bên liên quan."
        }
      />
      <Paper withBorder p="lg" mb="md" className="communication-summary" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group align="flex-start" gap="md">
            <ThemeIcon size={48} radius="md" color={isNotifications ? "orange" : "blue"} variant="light">
              {isNotifications ? <Bell size={25} /> : <MessageSquare size={25} />}
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">{isNotifications ? "Trung tâm thông báo" : "Kênh phối hợp nội bộ"}</Text>
              <Text fz={32} fw={800} lh={1.1}>{isNotifications ? `${unreadCount} chưa đọc` : `${openCount} trao đổi đang mở`}</Text>
              <Text size="sm" c="dimmed" mt={6}>{isNotifications ? "Ưu tiên xử lý các thông báo chưa đọc theo phạm vi vai trò." : "Trao đổi theo đúng ngữ cảnh nghiệp vụ, không tách rời khỏi hồ sơ liên quan."}</Text>
            </div>
          </Group>
          <div>
            <Text size="xs" c="dimmed">Đang hiển thị</Text>
            <Text fw={750} ta="right">{currentCount} bản ghi</Text>
          </div>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        {isNotifications ? <>
          <Metric icon={<Bell size={18} />} label="Tổng thông báo" value={`${notificationRows.length}`} detail="trong hộp vai trò" color="blue" />
          <Metric icon={<MessageSquare size={18} />} label="Chưa đọc" value={`${unreadCount}`} detail="cần xem xét" color="orange" />
          <Metric icon={<Bell size={18} />} label="Đã đọc" value={`${readCount}`} detail="đã xử lý" color="teal" />
          <Metric icon={<MessageSquare size={18} />} label="Nguồn nghiệp vụ" value={`${new Set(notificationRows.map((item) => item.source)).size}`} detail="đang phân phối" color="violet" />
        </> : <>
          <Metric icon={<MessageSquare size={18} />} label="Tổng trao đổi" value={`${conversationRows.length}`} detail="trong lịch sử nội bộ" color="blue" />
          <Metric icon={<MessageSquare size={18} />} label="Đang mở" value={`${openCount}`} detail="cần phối hợp" color="teal" />
          <Metric icon={<Bell size={18} />} label="Đã ghim" value={`${pinnedCount}`} detail="ưu tiên theo dõi" color="orange" />
          <Metric icon={<MessageSquare size={18} />} label="Đã đóng" value={`${closedCount}`} detail="đã hoàn tất" color="violet" />
        </>}
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder={isNotifications ? "Tìm thông báo, đối tượng..." : "Tìm cuộc trao đổi, thành viên..."}
        />
        <UiSelect
          aria-label="Lọc trạng thái"
          w={180}
          value={status}
          onChange={setStatus}
          data={
            isNotifications
              ? [{ value: "all", label: "Tất cả trạng thái" }, "Chưa đọc", "Đã đọc"]
              : [{ value: "all", label: "Tất cả trạng thái" }, "Đang mở", "Đã ghim", "Đã đóng"]
          }
        />
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <div>
            <Text fw={700}>{isNotifications ? "Danh sách thông báo" : "Danh sách trao đổi nội bộ"}</Text>
            <Text size="sm" c="dimmed">{isNotifications ? "Theo dõi nguồn, phạm vi và trạng thái đã đọc." : "Theo dõi thành viên, cập nhật gần nhất và trạng thái phối hợp."}</Text>
          </div>
          <UiBadge>{currentCount} bản ghi</UiBadge>
        </Group>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={980}
          emptyTitle={isNotifications ? "Không tìm thấy thông báo phù hợp." : "Không tìm thấy cuộc trao đổi phù hợp."}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {isNotifications ? "Thông báo được phân phối theo vai trò, nguồn nghiệp vụ và phạm vi được ủy quyền." : "Mở một dòng để xem ngữ cảnh và phản hồi trực tiếp trong luồng nội bộ."} · {table.getRowModel().rows.length}/{baseData.length} bản ghi.
        </Text>
      </Paper>
      <UiModal opened={selectedConversation !== null} onClose={() => setSelectedConversation(null)} title={selectedConversation?.subject ?? "Trao đổi nội bộ"} size="md">
        {selectedConversation ? <Stack gap="sm"><Group justify="space-between"><div><Text fw={700}>{selectedConversation.subject}</Text><Text size="sm" c="dimmed">{selectedConversation.type} · {selectedConversation.members}</Text></div><UiStatusBadge role={conversationRole[selectedConversation.status]}>{selectedConversation.status}</UiStatusBadge></Group><Text size="sm">{selectedConversation.lastMessage}</Text><Textarea label="Phản hồi" value={message} onChange={(event) => setMessage(event.currentTarget.value)} placeholder="Nhập nội dung trao đổi..." autosize minRows={3} /><Group justify="flex-end"><UiButton variant="default" onClick={() => setSelectedConversation(null)}>Đóng</UiButton><UiButton disabled={!message.trim()} onClick={() => { if (!selectedConversation || !message.trim()) return; const nextMessage = message.trim(); setConversationRows((current) => current.map((item) => item.subject === selectedConversation.subject ? { ...item, lastMessage: nextMessage, updatedAt: "Vừa xong", status: "Đang mở" } : item)); setSelectedConversation((current) => current ? { ...current, lastMessage: nextMessage, updatedAt: "Vừa xong", status: "Đang mở" } : current); setMessage(""); }}>Gửi phản hồi</UiButton></Group></Stack> : null}
      </UiModal>
      <UiModal opened={selectedNotification !== null} onClose={() => setSelectedNotification(null)} title={selectedNotification?.title ?? "Thông báo"} size="sm">
        {selectedNotification ? <Stack gap="sm"><Text fw={700}>{selectedNotification.title}</Text><Text size="sm" c="dimmed">Nguồn: {selectedNotification.source} · Phạm vi: {selectedNotification.scope}</Text><Text size="sm">Nhận lúc: {selectedNotification.receivedAt}</Text><UiStatusBadge role={notificationRole[selectedNotification.status]}>{selectedNotification.status}</UiStatusBadge><Group justify="flex-end"><UiButton variant="default" onClick={() => setSelectedNotification(null)}>Đóng</UiButton>{selectedNotification.status === "Chưa đọc" ? <UiButton onClick={() => { setNotificationRows((current) => current.map((item) => item.title === selectedNotification.title ? { ...item, status: "Đã đọc" } : item)); setSelectedNotification((current) => current ? { ...current, status: "Đã đọc" } : current); }}>Đánh dấu đã đọc</UiButton> : null}</Group></Stack> : null}
      </UiModal>
    </div>
  );
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>;
}
