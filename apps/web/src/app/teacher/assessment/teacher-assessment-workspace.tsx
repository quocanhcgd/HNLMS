"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Group, NumberInput, Paper, Stack, Text, Textarea } from "@mantine/core";
import { CheckCircle2, Info, Search, Send, UserRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

export type AssessmentMode = "entrance" | "mock";
type ReviewStatus = "submitted" | "grading" | "published" | "needs_revision";
type AssessmentRow = { id: string; student: string; assessment: string; submittedAt: string; status: ReviewStatus; rawScore: string; recommendation: string; context: string; source: string; detail: string; skills: string };
const statusLabel: Record<ReviewStatus, string> = { submitted: "Chờ chấm", grading: "Đang chấm", published: "Đã công bố", needs_revision: "Cần rà soát" };
const statusRole: Record<ReviewStatus, "neutral" | "warning" | "success" | "danger"> = { submitted: "neutral", grading: "warning", published: "success", needs_revision: "danger" };

const entranceRows: AssessmentRow[] = [
  { id: "entrance-1", student: "Nguyễn Minh Anh", assessment: "Kiểm tra đầu vào IELTS Foundation", submittedAt: "22/08/2026 10:15", status: "grading", rawScore: "14/20", recommendation: "Đề xuất IELTS Foundation A2+", context: "Lead LD-26081 · nhu cầu IELTS", source: "Lan Phương · Tư vấn", detail: "Tư vấn chuyển bài để giáo viên đánh giá kỹ năng nghe/nói và đề xuất lớp phù hợp.", skills: "Listening 8/10 · Reading 6/10 · Speaking chờ chấm" },
  { id: "entrance-2", student: "Trần Gia Huy", assessment: "Speaking placement", submittedAt: "22/08/2026 09:40", status: "submitted", rawScore: "Chưa chấm", recommendation: "Chờ rubric speaking", context: "Lead LD-26079 · chuyển từ landing", source: "Minh Châu · Tư vấn", detail: "Cần chấm bản ghi nói trước khi tư vấn xác nhận lịch học thử.", skills: "Speaking · bản ghi 02:14 · chờ nhận xét" },
  { id: "entrance-3", student: "Phạm Khánh Linh", assessment: "Kiểm tra đầu vào TOEIC", submittedAt: "21/08/2026 16:20", status: "needs_revision", rawScore: "18/30", recommendation: "Cần rà soát level", context: "Lead LD-26070 · TOEIC 700+", source: "Quốc Huy · Tư vấn", detail: "Điểm tổng đã có nhưng cần giáo viên rà soát chênh lệch giữa Reading và Listening.", skills: "Listening 5/15 · Reading 13/15" },
];
const mockRows: AssessmentRow[] = [
  { id: "mock-1", student: "Lê Phương Linh", assessment: "Mock test Reading A2", submittedAt: "21/08/2026 20:05", status: "published", rawScore: "17/20", recommendation: "Đề xuất lớp B1 Bridge", context: "Lần thi 1/2 · Reading", source: "Học viên tự đăng ký", detail: "Kết quả đã công bố cho học viên; có thể xem lại phân tích theo chủ đề.", skills: "Main idea 9/10 · Detail 8/10" },
  { id: "mock-2", student: "Vũ Đức Nam", assessment: "Mock test IELTS Speaking", submittedAt: "22/08/2026 08:30", status: "submitted", rawScore: "Chưa chấm", recommendation: "Chờ chấm speaking", context: "Lần thi 2/2 · Speaking", source: "Học viên tự đăng ký", detail: "Bản ghi nói đã sẵn sàng; cần đánh giá fluency, vocabulary, grammar và pronunciation.", skills: "Speaking · bản ghi 08:42 · chờ rubric" },
  { id: "mock-3", student: "Đỗ Mai Chi", assessment: "Mock test TOEIC Reading", submittedAt: "20/08/2026 19:10", status: "grading", rawScore: "32/50", recommendation: "Cần chấm câu tự luận", context: "Lần thi 1/3 · Reading", source: "Học viên tự đăng ký", detail: "Trắc nghiệm đã chấm tự động; còn 4 câu trả lời ngắn cần giáo viên rà soát.", skills: "Vocabulary 16/25 · Inference 16/25" },
];

export function TeacherAssessmentWorkspace({ mode }: { mode: AssessmentMode }) {
  const isEntrance = mode === "entrance";
  const rows = isEntrance ? entranceRows : mockRows;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<AssessmentRow | null>(null);
  const [score, setScore] = useState<number | string>(isEntrance ? 14 : 17);
  const [rubric, setRubric] = useState(isEntrance ? "Listening tốt, cần cải thiện tốc độ đọc và ghi chú ý chính." : "Đã nhận diện được ý chính; cần bổ sung bằng chứng trong câu trả lời.");
  const [recommendation, setRecommendation] = useState(isEntrance ? "foundation-a2" : "b1-bridge");
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => rows.filter((item) => JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase()) && (status === "all" || !status || item.status === status)), [query, rows, status]);
  const columns = useMemo<ColumnDef<AssessmentRow>[]>(() => [
    { accessorKey: "student", header: "Học viên", cell: ({ row }) => <div><Text fw={600}>{row.original.student}</Text><Text size="xs" c="dimmed">{row.original.assessment}</Text></div> },
    { accessorKey: "context", header: isEntrance ? "Nguồn chuyển" : "Lần thi / kỹ năng", cell: ({ row }) => <div><Text size="sm">{isEntrance ? row.original.source : row.original.context}</Text><Text size="xs" c="dimmed">{isEntrance ? row.original.context : row.original.source}</Text></div> },
    { accessorKey: "submittedAt", header: "Nộp lúc" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<ReviewStatus>(); return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>; } },
    { accessorKey: "rawScore", header: "Điểm" },
    { accessorKey: "recommendation", header: isEntrance ? "Khuyến nghị xếp lớp" : "Khuyến nghị" },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant={row.original.status === "published" ? "default" : "filled"} onClick={() => openReview(row.original)}>{row.original.status === "submitted" ? "Chấm bài" : row.original.status === "grading" ? "Tiếp tục chấm" : row.original.status === "needs_revision" ? "Rà soát" : "Xem kết quả"}</UiButton> },
  ], [isEntrance]);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const openReview = (item: AssessmentRow) => { setSelected(item); setScore(item.rawScore.includes("/") ? Number(item.rawScore.split("/")[0]) : isEntrance ? 14 : 17); };
  const saveReview = (publish: boolean) => { if (!selected) return; setNotice(`${publish ? "Đã công bố" : "Đã lưu bản nháp"} kết quả ${isEntrance ? "đầu vào" : "thi thử"} cho ${selected.student}.`); setSelected(null); };

  return <div className="page teacherWorkspace">
    <PageHeader title={isEntrance ? "Chấm bài kiểm tra đầu vào" : "Chấm bài thi thử"} subtitle={isEntrance ? "Tiếp nhận bài do bộ phận tư vấn chuyển đến, chấm kỹ năng và đề xuất lớp cho học viên mới." : "Chấm các lần thi thử của học viên, rà soát câu tự luận/nói và công bố kết quả theo chính sách."} />
    <div className="assessmentModeBanner"><Group justify="space-between" align="flex-start" wrap="wrap"><Group gap="sm" wrap="nowrap"><div className="assessmentModeIcon"><UserRound size={19} /></div><div><Text fw={700}>{isEntrance ? "Luồng tư vấn → giáo viên → xếp lớp" : "Luồng học viên → giáo viên → công bố kết quả"}</Text><Text size="sm" c="dimmed">{isEntrance ? "Chỉ hiển thị hồ sơ được tư vấn phân công trong phạm vi của giáo viên." : "Bài thi thử không tạo lead; kết quả được trả về hồ sơ học tập của học viên."}</Text></div></Group><UiStatusBadge role="info">{rows.length} bài cần theo dõi</UiStatusBadge></Group></div>
    {notice ? <Alert icon={<CheckCircle2 size={16} />} color="teal" mb="md">{notice}</Alert> : null}
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm bài nộp" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder={isEntrance ? "Tìm học viên, lead, tư vấn viên..." : "Tìm học viên, đề thi, kỹ năng..."} style={{ minWidth: 300 }} /><UiSelect aria-label="Lọc trạng thái chấm bài" w={190} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, { value: "submitted", label: "Chờ chấm" }, { value: "grading", label: "Đang chấm" }, { value: "published", label: "Đã công bố" }, { value: "needs_revision", label: "Cần rà soát" }]} /></PageToolbar>
    <Paper className="panel" p="md" withBorder><Group justify="space-between" mb="md"><div><Text fw={700}>{isEntrance ? "Bài đầu vào được chuyển đến" : "Các lần thi thử cần chấm"}</Text><Text size="sm" c="dimmed">{table.getRowModel().rows.length}/{rows.length} bài trong phạm vi của bạn</Text></div><UiStatusBadge role={rows.some((item) => item.status !== "published") ? "warning" : "success"}>{rows.filter((item) => item.status !== "published").length} cần xử lý</UiStatusBadge></Group><UiDataTable table={table} columnCount={columns.length} minWidth={isEntrance ? 1220 : 1180} emptyTitle="Không tìm thấy bài nộp phù hợp." /><Text size="xs" c="dimmed" mt="sm">Dùng cột Thao tác để chấm, tiếp tục chấm, rà soát hoặc xem kết quả từng bài.</Text></Paper>
    <UiModal opened={selected !== null} onClose={() => setSelected(null)} title={selected ? `Phiếu chấm · ${selected.student}` : "Phiếu chấm"} size="lg">{selected ? <Stack><Group justify="space-between" align="flex-start"><div><Text fw={700}>{selected.assessment}</Text><Text size="sm" c="dimmed">{selected.context} · nộp {selected.submittedAt}</Text></div><UiStatusBadge role={statusRole[selected.status]}>{statusLabel[selected.status]}</UiStatusBadge></Group><Paper className="classInfoCallout" p="md"><Group gap="xs"><Info size={16} /><Text size="sm">{selected.detail}</Text></Group><Text size="xs" c="dimmed" mt="xs">{selected.skills}</Text></Paper><Group grow><NumberInput label={isEntrance ? "Điểm đánh giá" : "Điểm thi thử"} min={0} max={isEntrance ? 30 : 50} value={score} onChange={setScore} /><UiSelect label={isEntrance ? "Đề xuất xếp lớp" : "Mức khuyến nghị"} value={recommendation} onChange={(value) => setRecommendation(value ?? recommendation)} data={isEntrance ? [{ value: "foundation-a2", label: "IELTS Foundation A2+" }, { value: "b1-bridge", label: "B1 Bridge" }, { value: "needs-counseling", label: "Cần tư vấn thêm" }] : [{ value: "b1-bridge", label: "Có thể vào B1 Bridge" }, { value: "continue-practice", label: "Luyện thêm trước khi thi lại" }, { value: "needs-review", label: "Cần rà soát thủ công" }]} /></Group><Textarea label={isEntrance ? "Nhận xét gửi về bộ phận tư vấn" : "Nhận xét gửi cho học viên"} minRows={5} value={rubric} onChange={(event) => setRubric(event.currentTarget.value)} /><Group justify="flex-end"><UiButton variant="default" onClick={() => saveReview(false)}>Lưu bản nháp</UiButton><UiButton leftSection={<Send size={16} />} onClick={() => saveReview(true)}>Công bố kết quả</UiButton></Group></Stack> : null}</UiModal>
  </div>;
}
