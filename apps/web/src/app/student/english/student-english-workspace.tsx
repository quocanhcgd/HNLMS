"use client";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { BookOpenCheck, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type SkillRow = { skill: string; level: string; percent: number; confidence: number; nextActivity: string; status: "Ổn định" | "Cần luyện thêm" | "Cần giáo viên rà soát" };
const rows: SkillRow[] = [
  { skill: "Listening", level: "A2", percent: 62, confidence: 88, nextActivity: "Nghe lấy ý chính Unit 4", status: "Ổn định" },
  { skill: "Speaking", level: "A2", percent: 58, confidence: 54, nextActivity: "Gửi bài nói 2 phút", status: "Cần giáo viên rà soát" },
  { skill: "Reading", level: "B1", percent: 70, confidence: 82, nextActivity: "Skimming practice", status: "Ổn định" },
  { skill: "Writing", level: "A2", percent: 50, confidence: 66, nextActivity: "Viết đoạn mô tả biểu đồ", status: "Cần luyện thêm" },
];
const role = { "Ổn định": "success", "Cần luyện thêm": "warning", "Cần giáo viên rà soát": "danger" } as const;
export function StudentEnglishWorkspace() {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<string | null>("all"); const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => rows.filter((x) => (status === "all" || !status || x.status === status) && JSON.stringify(x).toLowerCase().includes(query.toLowerCase())), [query, status]);
  const columns = useMemo<ColumnDef<SkillRow>[]>(() => [
    { accessorKey: "skill", header: "Kỹ năng", cell: ({ row }) => <div><Text fw={600}>{row.original.skill}</Text><Text size="xs" c="dimmed">Level {row.original.level}</Text></div> },
    { accessorKey: "percent", header: "Tiến bộ", cell: ({ getValue }) => <Group gap="xs" wrap="nowrap"><Progress value={getValue<number>()} w={110} /><Text size="sm">{getValue<number>()}%</Text></Group> },
    { accessorKey: "confidence", header: "Độ tin cậy", cell: ({ getValue }) => <UiStatusBadge role={getValue<number>() < 60 ? "warning" : "info"}>{getValue<number>()}%</UiStatusBadge> },
    { accessorKey: "nextActivity", header: "Hoạt động tiếp theo" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const v = getValue<SkillRow["status"]>(); return <UiStatusBadge role={role[v]}>{v}</UiStatusBadge>; } },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page"><PageHeader title="Lộ trình tiếng Anh" subtitle="Theo dõi tiến bộ listening, speaking, reading, writing và hoạt động học phù hợp từng kỹ năng." />
    <PageToolbar className="toolbar"><UiTextInput value={query} onChange={(e)=>setQuery(e.currentTarget.value)} leftSection={<Search size={16}/>} placeholder="Tìm kỹ năng, hoạt động..." style={{minWidth:280}}/><UiSelect w={210} value={status} onChange={setStatus} data={[{value:"all",label:"Tất cả trạng thái"},{value:"Ổn định",label:"Ổn định"},{value:"Cần luyện thêm",label:"Cần luyện thêm"},{value:"Cần giáo viên rà soát",label:"Cần giáo viên rà soát"}]}/></PageToolbar>
    <SimpleGrid cols={{base:1, lg:2}} spacing="md"><Stack><UiDataTable table={table} columnCount={columns.length} minWidth={960} emptyTitle="Không tìm thấy dữ liệu lộ trình."/><Text size="xs" c="dimmed">{table.getRowModel().rows.length}/{rows.length} kỹ năng · TanStack Table chuẩn chung</Text></Stack><Paper className="panel" p="lg" withBorder><Group justify="space-between"><div><Text fw={700}>Mục tiêu hiện tại</Text><Text size="sm" c="dimmed">Hoàn thiện A2 đồng đều trước khi lên B1 Bridge.</Text></div><BookOpenCheck size={22}/></Group><Stack mt="md" gap="sm"><Text>Overall level: <b>A2</b></Text><Progress value={60}/><Text size="sm" c="dimmed">Ưu tiên speaking vì độ tin cậy thấp và cần giáo viên nhận xét thủ công.</Text></Stack></Paper></SimpleGrid></div>;
}
