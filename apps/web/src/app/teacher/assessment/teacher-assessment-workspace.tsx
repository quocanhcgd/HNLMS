"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, NumberInput, Paper, SimpleGrid, Stack, Text, Textarea } from "@mantine/core";
import { ClipboardCheck, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ReviewStatus = "submitted" | "grading" | "published" | "needs_revision";
type TeacherAssessmentResult = {
  student: string;
  assessment: string;
  submittedAt: string;
  status: ReviewStatus;
  rawScore: string;
  recommendation: string;
};

const statusLabel: Record<ReviewStatus, string> = {
  submitted: "Chờ chấm",
  grading: "Đang chấm",
  published: "Đã công bố",
  needs_revision: "Cần rà soát",
};
const statusRole: Record<ReviewStatus, "neutral" | "warning" | "success" | "danger"> = {
  submitted: "neutral",
  grading: "warning",
  published: "success",
  needs_revision: "danger",
};

const rows: TeacherAssessmentResult[] = [
  {
    student: "Nguyễn Minh Anh",
    assessment: "Kiểm tra đầu vào IELTS Foundation",
    submittedAt: "22/08/2026 10:15",
    status: "grading",
    rawScore: "14/20",
    recommendation: "Đề xuất IELTS Foundation A2+",
  },
  {
    student: "Trần Gia Huy",
    assessment: "Speaking placement",
    submittedAt: "22/08/2026 09:40",
    status: "submitted",
    rawScore: "Chưa chấm",
    recommendation: "Chờ rubric speaking",
  },
  {
    student: "Lê Phương Linh",
    assessment: "Mock test Reading A2",
    submittedAt: "21/08/2026 20:05",
    status: "published",
    rawScore: "17/20",
    recommendation: "Đề xuất lớp B1 Bridge",
  },
];

export function TeacherAssessmentWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [score, setScore] = useState<number | string>(14);
  const [rubric, setRubric] = useState("Listening tốt, cần cải thiện tốc độ đọc và ghi chú ý chính.");

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [query, status],
  );

  const columns = useMemo<ColumnDef<TeacherAssessmentResult>[]>(
    () => [
      {
        accessorKey: "student",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.student}</Text>
            <Text size="xs" c="dimmed">
              {row.original.assessment}
            </Text>
          </div>
        ),
      },
      { accessorKey: "submittedAt", header: "Nộp lúc" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ReviewStatus>();
          return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>;
        },
      },
      { accessorKey: "rawScore", header: "Điểm" },
      { accessorKey: "recommendation", header: "Khuyến nghị" },
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
        title="Chấm bài & đề thi"
        subtitle="Giảng viên chấm bài tự luận/nói, xem kết quả và đề xuất xếp lớp cho học viên."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm bài nộp"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, bài kiểm tra, khuyến nghị..."
          style={{ minWidth: 300 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái chấm bài"
          w={190}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "submitted", label: "Chờ chấm" },
            { value: "grading", label: "Đang chấm" },
            { value: "published", label: "Đã công bố" },
            { value: "needs_revision", label: "Cần rà soát" },
          ]}
        />
      </PageToolbar>
      <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md">
        <Stack>
          <UiDataTable
            table={table}
            columnCount={columns.length}
            minWidth={980}
            emptyTitle="Không tìm thấy bài nộp phù hợp."
          />
          <Text size="xs" c="dimmed">
            {table.getRowModel().rows.length}/{rows.length} bài nộp · dùng cùng chuẩn TanStack Table
          </Text>
        </Stack>
        <Paper className="panel" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700}>Phiếu chấm nhanh</Text>
              <Text size="sm" c="dimmed">
                Điểm và nhận xét chỉ được công bố khi chính sách cho phép.
              </Text>
            </div>
            <ClipboardCheck size={22} />
          </Group>
          <Stack>
            <NumberInput label="Điểm thô" min={0} max={20} value={score} onChange={setScore} />
            <Textarea
              label="Nhận xét theo rubric"
              minRows={6}
              value={rubric}
              onChange={(event) => setRubric(event.currentTarget.value)}
            />
            <UiSelect
              label="Khuyến nghị xếp lớp"
              defaultValue="foundation-a2"
              data={[
                { value: "foundation-a2", label: "IELTS Foundation A2+" },
                { value: "b1-bridge", label: "B1 Bridge" },
                { value: "repeat-practice", label: "Luyện thêm trước khi xếp lớp" },
              ]}
            />
            <Group justify="flex-end">
              <UiButton variant="default">Lưu nháp</UiButton>
              <UiButton leftSection={<Send size={16} />}>Công bố kết quả</UiButton>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>
    </div>
  );
}
