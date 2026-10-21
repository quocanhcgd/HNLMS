"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { FileText, Search } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { getStudentLearningOutput } from "@/lib/student-learning-api";

type ScoreRecord = { id: string; className: string; subject: string; program: string; assessment: string; score: number; maxScore: number; recordedAt: string; feedback: string };
const scores: ScoreRecord[] = [
  { id: "score-1", className: "IF-2609", subject: "Tiếng Anh", program: "IELTS Foundation", assessment: "Listening clinic", score: 8.5, maxScore: 10, recordedAt: "25/08/2026", feedback: "Nắm ý chính tốt; cần tăng độ chính xác ở thông tin chi tiết." },
  { id: "score-2", className: "IF-2609", subject: "Tiếng Anh", program: "IELTS Foundation", assessment: "Writing Task 1", score: 7.5, maxScore: 10, recordedAt: "22/08/2026", feedback: "Bố cục rõ; cần cải thiện từ vựng học thuật." },
  { id: "score-3", className: "TOEIC-2609", subject: "Tiếng Anh", program: "TOEIC 700+", assessment: "Mock test Reading", score: 560, maxScore: 990, recordedAt: "20/08/2026", feedback: "Đã công bố kết quả thi thử và khuyến nghị luyện tốc độ đọc." },
  { id: "score-4", className: "MATH-2609", subject: "Toán", program: "Toán nâng cao", assessment: "Chuyên đề đại số 1", score: 8, maxScore: 10, recordedAt: "19/08/2026", feedback: "Hoàn thành đúng phương pháp; cần trình bày đầy đủ bước biến đổi." },
];

export default function StudentScoresPage() {
  const [apiScores, setApiScores] = useState<ScoreRecord[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void getStudentLearningOutput().then((outputs) => setApiScores(outputs.flatMap((output) => output.scores.map((score) => ({ id: score.id, className: output.className, subject: output.subjectName, program: output.programName, assessment: score.title, score: score.score, maxScore: score.maxScore, recordedAt: new Date(score.recordedAt).toLocaleDateString("vi-VN"), feedback: "Kết quả đã được giáo viên công bố." })) ))).catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được điểm số.")); }, []);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<string | null>("all");
  const [subjectFilter, setSubjectFilter] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<ScoreRecord | null>(null);
  const sourceScores = apiScores ?? scores;
  const filtered = useMemo(() => sourceScores.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (classFilter === "all" || !classFilter || item.className === classFilter) && (subjectFilter === "all" || !subjectFilter || item.subject === subjectFilter)), [classFilter, query, sourceScores, subjectFilter]);
  const columns = useMemo<ColumnDef<ScoreRecord>[]>(() => [
    { accessorKey: "assessment", header: "Bài đánh giá", cell: ({ row }) => <div><Text fw={600}>{row.original.assessment}</Text><Text size="xs" c="dimmed">{row.original.className} · {row.original.program}</Text></div> },
    { accessorKey: "subject", header: "Môn" },
    { id: "score", accessorFn: (row) => row.score / row.maxScore, header: "Điểm", cell: ({ row }) => <Text fw={700}>{row.original.score}/{row.original.maxScore}</Text> },
    { accessorKey: "recordedAt", header: "Ngày công bố" },
    { id: "status", header: "Trạng thái", enableSorting: false, cell: () => <UiStatusBadge role="success">Đã công bố</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant="default" leftSection={<FileText size={14} />} onClick={() => setSelected(row.original)}>Xem chi tiết</UiButton> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page">
    <PageHeader title="Điểm số" subtitle="Theo dõi toàn bộ điểm đã được giáo viên công bố theo môn, chương trình và lớp học." />
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm điểm số" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm bài đánh giá, lớp, chương trình..." style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc lớp học" w={170} value={classFilter} onChange={setClassFilter} data={[{ value: "all", label: "Tất cả lớp" }, "IF-2609", "TOEIC-2609", "MATH-2609"]} /><UiSelect aria-label="Lọc môn học" w={160} value={subjectFilter} onChange={setSubjectFilter} data={[{ value: "all", label: "Tất cả môn" }, "Tiếng Anh", "Toán"]} /></PageToolbar>
    {error ? <Text size="sm" c="orange" mb="sm">{error} Đang hiển thị dữ liệu mẫu.</Text> : null}
    <SimpleGrid cols={{ base: 1, lg: 4 }} spacing="md" mb="md"><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Kết quả đã công bố</Text><Text fz={24} fw={700}>{filtered.length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Lớp đang theo dõi</Text><Text fz={24} fw={700}>{new Set(filtered.map((item) => item.className)).size}</Text></Paper></SimpleGrid>
    <UiDataTable table={table} columnCount={columns.length} minWidth={1080} emptyTitle="Chưa có điểm số đã công bố phù hợp." />
    <Text size="xs" c="dimmed" mt="sm">Chỉ hiển thị điểm đã công bố; điểm nháp và kết quả đang chờ duyệt không xuất hiện ở cổng học viên.</Text>
    <UiModal opened={selected !== null} onClose={() => setSelected(null)} title={selected ? `Chi tiết điểm · ${selected.assessment}` : "Chi tiết điểm"}>{selected ? <Stack gap="sm"><Group justify="space-between"><Text>Điểm đạt được</Text><UiStatusBadge role="success">{selected.score}/{selected.maxScore}</UiStatusBadge></Group><Text size="sm">{selected.subject} · {selected.program} · {selected.className}</Text><Text size="sm">Ngày công bố: {selected.recordedAt}</Text><Paper className="panelHighlight" p="md"><Text size="sm">Nhận xét giáo viên</Text><Text size="sm" mt="xs">{selected.feedback}</Text></Paper><Group justify="flex-end"><UiButton onClick={() => setSelected(null)}>Đóng</UiButton></Group></Stack> : null}</UiModal>
  </div>;
}
