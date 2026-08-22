"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea } from "@mantine/core";
import { BookOpenCheck, FileText, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ContentStatus = "draft" | "in_review" | "published";
type TeacherContent = {
  title: string;
  type: string;
  scope: string;
  version: number;
  duration: string;
  updatedAt: string;
  status: ContentStatus;
};

const statusLabel: Record<ContentStatus, string> = {
  draft: "Bản nháp",
  in_review: "Đang duyệt",
  published: "Đã công bố",
};
const statusRole: Record<ContentStatus, "neutral" | "warning" | "success"> = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
};

const contents: TeacherContent[] = [
  {
    title: "IELTS Listening · Warm-up",
    type: "Bài giảng",
    scope: "Lớp IF-2609",
    version: 3,
    duration: "35 phút",
    updatedAt: "22/08/2026",
    status: "published",
  },
  {
    title: "Grammar for Writing Task 1",
    type: "Tài liệu",
    scope: "Khóa IELTS Foundation",
    version: 1,
    duration: "20 phút",
    updatedAt: "21/08/2026",
    status: "in_review",
  },
  {
    title: "Speaking practice prompts",
    type: "Bài tập",
    scope: "Lớp IA-2610",
    version: 2,
    duration: "15 phút",
    updatedAt: "20/08/2026",
    status: "draft",
  },
];

export function TeacherContentWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [draftTitle, setDraftTitle] = useState("Bài học mới");
  const [draftBody, setDraftBody] = useState("Mục tiêu bài học, nội dung chính và tài nguyên đính kèm...");

  const columns = useMemo<ColumnDef<TeacherContent>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Học liệu",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {row.original.type} · v{row.original.version}
            </Text>
          </div>
        ),
      },
      { accessorKey: "scope", header: "Phạm vi" },
      { accessorKey: "duration", header: "Thời lượng" },
      { accessorKey: "updatedAt", header: "Cập nhật" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ContentStatus>();
          return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>;
        },
      },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      contents.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [query, status],
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
        title="Soạn học liệu"
        subtitle="Giảng viên tạo bài giảng, bài tập, gửi duyệt và quản lý phiên bản học liệu được giao."
        action="Tạo học liệu"
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học liệu, lớp, loại nội dung..."
          style={{ minWidth: 280 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái học liệu"
          w={180}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "draft", label: "Bản nháp" },
            { value: "in_review", label: "Đang duyệt" },
            { value: "published", label: "Đã công bố" },
          ]}
        />
      </PageToolbar>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Stack>
          <UiDataTable
            table={table}
            columnCount={columns.length}
            minWidth={820}
            emptyTitle="Không tìm thấy học liệu."
          />
          <Text size="xs" c="dimmed">
            {table.getRowModel().rows.length}/{contents.length} học liệu · dùng cùng chuẩn TanStack Table
          </Text>
        </Stack>
        <Paper className="panel" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700}>Bản nháp đang soạn</Text>
              <Text size="sm" c="dimmed">
                Lưu nháp trước khi gửi duyệt để công bố cho học viên.
              </Text>
            </div>
            <BookOpenCheck size={22} />
          </Group>
          <Stack>
            <UiTextInput
              label="Tiêu đề"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.currentTarget.value)}
            />
            <Textarea
              label="Nội dung bài học"
              minRows={8}
              value={draftBody}
              onChange={(event) => setDraftBody(event.currentTarget.value)}
            />
            <Group justify="flex-end">
              <UiButton variant="default" leftSection={<FileText size={16} />}>
                Lưu nháp
              </UiButton>
              <UiButton leftSection={<Send size={16} />}>Gửi duyệt</UiButton>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>
    </div>
  );
}
