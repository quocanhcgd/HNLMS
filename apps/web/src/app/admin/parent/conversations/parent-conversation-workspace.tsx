"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiStatusBadge, UiTextInput } from "@/components/ui";

type Row = {
  subject: string;
  student: string;
  teacher: string;
  lastMessage: string;
  updatedAt: string;
  status: "Đang mở" | "Chờ phản hồi" | "Đã đóng";
};
const rows: Row[] = [
  {
    subject: "Trao đổi tiến độ tuần",
    student: "Nguyễn An",
    teacher: "Lan Anh",
    lastMessage: "Giáo viên đã gửi nhận xét mới",
    updatedAt: "22/08/2026 15:10",
    status: "Đang mở",
  },
  {
    subject: "Xin nghỉ buổi 26/08",
    student: "Nguyễn An",
    teacher: "Minh Tuấn",
    lastMessage: "Phụ huynh đã gửi lý do",
    updatedAt: "21/08/2026 20:00",
    status: "Chờ phản hồi",
  },
];

export function ParentConversationWorkspace() {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "subject",
        header: "Chủ đề",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.subject}</Text>
            <Text size="xs" c="dimmed">
              {row.original.student}
            </Text>
          </div>
        ),
      },
      { accessorKey: "teacher", header: "Giảng viên" },
      { accessorKey: "lastMessage", header: "Tin cuối" },
      { accessorKey: "updatedAt", header: "Cập nhật" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<Row["status"]>();
          return (
            <UiStatusBadge role={value === "Đang mở" ? "success" : value === "Chờ phản hồi" ? "warning" : "neutral"}>
              {value}
            </UiStatusBadge>
          );
        },
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
  return (
    <div className="page">
      <PageHeader
        title="Trao đổi với giáo viên"
        subtitle="Cuộc trao đổi ba bên theo từng học viên và phạm vi ủy quyền của phụ huynh."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm chủ đề, giáo viên..."
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={900}
        emptyTitle="Không tìm thấy trao đổi phù hợp."
      />
    </div>
  );
}
