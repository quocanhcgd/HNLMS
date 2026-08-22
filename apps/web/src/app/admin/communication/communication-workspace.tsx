"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Text } from "@mantine/core";
import { Bell, MessageSquare, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

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
  audience: string;
  channel: string;
  delivery: string;
  sentAt: string;
  status: "Đã gửi" | "Đang chờ" | "Lỗi gửi";
};

const conversations: ConversationRow[] = [
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
    audience: "Lớp IF-2609",
    channel: "In-app, Email",
    delivery: "28/28",
    sentAt: "22/08/2026 08:00",
    status: "Đã gửi",
  },
  {
    title: "Thông báo học phí đợt 2",
    audience: "Phụ huynh có ủy quyền tài chính",
    channel: "Email",
    delivery: "12/14",
    sentAt: "22/08/2026 10:00",
    status: "Đang chờ",
  },
  {
    title: "Bài tập Unit 5",
    audience: "Học viên IF-2609",
    channel: "In-app",
    delivery: "13/14",
    sentAt: "21/08/2026 21:00",
    status: "Lỗi gửi",
  },
];

const conversationRole = { "Đang mở": "success", "Đã ghim": "info", "Đã đóng": "neutral" } as const;
const notificationRole = { "Đã gửi": "success", "Đang chờ": "warning", "Lỗi gửi": "danger" } as const;

export function CommunicationWorkspace({ section }: { section: Section }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const isNotifications = section === "notifications";
  const baseData = isNotifications ? notifications : conversations;
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
                {row.original.audience}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "channel", header: "Kênh" },
      { accessorKey: "delivery", header: "Delivery" },
      { accessorKey: "sentAt", header: "Thời gian" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<NotificationRow["status"]>();
          return <UiStatusBadge role={notificationRole[value]}>{value}</UiStatusBadge>;
        },
      },
    ],
    [],
  );
  const columns = (isNotifications ? notificationColumns : conversationColumns) as ColumnDef<Record<string, unknown>>[];
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
            ? "Theo dõi thông báo, kênh gửi và trạng thái delivery."
            : "Quản lý trao đổi nội bộ, lớp học và trao đổi ba bên với phụ huynh."
        }
      />
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
              ? [{ value: "all", label: "Tất cả trạng thái" }, "Đã gửi", "Đang chờ", "Lỗi gửi"]
              : [{ value: "all", label: "Tất cả trạng thái" }, "Đang mở", "Đã ghim", "Đã đóng"]
          }
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={980}
        emptyTitle={isNotifications ? "Không tìm thấy thông báo phù hợp." : "Không tìm thấy cuộc trao đổi phù hợp."}
      />
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length}/{baseData.length} bản ghi · dùng chung chuẩn bảng và toolbar.
      </Text>
    </div>
  );
}
