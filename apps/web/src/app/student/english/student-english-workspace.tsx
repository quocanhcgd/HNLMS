"use client";
import { useMemo, useState } from "react";
import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { ArrowRight, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { listStudentCompetencyProfiles } from "@/lib/competency-profiles";

export function StudentEnglishWorkspace() {
  const rows = useMemo(() => listStudentCompetencyProfiles("student-minh-anh"), []);
  const [query, setQuery] = useState(""); const [subject, setSubject] = useState<string | null>("all"); const [program, setProgram] = useState<string | null>("all"); const [sorting, setSorting] = useState<SortingState>([]);
  type StudentProfileRow = { studentId: string; studentName: string; subjectId: string; subjectName: string; programId: string; programName: string; className: string; competencies: CompetencyProfileReadModel[]; currentScore: number; targetScore: number; confidence: number };
  const grouped = useMemo<StudentProfileRow[]>(() => Array.from(rows.reduce((groups, row) => {
    const key = `${row.studentId}:${row.classId}:${row.programId}`;
    const current = groups.get(key) ?? { studentId: row.studentId, studentName: row.studentName, subjectId: row.subjectId, subjectName: row.subjectName, programId: row.programId, programName: row.programName, className: row.className, competencies: [], currentScore: 0, targetScore: 0, confidence: 0 };
    current.competencies.push(row);
    groups.set(key, current);
    return groups;
  }, new Map<string, StudentProfileRow>()).values()).map((row) => ({
    ...row,
    currentScore: Math.round(row.competencies.reduce((sum, item) => sum + (item.current.normalizedScore ?? 0), 0) / row.competencies.length),
    targetScore: Math.round(row.competencies.reduce((sum, item) => sum + (item.target.normalizedScore ?? 0), 0) / row.competencies.length),
    confidence: Math.round(row.competencies.reduce((sum, item) => sum + item.confidence, 0) / row.competencies.length),
  })), [rows]);
  const data = useMemo(() => grouped.filter((row) => (subject === "all" || !subject || row.subjectId === subject) && (program === "all" || !program || row.programId === program) && JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [grouped, program, query, subject]);
  const [selected, setSelected] = useState<StudentProfileRow | null>(null);
  const columns = useMemo<ColumnDef<StudentProfileRow>[]>(() => [
    { accessorKey: "studentName", header: "Học viên", cell: ({ row }) => <div><Text fw={600}>{row.original.studentName}</Text><Text size="xs" c="dimmed">{row.original.className} · {row.original.subjectName} · {row.original.programName}</Text></div> },
    { id: "competencies", header: "Năng lực", cell: ({ row }) => <Text size="sm">{row.original.competencies.map((item) => item.competencyName).join(" · ")}</Text> },
    { accessorKey: "currentScore", header: "Hiện tại", cell: ({ row }) => <Group gap="xs" wrap="nowrap"><Progress value={row.original.currentScore} w={90} /><Text size="sm">{row.original.currentScore}%</Text></Group> },
    { accessorKey: "targetScore", header: "Mục tiêu", cell: ({ row }) => <Text size="sm">{row.original.targetScore}%</Text> },
    { accessorKey: "confidence", header: "Tin cậy", cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge> },
    { id: "evidence", header: "Minh chứng", cell: ({ row }) => <Text size="sm">{row.original.competencies.length} minh chứng đã công bố</Text> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant="subtle" rightSection={<ArrowRight size={14} />} onClick={() => setSelected(row.original)}>Xem chi tiết</UiButton> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page"><PageHeader title="Hồ sơ năng lực" subtitle="Mỗi học viên hiển thị một dòng theo lớp và chương trình; các kỹ năng được xem trong chi tiết." /><PageToolbar className="toolbar"><UiTextInput aria-label="Tìm hồ sơ năng lực" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm học viên, môn, năng lực..." style={{ minWidth: 290 }} /><UiSelect aria-label="Lọc môn học" w={160} value={subject} onChange={setSubject} data={[{ value: "all", label: "Tất cả môn" }, { value: "english", label: "Tiếng Anh" }, { value: "math", label: "Toán" }, { value: "literature", label: "Ngữ văn" }]} /><UiSelect aria-label="Lọc chương trình" w={180} value={program} onChange={setProgram} data={[{ value: "all", label: "Tất cả chương trình" }, { value: "teen-b1", label: "Teen B1" }, { value: "math-foundation", label: "Nền tảng THCS" }, { value: "literature-grade-10", label: "Luyện thi 10" }]} /></PageToolbar><SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md"><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Hồ sơ đã công bố</Text><Text fz={24} fw={700}>{data.length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Kỹ năng theo dõi</Text><Text fz={24} fw={700}>{data.reduce((sum, item) => sum + item.competencies.length, 0)}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Tiến bộ trung bình</Text><Text fz={24} fw={700}>{data.length ? Math.round(data.reduce((sum, item) => sum + item.currentScore, 0) / data.length) : 0}%</Text></Paper></SimpleGrid><UiDataTable table={table} columnCount={columns.length} minWidth={1180} emptyTitle="Chưa có hồ sơ năng lực đã công bố." /><Text size="xs" c="dimmed" mt="sm">Chỉ hiển thị minh chứng đã công bố; bản nháp, ghi chú riêng và hàng đợi chấm bài không được đưa vào cổng học viên.</Text><UiModal opened={selected !== null} onClose={() => setSelected(null)} title={selected ? `Chi tiết năng lực · ${selected.studentName}` : "Chi tiết năng lực"} size="lg"><Stack gap="md">{selected ? <><Text size="sm" c="dimmed">{selected.className} · {selected.subjectName} · {selected.programName}</Text>{selected.competencies.map((item) => <Paper key={item.profileId} className="panelHighlight" p="md"><Group justify="space-between"><Text fw={600}>{item.competencyName}</Text><UiStatusBadge role="info">Tin cậy {item.confidence}%</UiStatusBadge></Group><SimpleGrid cols={3} mt="sm"><div><Text size="xs" c="dimmed">Đầu vào</Text><Text size="sm">{item.baseline.label}</Text></div><div><Text size="xs" c="dimmed">Hiện tại</Text><Text size="sm">{item.current.label}</Text></div><div><Text size="xs" c="dimmed">Mục tiêu</Text><Text size="sm">{item.target.label}</Text></div></SimpleGrid><Text size="sm" mt="sm">{item.teacherFeedback ?? "Chưa có nhận xét giáo viên."}</Text><Text size="xs" c="dimmed" mt="xs">Minh chứng: {item.evidence.sourceLabel} · {item.evidence.summary}</Text></Paper>)}</> : null}</Stack></UiModal></div>;
}
