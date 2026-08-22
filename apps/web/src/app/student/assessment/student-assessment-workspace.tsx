"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, Progress, Radio, SimpleGrid, Stack, Text } from "@mantine/core";
import { CheckCircle2, Clock, PlayCircle, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

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

export function StudentAssessmentWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [answer, setAnswer] = useState("B");

  const filtered = useMemo(
    () =>
      assessments.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [query, status],
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
              <UiStatusBadge role="warning">32:18</UiStatusBadge>
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
              <UiButton variant="default" leftSection={<CheckCircle2 size={16} />}>
                Lưu tự động
              </UiButton>
              <UiButton leftSection={<Send size={16} />}>Nộp bài</UiButton>
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
    </div>
  );
}
