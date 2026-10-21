"use client";
import { PageHeader } from "@/components/app-shell";
import { Group, Paper, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import { CheckCircle2, Search, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { PageToolbar, UiDataTable, UiRowActions, UiStatusBadge, UiTextInput } from "@/components/ui";

type Status = "Chờ duyệt" | "Đã duyệt" | "Bị chặn";
type Row = { task: string; scope: string; risk: "Thấp" | "Cao"; confidence: string; status: Status };
const initialRows: Row[] = [
  { task: "Cảnh báo học viên có nguy cơ bỏ học", scope: "dropout_warning", risk: "Cao", confidence: "72%", status: "Chờ duyệt" },
  { task: "Tóm tắt nội dung bài học", scope: "content", risk: "Thấp", confidence: "91%", status: "Đã duyệt" },
];

export default function AiReviewPage() {
  const [items, setItems] = useState(initialRows); const [query, setQuery] = useState(""); const [sorting, setSorting] = useState<SortingState>([]); const [notice, setNotice] = useState("");
  const decide = (task: string, status: Status) => { setItems((current) => current.map((item) => item.task === task ? { ...item, status } : item)); setNotice(`${task}: ${status}.`); };
  const data = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "task", header: "AI task", cell: ({ row }) => <div><Text fw={600}>{row.original.task}</Text><Text size="xs" c="dimmed">{row.original.scope}</Text></div> },
    { accessorKey: "risk", header: "Mức rủi ro", cell: ({ getValue }) => <UiStatusBadge role={getValue<string>() === "Cao" ? "danger" : "info"}>{getValue<string>()}</UiStatusBadge> },
    { accessorKey: "confidence", header: "Độ tin cậy" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => <UiStatusBadge role={getValue<string>() === "Chờ duyệt" ? "warning" : getValue<string>() === "Bị chặn" ? "danger" : "success"}>{getValue<string>()}</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ publish: row.original.status === "Chờ duyệt" ? () => decide(row.original.task, "Đã duyệt") : undefined, archive: row.original.status === "Chờ duyệt" ? () => decide(row.original.task, "Bị chặn") : undefined }} labels={{ publish: "Duyệt kết quả", archive: "Từ chối" }} /> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const pending = items.filter((item) => item.status === "Chờ duyệt").length;
  const approved = items.filter((item) => item.status === "Đã duyệt").length;
  const blocked = items.filter((item) => item.status === "Bị chặn").length;
  return <div className="page"><PageHeader title="AI review" subtitle="Giải thích, duyệt, phản hồi và kháng nghị các kết quả AI theo policy." />
    <Paper withBorder p="lg" mb="md" className="panelHighlight" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap"><Group gap="md"><ThemeIcon size={46} radius="md" color="primary"><Sparkles size={23} /></ThemeIcon><div><Text size="sm" c="dimmed">Kiểm soát AI có trách nhiệm</Text><Text fz={27} fw={800}>{pending ? `${pending} kết quả cần quyết định` : "Hàng đợi đã được xử lý"}</Text><Text size="sm" c="dimmed" mt={4}>Mọi kết quả đều phải qua bước review trước khi được sử dụng trong vận hành.</Text></div></Group><UiStatusBadge role={pending ? "warning" : "success"} variant="dot">{pending ? "Cần review" : "Đã kiểm soát"}</UiStatusBadge></Group></Paper>
    <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md"><AiMetric icon={<ShieldAlert size={18} />} label="Chờ duyệt" value={`${pending}`} detail="cần quyết định" color="orange" /><AiMetric icon={<CheckCircle2 size={18} />} label="Đã duyệt" value={`${approved}`} detail="được phép sử dụng" color="teal" /><AiMetric icon={<ShieldAlert size={18} />} label="Bị chặn" value={`${blocked}`} detail="không được phát hành" color="red" /></SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm AI task" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm AI task, scope..." /><Text size="sm" c="dimmed">{data.length}/{items.length} task</Text></PageToolbar>{notice ? <Text size="sm" c="teal" mb="sm">{notice}</Text> : null}<Paper className="panel" p="md" withBorder><Group justify="space-between" mb="sm"><div><Text fw={700}>Hàng đợi review</Text><Text size="sm" c="dimmed">Kết quả AI và quyết định kiểm duyệt</Text></div><UiStatusBadge role="info">{items.length} bản ghi</UiStatusBadge></Group><UiDataTable table={table} columnCount={columns.length} minWidth={900} emptyTitle="Không có AI task cần review." /></Paper></div>;
}

function AiMetric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>;
}
