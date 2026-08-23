"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { CalendarClock, CheckCircle2, ClipboardCheck, Search, Video } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ClassStatus = "Đang dạy" | "Sắp khai giảng" | "Cần rà soát";
type TeachingClass = {
  classCode: string;
  course: string;
  students: number;
  schedule: string;
  nextSession: string;
  prepared: string;
  attendance: string;
  status: ClassStatus;
};

const classes: TeachingClass[] = [
  {
    classCode: "IF-2609",
    course: "IELTS Foundation · A2+",
    students: 18,
    schedule: "T2/T4/T6 · 18:00-19:30",
    nextSession: "Hôm nay · Listening clinic",
    prepared: "4/5 học liệu",
    attendance: "Chưa ghi",
    status: "Cần rà soát",
  },
  {
    classCode: "TOEIC-2609",
    course: "TOEIC 700+ · Reading",
    students: 16,
    schedule: "T2/T5 · 19:45-21:15",
    nextSession: "Ngày mai · Mini test review",
    prepared: "5/5 học liệu",
    attendance: "14/16",
    status: "Đang dạy",
  },
  {
    classCode: "IA-2610",
    course: "IELTS Academic · Speaking",
    students: 12,
    schedule: "T3/T6 · 17:00-18:30",
    nextSession: "Thứ sáu · Speaking practice",
    prepared: "3/5 học liệu",
    attendance: "10/12",
    status: "Sắp khai giảng",
  },
];

const statusRole: Record<ClassStatus, "success" | "warning" | "info"> = {
  "Đang dạy": "success",
  "Sắp khai giảng": "info",
  "Cần rà soát": "warning",
};

export default function TeacherClassesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () => classes.filter((item) => {
      const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "all" || !status || item.status === status;
      return matchesQuery && matchesStatus;
    }),
    [query, status],
  );
  const columns = useMemo<ColumnDef<TeachingClass>[]>(() => [
    {
      accessorKey: "classCode",
      header: "Lớp được phân công",
      cell: ({ row }) => <div><Link className="tableLinkButton" href={`/teacher/classes/${row.original.classCode.toLowerCase()}`}><Text fw={600}>{row.original.classCode}</Text></Link><Text size="xs" c="dimmed">{row.original.course}</Text></div>,
    },
    { accessorKey: "students", header: "Sĩ số", cell: ({ getValue }) => <Text>{getValue<number>()} học viên</Text> },
    { accessorKey: "schedule", header: "Lịch cố định" },
    { accessorKey: "nextSession", header: "Buổi kế tiếp" },
    { accessorKey: "prepared", header: "Học liệu" },
    { accessorKey: "attendance", header: "Điểm danh" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<ClassStatus>(); return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page">
    <PageHeader title="Lớp đang dạy" subtitle="Lớp được phân công, buổi kế tiếp, học liệu cần chuẩn bị và việc giáo viên cần xử lý." />
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm lớp đang dạy" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm lớp, khóa học, buổi dạy..." style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc trạng thái lớp" w={190} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, ...Object.keys(statusRole).map((value) => ({ value, label: value }))]} /></PageToolbar>
    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md"><Stack><UiDataTable table={table} columnCount={columns.length} minWidth={1180} emptyTitle="Không tìm thấy lớp được phân công." /><Text size="xs" c="dimmed">{table.getRowModel().rows.length}/{classes.length} lớp · dữ liệu mẫu teacher workspace</Text></Stack><Paper className="panel" p="lg" withBorder><Group justify="space-between"><div><Text fw={700}>Buổi kế tiếp cần chuẩn bị</Text><Text size="sm" c="dimmed">IF-2609 · hôm nay 18:00-19:30</Text></div><CalendarClock size={22} /></Group><Stack mt="md" gap="sm"><Group justify="space-between"><Text size="sm">Bài giảng</Text><UiStatusBadge role="success">Đã có</UiStatusBadge></Group><Group justify="space-between"><Text size="sm">Bài tập trên lớp</Text><UiStatusBadge role="success">Đã có</UiStatusBadge></Group><Group justify="space-between"><Text size="sm">Bài kiểm tra</Text><UiStatusBadge role="success">Đã có</UiStatusBadge></Group><Group justify="space-between"><Text size="sm">Bài tập về nhà</Text><UiStatusBadge role="warning">Chưa có</UiStatusBadge></Group><Group justify="space-between"><Text size="sm">Tài liệu tham khảo</Text><UiStatusBadge role="success">Đã có</UiStatusBadge></Group><Group justify="flex-end" mt="xs"><UiButton variant="default" leftSection={<ClipboardCheck size={16} />}>Điểm danh</UiButton><UiButton leftSection={<Video size={16} />}>Mở buổi dạy</UiButton></Group></Stack></Paper></SimpleGrid>
    <Paper className="panel" p="lg" mt="md" withBorder><Group><CheckCircle2 size={20} /><div><Text fw={700}>Sau buổi dạy</Text><Text size="sm" c="dimmed">Bài tập trên lớp chấm ngay; bài tập về nhà đi vào hàng đợi chấm sau. Worklog chỉ gửi payroll sau khi giáo viên xác nhận.</Text></div></Group></Paper>
  </div>;
}
