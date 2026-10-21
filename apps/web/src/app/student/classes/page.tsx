"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { BookOpen, CalendarClock, Search, UsersRound } from "lucide-react";
import { Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { studentClasses, type StudentClass, type StudentClassStatus } from "./student-class-data";

const statusRole: Record<StudentClassStatus, "success" | "info" | "neutral"> = { "Đang học": "success", "Sắp khai giảng": "info", "Đã hoàn thành": "neutral" };

export default function StudentClassesPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => studentClasses.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (status === "all" || !status || item.status === status)), [query, status]);
  const columns = useMemo<ColumnDef<StudentClass>[]>(() => [
    { accessorKey: "code", header: "Lớp học", cell: ({ row }) => <div><Link className="tableLinkButton" href={`/student/classes/${row.original.id}`}><Text fw={600}>{row.original.code}</Text></Link><Text size="xs" c="dimmed">{row.original.subject} · {row.original.program}</Text></div> },
    { accessorKey: "teacher", header: "Giảng viên" },
    { accessorKey: "schedule", header: "Lịch cố định", cell: ({ row }) => <div><Text size="sm">{row.original.schedule}</Text><Text size="xs" c="dimmed">{row.original.room}</Text></div> },
    { accessorKey: "nextSession", header: "Buổi kế tiếp" },
    { accessorKey: "progress", header: "Tiến độ", cell: ({ row }) => <UiStatusBadge role="info">{row.original.progress}%</UiStatusBadge> },
    { accessorKey: "attendance", header: "Điểm danh" },
    { accessorKey: "score", header: "Điểm gần nhất" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<StudentClassStatus>(); return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton component={Link} href={`/student/classes/${row.original.id}`} size="compact-xs" variant="subtle">Mở lớp</UiButton> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page studentWorkspace">
    <PageHeader title="Lớp học của tôi" subtitle="Theo dõi từng lớp, từng buổi học và toàn bộ học liệu, bài tập, điểm danh, điểm số trong cùng một luồng." />
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
      <Paper className="panel" p="md" withBorder><Group gap="sm"><BookOpen size={20} /><div><Text size="xs" c="dimmed">LỚP ĐANG HỌC</Text><Text fz={25} fw={700}>{studentClasses.filter((item) => item.status === "Đang học").length}</Text></div></Group></Paper>
      <Paper className="panel" p="md" withBorder><Group gap="sm"><CalendarClock size={20} /><div><Text size="xs" c="dimmed">BUỔI KẾ TIẾP</Text><Text fz={25} fw={700}>3</Text></div></Group></Paper>
      <Paper className="panel" p="md" withBorder><Group gap="sm"><UsersRound size={20} /><div><Text size="xs" c="dimmed">TIẾN ĐỘ TRUNG BÌNH</Text><Text fz={25} fw={700}>{Math.round(studentClasses.reduce((sum, item) => sum + item.progress, 0) / studentClasses.length)}%</Text></div></Group></Paper>
    </SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm lớp học" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm lớp, môn, giảng viên..." style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc trạng thái lớp" w={180} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, "Đang học", "Sắp khai giảng", "Đã hoàn thành"]} /></PageToolbar>
    <UiDataTable table={table} columnCount={columns.length} minWidth={1280} emptyTitle="Không tìm thấy lớp học phù hợp." />
    <Text size="xs" c="dimmed" mt="sm">Mỗi lớp có trang chi tiết riêng. Học viên chỉ nhìn thấy dữ liệu và học liệu đã được công bố cho lớp mình ghi danh.</Text>
  </div>;
}
