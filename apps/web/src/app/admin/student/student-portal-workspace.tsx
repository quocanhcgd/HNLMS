"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Text } from "@mantine/core";
import { CalendarClock, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiStatusBadge, UiTextInput } from "@/components/ui";

type StudentPortalSection = "progress" | "schedule" | "scores" | "tuition" | "homework";
type Row = {
  classCode: string;
  courseName: string;
  teacher: string;
  schedule: string;
  progress: number;
  attendance: string;
  score: string;
  tuition: string;
  homework: string;
  status: "Đang học" | "Hoàn thành" | "Cần hỗ trợ";
};
const rows: Row[] = [
  {
    classCode: "IF-2609",
    courseName: "IELTS Foundation",
    teacher: "Lan Anh",
    schedule: "T2/T4/T6 · 18:00-19:30",
    progress: 62,
    attendance: "12/14 buổi",
    score: "8.1/10",
    tuition: "Còn 2.000.000đ · hạn 30/08",
    homework: "Unit 5 · hạn 26/08",
    status: "Đang học",
  },
  {
    classCode: "TOEIC-2609",
    courseName: "TOEIC 700+",
    teacher: "Minh Tuấn",
    schedule: "T2/T5 · 19:45-21:15",
    progress: 18,
    attendance: "4/5 buổi",
    score: "560/990",
    tuition: "Đã hoàn tất",
    homework: "Mini test 2 · hạn 28/08",
    status: "Cần hỗ trợ",
  },
];
const role = { "Đang học": "info", "Hoàn thành": "success", "Cần hỗ trợ": "warning" } as const;

export function StudentPortalWorkspace({ section }: { section: StudentPortalSection }) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "classCode",
        header: "Lớp",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.classCode}</Text>
            <Text size="xs" c="dimmed">
              {row.original.courseName}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "schedule",
        header: "Lịch học",
        cell: ({ getValue }) => (
          <Group gap="xs" wrap="nowrap">
            <CalendarClock size={15} />
            <Text size="sm">{getValue<string>()}</Text>
          </Group>
        ),
      },
      { accessorKey: "teacher", header: "Giảng viên" },
      {
        accessorKey: "progress",
        header: "Tiến độ",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge>,
      },
      { accessorKey: "attendance", header: "Điểm danh" },
      { accessorKey: "score", header: "Điểm" },
      { accessorKey: "tuition", header: "Học phí" },
      { accessorKey: "homework", header: "Bài tập" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<Row["status"]>();
          return <UiStatusBadge role={role[value]}>{value}</UiStatusBadge>;
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
        title="Cổng học viên"
        subtitle="Theo dõi lịch học, tiến độ, điểm số, học phí và bài tập theo cùng chuẩn giao diện chung."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm lớp, lịch, bài tập..."
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1180}
        emptyTitle="Không tìm thấy dữ liệu học tập phù hợp."
      />
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length}/{rows.length} bản ghi · áp dụng chuẩn bảng, toolbar và màu
        trạng thái chung.
      </Text>
    </div>
  );
}
