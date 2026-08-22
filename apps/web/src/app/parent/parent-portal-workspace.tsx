"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiStatusBadge, UiTextInput } from "@/components/ui";

type Row = {
  student: string;
  classCode: string;
  schedule: string;
  progress: number;
  score: string;
  tuition: string;
  homework: string;
  delegation: "Đang hiệu lực" | "Sắp hết hạn";
};
const rows: Row[] = [
  {
    student: "Nguyễn An",
    classCode: "IF-2609",
    schedule: "T2/T4/T6 · 18:00",
    progress: 62,
    score: "8.1/10",
    tuition: "Còn 2.000.000đ",
    homework: "Unit 5 · hạn 26/08",
    delegation: "Đang hiệu lực",
  },
  {
    student: "Nguyễn An",
    classCode: "TOEIC-2609",
    schedule: "T2/T5 · 19:45",
    progress: 18,
    score: "560/990",
    tuition: "Đã hoàn tất",
    homework: "Mini test 2",
    delegation: "Sắp hết hạn",
  },
];

export function ParentPortalWorkspace() {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "student",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.student}</Text>
            <Text size="xs" c="dimmed">
              {row.original.classCode}
            </Text>
          </div>
        ),
      },
      { accessorKey: "schedule", header: "Lịch học" },
      {
        accessorKey: "progress",
        header: "Tiến độ",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge>,
      },
      { accessorKey: "score", header: "Điểm" },
      { accessorKey: "tuition", header: "Học phí" },
      { accessorKey: "homework", header: "Bài tập" },
      {
        accessorKey: "delegation",
        header: "Ủy quyền",
        cell: ({ getValue }) => {
          const value = getValue<Row["delegation"]>();
          return <UiStatusBadge role={value === "Đang hiệu lực" ? "success" : "warning"}>{value}</UiStatusBadge>;
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
        title="Cổng phụ huynh"
        subtitle="Theo dõi lịch học, tiến độ, điểm, học phí và bài tập theo phạm vi ủy quyền từng học viên."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, học phí..."
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1050}
        emptyTitle="Không tìm thấy dữ liệu phụ huynh phù hợp."
      />
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length}/{rows.length} bản ghi · không tạo layout/bảng riêng.
      </Text>
    </div>
  );
}
