"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, Progress, Radio, SimpleGrid, Stack, Text } from "@mantine/core";
import { CheckCircle2, Clock, PlayCircle, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type AssessmentStatus = "available" | "in_progress" | "submitted" | "published";
type StudentAssessment = {
  title: string;
  kind: string;
  duration: string;
  window: string;
  status: AssessmentStatus;
  score: string;
  recommendation: string;
};

const statusLabel: Record<AssessmentStatus, string> = {
  available: "Có thể làm",
  in_progress: "Đang làm",
  submitted: "Đã nộp",
  published: "Đã có kết quả",
};
const statusRole: Record<AssessmentStatus, "info" | "warning" | "neutral" | "success"> = {
  available: "info",
  in_progress: "warning",
  submitted: "neutral",
  published: "success",
};

const assessments: StudentAssessment[] = [
  {
    title: "Kiểm tra đầu vào IELTS Foundation",
    kind: "Entrance",
    duration: "45 phút",
    window: "22/08 - 30/08/2026",
    status: "in_progress",
    score: "Chưa chấm",
    recommendation: "Đang làm bài",
  },
  {
    title: "Mock test Reading A2",
    kind: "Mock",
    duration: "30 phút",
    window: "20/08 - 27/08/2026",
    status: "published",
    score: "16/20",
    recommendation: "Đề xuất lớp IELTS Foundation A2+",
  },
  {
    title: "Practice Listening Unit 3",
    kind: "Practice",
    duration: "20 phút",
    window: "Không giới hạn",
    status: "available",
    score: "-",
    recommendation: "Luyện thêm kỹ năng nghe",
  },
];

const DRAFT_STORAGE_KEY = "hnlms.student.assessment.entrance.draft";
const INITIAL_REMAINING_SECONDS = 32 * 60 + 18;

const formatRemaining = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, "0")}:${(safeSeconds % 60).toString().padStart(2, "0")}`;
};

export function StudentAssessmentWorkspace() {
  const [assessmentItems, setAssessmentItems] = useState(assessments);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [answer, setAnswer] = useState("B");
  const [submitOpened, setSubmitOpened] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<StudentAssessment | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_REMAINING_SECONDS);
  const [hydrated, setHydrated] = useState(false);
  const endAtRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { answer?: string; endAt?: number; submitted?: boolean };
        if (draft.answer === "A" || draft.answer === "B" || draft.answer === "C") setAnswer(draft.answer);
        if (draft.submitted) {
          setSubmitted(true);
          setAssessmentItems((items) => items.map((item) => item.kind === "Entrance" ? { ...item, status: "submitted", score: "Chờ chấm", recommendation: "Đã nộp, chờ giáo viên chấm" } : item));
        } else if (draft.endAt) {
          endAtRef.current = draft.endAt;
          setRemainingSeconds(Math.max(0, Math.ceil((draft.endAt - Date.now()) / 1000)));
        }
      }
    } catch {
      // Ignore an invalid local draft and start a fresh attempt.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || submitted) return;
    if (endAtRef.current === null) endAtRef.current = Date.now() + remainingSeconds * 1000;
    const timer = window.setInterval(() => {
      const next = Math.max(0, Math.ceil(((endAtRef.current ?? Date.now()) - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) {
        setSubmitted(true);
        setAssessmentItems((items) => items.map((item) => item.kind === "Entrance" ? { ...item, status: "submitted", score: "Chờ chấm", recommendation: "Đã tự nộp khi hết giờ" } : item));
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answer, submitted: true }));
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [answer, hydrated, submitted]);

  useEffect(() => {
    if (!hydrated || submitted) return;
    if (endAtRef.current === null) endAtRef.current = Date.now() + remainingSeconds * 1000;
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answer, endAt: endAtRef.current, submitted: false }));
  }, [answer, hydrated, remainingSeconds, submitted]);

  const filtered = useMemo(
    () =>
      assessmentItems.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [assessmentItems, query, status],
  );

  const columns = useMemo<ColumnDef<StudentAssessment>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Bài kiểm tra",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {row.original.kind} · {row.original.duration}
            </Text>
          </div>
        ),
      },
      { accessorKey: "window", header: "Thời gian mở" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<AssessmentStatus>();
          return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>;
        },
      },
      { accessorKey: "score", header: "Điểm" },
      { accessorKey: "recommendation", header: "Khuyến nghị" },
      { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant="default" onClick={() => { if (row.original.status === "available") setAssessmentItems((items) => items.map((item) => item.title === row.original.title ? { ...item, status: "in_progress" } : item)); setSelectedAssessment({ ...row.original, status: row.original.status === "available" ? "in_progress" : row.original.status }); }}>{row.original.status === "published" ? "Xem kết quả" : row.original.status === "available" ? "Bắt đầu" : "Mở bài"}</UiButton> },
    ],
    [],
  );

  const table = useReactTable({
    data: filtered,
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
        title="Bài kiểm tra"
        subtitle="Học viên làm bài, lưu tự động, nộp bài và xem kết quả xếp lớp khi được công bố."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm bài kiểm tra"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm bài kiểm tra, khuyến nghị..."
          style={{ minWidth: 280 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái bài kiểm tra"
          w={190}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "available", label: "Có thể làm" },
            { value: "in_progress", label: "Đang làm" },
            { value: "submitted", label: "Đã nộp" },
            { value: "published", label: "Đã có kết quả" },
          ]}
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={960}
        emptyTitle="Không tìm thấy bài kiểm tra phù hợp."
      />
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mt="md">
        <Paper className="panel" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700}>Bài đang làm</Text>
              <Text size="sm" c="dimmed">
                Tự động lưu câu trả lời; hệ thống sẽ tự nộp khi hết giờ.
              </Text>
            </div>
            <Clock size={22} />
          </Group>
          <Stack>
            <Group justify="space-between">
              <Text size="sm">Thời gian còn lại</Text>
              <UiStatusBadge role={remainingSeconds <= 300 ? "danger" : "warning"}>{formatRemaining(remainingSeconds)}</UiStatusBadge>
            </Group>
            <Progress value={28} aria-label="Tiến độ làm bài" />
            <Text fw={600}>Câu 3/20 · Listening</Text>
            <Text size="sm">Người nói đang mô tả mục tiêu chính của buổi học là gì?</Text>
            <Radio.Group value={answer} onChange={setAnswer} aria-label="Chọn đáp án">
              <Stack gap="xs" mt="xs">
                <Radio value="A" label="Ôn lại từ vựng cũ" />
                <Radio value="B" label="Luyện nghe lấy ý chính" />
                <Radio value="C" label="Chuẩn bị bài thuyết trình" />
              </Stack>
            </Radio.Group>
            <Group justify="space-between">
              <UiButton variant="default" leftSection={<CheckCircle2 size={16} />} onClick={() => { setSaved(true); if (endAtRef.current === null) endAtRef.current = Date.now() + remainingSeconds * 1000; window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answer, endAt: endAtRef.current, submitted: false })); }}>
                {saved ? "Đã lưu" : "Lưu tự động"}
              </UiButton>
              <UiButton disabled={submitted} leftSection={<Send size={16} />} onClick={() => setSubmitOpened(true)}>{submitted ? "Đã nộp" : "Nộp bài"}</UiButton>
            </Group>
          </Stack>
        </Paper>
        <Paper className="panel" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700}>Kết quả & khuyến nghị</Text>
              <Text size="sm" c="dimmed">
                Chỉ hiển thị khi kết quả đã được công bố theo chính sách.
              </Text>
            </div>
            <PlayCircle size={22} />
          </Group>
          <Stack gap="sm">
            <Group justify="space-between">
              <Text>Reading</Text>
              <UiStatusBadge role="success">8/10</UiStatusBadge>
            </Group>
            <Group justify="space-between">
              <Text>Listening</Text>
              <UiStatusBadge role="info">8/10</UiStatusBadge>
            </Group>
            <Text fw={700}>Đề xuất: IELTS Foundation A2+</Text>
            <Text size="sm" c="dimmed">
              Học viên nên luyện thêm listening note-taking trước khi vào lớp chính thức.
            </Text>
          </Stack>
        </Paper>
      </SimpleGrid>
      <UiModal opened={submitOpened} onClose={() => setSubmitOpened(false)} title="Xác nhận nộp bài">
        <Stack gap="sm">
          <Text size="sm">Sau khi nộp, bạn không thể sửa câu trả lời của bài kiểm tra này.</Text>
          <Text size="sm" c="dimmed">Câu trả lời hiện tại: {answer}. Hệ thống sẽ lưu kết quả để giáo viên chấm.</Text>
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setSubmitOpened(false)}>Tiếp tục làm</UiButton>
            <UiButton onClick={() => { setSubmitted(true); setAssessmentItems((items) => items.map((item) => item.kind === "Entrance" ? { ...item, status: "submitted", score: "Chờ chấm", recommendation: "Đã nộp, chờ giáo viên chấm" } : item)); window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ answer, submitted: true })); setSubmitOpened(false); }}>Xác nhận nộp</UiButton>
          </Group>
        </Stack>
      </UiModal>
      <UiModal opened={selectedAssessment !== null} onClose={() => setSelectedAssessment(null)} title={selectedAssessment ? selectedAssessment.title : "Bài kiểm tra"}>
        {selectedAssessment ? <Stack gap="sm"><Text size="sm">{selectedAssessment.kind} · {selectedAssessment.duration} · {selectedAssessment.window}</Text><UiStatusBadge role={statusRole[selectedAssessment.status]}>{statusLabel[selectedAssessment.status]}</UiStatusBadge><Text size="sm">{selectedAssessment.status === "published" ? `Điểm: ${selectedAssessment.score}. ${selectedAssessment.recommendation}` : selectedAssessment.recommendation}</Text><Group justify="flex-end"><UiButton onClick={() => setSelectedAssessment(null)}>Đóng</UiButton></Group></Stack> : null}
      </UiModal>
    </div>
  );
}
