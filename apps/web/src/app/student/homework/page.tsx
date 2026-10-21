"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { FileText, Search, Send } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { studentLearningAssignmentApi, type StudentAssignment } from "@/lib/student-learning-assignment-api";

type HomeworkStatus = "not_started" | "draft" | "submitted" | "graded" | "overdue";
type HomeworkRecord = StudentAssignment & { status: HomeworkStatus };

const statusLabel: Record<HomeworkStatus, string> = { not_started: "Chưa làm", draft: "Bản nháp", submitted: "Đã nộp", graded: "Đã công bố điểm", overdue: "Quá hạn" };
const statusRole: Record<HomeworkStatus, "info" | "warning" | "neutral" | "success" | "danger"> = { not_started: "info", draft: "warning", submitted: "neutral", graded: "success", overdue: "danger" };
const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" });

function getStatus(item: StudentAssignment): HomeworkStatus {
  const submission = item.submission;
  if (submission?.lifecycle === "graded" && submission.gradePublicationStatus === "published") return "graded";
  if (submission?.lifecycle === "graded" || submission?.lifecycle === "submitted") return "submitted";
  if (submission?.lifecycle === "draft") return "draft";
  return item.dueAt && new Date(item.dueAt).getTime() < Date.now() ? "overdue" : "not_started";
}
function parseDueDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*[·-]\s*(\d{1,2}):(\d{2}))?$/);
  if (!match) return null;
  const [, day, month, year, hour = "00", minute = "00"] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
}
function dueAt(value?: string) {
  if (!value) return "Không đặt hạn";
  const parsed = parseDueDate(value);
  return parsed ? dateFormatter.format(parsed) : value;
}

export default function StudentHomeworkPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<HomeworkRecord | null>(null);
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState<"draft" | "submitted" | null>(null);

  const reload = async () => {
    setLoading(true); setError("");
    try { setAssignments(await studentLearningAssignmentApi.list("student-minh-anh", "if-2609")); }
    catch { setError("Chưa tải được bài tập từ hệ thống. Hãy kiểm tra kết nối dịch vụ và thử lại."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reload(); }, []);

  const rows = useMemo<HomeworkRecord[]>(() => assignments.map((item) => ({ ...item, status: getStatus(item) })), [assignments]);
  const filtered = useMemo(() => rows.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (status === "all" || !status || item.status === status)), [query, rows, status]);
  const open = (item: HomeworkRecord) => { setSelected(item); setAnswer(item.submission?.answer ?? ""); setNotice(""); };
  const save = async (lifecycle: "draft" | "submitted") => {
    if (!selected || !answer.trim()) return;
    setSaving(lifecycle);
    try {
      await studentLearningAssignmentApi.saveSubmission(selected.id, { enrollmentId: "enrollment-if-2609-minh-anh", answer, lifecycle });
      await reload(); setSelected(null);
      setNotice(lifecycle === "draft" ? "Đã lưu bản nháp trên hệ thống." : "Đã nộp bài; giáo viên sẽ chấm và công bố kết quả.");
    } catch { setError("Không thể lưu bài làm. Nội dung vẫn được giữ trong biểu mẫu để bạn thử lại."); }
    finally { setSaving(null); }
  };

  const columns = useMemo<ColumnDef<HomeworkRecord>[]>(() => [
    { accessorKey: "title", header: "Bài tập", cell: ({ row }) => <div><Text fw={600}>{row.original.title}</Text><Text size="xs" c="dimmed">{row.original.type}{row.original.sessionId ? " · " + row.original.sessionId : ""}</Text></div> },
    { accessorKey: "classId", header: "Lớp" },
    { accessorKey: "dueAt", header: "Hạn nộp", cell: ({ row }) => dueAt(row.original.dueAt) },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<HomeworkStatus>(); return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>; } },
    { id: "score", header: "Điểm", cell: ({ row }) => row.original.submission?.lifecycle === "graded" && row.original.submission.gradePublicationStatus === "published" ? row.original.submission.score + "/" + row.original.maxScore : "Chưa công bố" },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant="default" leftSection={<FileText size={14} />} onClick={() => open(row.original)}>Xem và làm bài</UiButton> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const readOnly = selected?.status === "submitted" || selected?.status === "graded" || selected?.status === "overdue";
  const published = selected?.submission?.lifecycle === "graded" && selected.submission.gradePublicationStatus === "published";

  return <div className="page">
    <PageHeader title="Bài tập" subtitle="Bài tập giáo viên đã giao cho lớp IF-2609. Lưu nháp, nộp bài và kết quả chấm được đồng bộ với giáo viên." />
    {error ? <Text size="sm" c="red" mb="sm">{error}</Text> : null}{notice ? <Text size="sm" c="teal" mb="sm">{notice}</Text> : null}
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm bài tập" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm bài tập..." style={{ minWidth: 280 }} /><UiSelect aria-label="Lọc trạng thái bài tập" w={190} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, { value: "not_started", label: "Chưa làm" }, { value: "draft", label: "Bản nháp" }, { value: "submitted", label: "Đã nộp" }, { value: "graded", label: "Đã công bố điểm" }, { value: "overdue", label: "Quá hạn" }]} /><UiButton variant="default" onClick={() => router.push("/student/classes/if-2609")} leftSection={<FileText size={16} />}>Học liệu</UiButton><UiButton variant="default" onClick={() => void reload()} loading={loading}>Tải lại</UiButton></PageToolbar>
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md"><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Bài được giao</Text><Text fz={24} fw={700}>{rows.length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Cần hoàn tất</Text><Text fz={24} fw={700}>{rows.filter((item) => item.status === "not_started" || item.status === "draft").length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Đang chờ chấm</Text><Text fz={24} fw={700}>{rows.filter((item) => item.status === "submitted").length}</Text></Paper></SimpleGrid>
    <UiDataTable table={table} columnCount={columns.length} minWidth={980} emptyTitle={loading ? "Đang tải bài tập..." : "Không có bài tập phù hợp."} />
    <Text size="xs" c="dimmed" mt="sm">Chỉ hiển thị bài tập giáo viên đã giao cho lớp của bạn. Điểm và nhận xét chỉ hiện sau khi được công bố.</Text>
    <UiModal opened={selected !== null} onClose={() => setSelected(null)} title={selected?.title ?? "Bài tập"} size="lg">{selected ? <Stack gap="sm"><Group justify="space-between"><UiStatusBadge role={statusRole[selected.status]}>{statusLabel[selected.status]}</UiStatusBadge><Text size="sm" c="dimmed">Hạn nộp: {dueAt(selected.dueAt)}</Text></Group><Text size="sm">{selected.instructions}</Text>{selected.rubric ? <Text size="sm" c="dimmed">Tiêu chí: {selected.rubric}</Text> : null}{selected.attachmentName ? <Text size="sm" c="dimmed">Tệp đính kèm: {selected.attachmentName}</Text> : null}<Textarea label={readOnly ? "Bài đã nộp" : "Bài làm"} value={answer} onChange={(event) => setAnswer(event.currentTarget.value)} readOnly={readOnly} minRows={7} placeholder="Nhập bài làm của bạn..." />{published ? <Paper className="panelHighlight" p="sm"><Text fw={600}>Kết quả đã công bố: {selected.submission?.score}/{selected.maxScore}</Text><Text size="sm" c="dimmed">{selected.submission?.feedback || "Giáo viên chưa để lại nhận xét."}</Text></Paper> : selected.status === "submitted" ? <Text size="sm" c="dimmed">Bài đã được ghi nhận và đang chờ giáo viên chấm.</Text> : null}<Group justify="flex-end"><UiButton variant="default" onClick={() => setSelected(null)}>Đóng</UiButton>{!readOnly ? <><UiButton variant="default" loading={saving === "draft"} disabled={!answer.trim() || saving !== null} onClick={() => void save("draft")}>Lưu nháp</UiButton><UiButton leftSection={<Send size={16} />} loading={saving === "submitted"} disabled={!answer.trim() || saving !== null} onClick={() => void save("submitted")}>Nộp bài</UiButton></> : null}</Group></Stack> : null}</UiModal>
  </div>;
}
