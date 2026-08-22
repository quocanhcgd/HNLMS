"use client";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea } from "@mantine/core";
import { ClipboardCheck, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ReviewRow = { student: string; skill: string; currentLevel: string; confidence: number; suggestedLevel: string; status: "Chờ rà soát" | "Đã xác nhận" | "Cần luyện thêm" };
const rows: ReviewRow[] = [
  { student: "Nguyễn Minh Anh", skill: "Speaking", currentLevel: "A2", confidence: 54, suggestedLevel: "A2", status: "Chờ rà soát" },
  { student: "Trần Gia Huy", skill: "Writing", currentLevel: "A1", confidence: 62, suggestedLevel: "A2", status: "Cần luyện thêm" },
  { student: "Lê Phương Linh", skill: "Reading", currentLevel: "B1", confidence: 88, suggestedLevel: "B1", status: "Đã xác nhận" },
];
const role = { "Chờ rà soát": "warning", "Đã xác nhận": "success", "Cần luyện thêm": "danger" } as const;
export function TeacherEnglishWorkspace() {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState<string | null>("all"); const [sorting, setSorting] = useState<SortingState>([]); const [note, setNote] = useState("Học viên diễn đạt đủ ý nhưng cần tăng độ trôi chảy và phát âm cuối từ.");
  const data = useMemo(() => rows.filter((x) => (status === "all" || !status || x.status === status) && JSON.stringify(x).toLowerCase().includes(query.toLowerCase())), [query, status]);
  const columns = useMemo<ColumnDef<ReviewRow>[]>(() => [
    { accessorKey: "student", header: "Học viên", cell: ({ row }) => <div><Text fw={600}>{row.original.student}</Text><Text size="xs" c="dimmed">{row.original.skill} · {row.original.currentLevel}</Text></div> },
    { accessorKey: "confidence", header: "Độ tin cậy", cell: ({ getValue }) => <UiStatusBadge role={getValue<number>() < 60 ? "warning" : "info"}>{getValue<number>()}%</UiStatusBadge> },
    { accessorKey: "suggestedLevel", header: "Level đề xuất" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const v = getValue<ReviewRow["status"]>(); return <UiStatusBadge role={role[v]}>{v}</UiStatusBadge>; } },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page"><PageHeader title="Rà soát tiếng Anh" subtitle="Giáo viên xác nhận level bốn kỹ năng, ghi nhận tiến bộ và tạo nhận xét thủ công." />
    <PageToolbar className="toolbar"><UiTextInput value={query} onChange={(e)=>setQuery(e.currentTarget.value)} leftSection={<Search size={16}/>} placeholder="Tìm học viên, kỹ năng..." style={{minWidth:280}}/><UiSelect w={190} value={status} onChange={setStatus} data={[{value:"all",label:"Tất cả trạng thái"},{value:"Chờ rà soát",label:"Chờ rà soát"},{value:"Đã xác nhận",label:"Đã xác nhận"},{value:"Cần luyện thêm",label:"Cần luyện thêm"}]}/></PageToolbar>
    <SimpleGrid cols={{base:1, xl:2}} spacing="md"><Stack><UiDataTable table={table} columnCount={columns.length} minWidth={820} emptyTitle="Không tìm thấy học viên cần rà soát."/><Text size="xs" c="dimmed">{table.getRowModel().rows.length}/{rows.length} bản ghi · TanStack Table chuẩn chung</Text></Stack><Paper className="panel" p="lg" withBorder><Group justify="space-between"><div><Text fw={700}>Nhận xét thủ công</Text><Text size="sm" c="dimmed">Ghi nhận review để cập nhật skill record mới nhất.</Text></div><ClipboardCheck size={22}/></Group><Stack mt="md"><UiSelect label="Level xác nhận" defaultValue="A2" data={["A1","A2","B1","B2","C1","C2"]}/><Textarea label="Nhận xét" minRows={6} value={note} onChange={(e)=>setNote(e.currentTarget.value)}/><Group justify="flex-end"><UiButton variant="default">Lưu nháp</UiButton><UiButton leftSection={<Send size={16}/>}>Ghi nhận review</UiButton></Group></Stack></Paper></SimpleGrid></div>;
}
