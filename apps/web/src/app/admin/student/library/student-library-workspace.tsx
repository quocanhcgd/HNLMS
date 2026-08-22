"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Bookmark, BookmarkCheck, FileText, PlayCircle, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ResourceKind = "document" | "video" | "audio" | "slide";
type LibraryResource = {
  title: string;
  kind: ResourceKind;
  category: string;
  subject: string;
  scope: string;
  duration: string;
  saved: boolean;
};

const kindLabel: Record<ResourceKind, string> = {
  document: "Tài liệu",
  video: "Video",
  audio: "Audio",
  slide: "Slide",
};

const resources: LibraryResource[] = [
  {
    title: "IELTS Grammar Pack",
    kind: "document",
    category: "IELTS",
    subject: "Grammar",
    scope: "Khóa IELTS Foundation",
    duration: "20 phút",
    saved: true,
  },
  {
    title: "Speaking warm-up video",
    kind: "video",
    category: "Speaking",
    subject: "Fluency",
    scope: "Lớp IA-2610",
    duration: "12 phút",
    saved: false,
  },
  {
    title: "Listening practice audio",
    kind: "audio",
    category: "Listening",
    subject: "IELTS Part 2",
    scope: "Lớp IF-2609",
    duration: "18 phút",
    saved: true,
  },
];

export function StudentLibraryWorkspace() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>("all");
  const [saved, setSaved] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState(resources[0]);

  const columns = useMemo<ColumnDef<LibraryResource>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tài nguyên",
        cell: ({ row }) => (
          <button className="tableLinkButton" type="button" onClick={() => setSelected(row.original)}>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {kindLabel[row.original.kind]} · {row.original.duration}
            </Text>
          </button>
        ),
      },
      { accessorKey: "category", header: "Danh mục" },
      { accessorKey: "subject", header: "Chủ đề" },
      { accessorKey: "scope", header: "Phạm vi" },
      {
        accessorKey: "saved",
        header: "Đã lưu",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <UiStatusBadge role="success">Đã lưu</UiStatusBadge>
          ) : (
            <UiStatusBadge role="neutral">Chưa lưu</UiStatusBadge>
          ),
      },
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      resources.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "all" || !category || item.category === category;
        const matchesSaved = saved === "all" || !saved || (saved === "saved" ? item.saved : !item.saved);
        return matchesQuery && matchesCategory && matchesSaved;
      }),
    [category, query, saved],
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
        title="Thư viện học tập"
        subtitle="Học viên tìm kiếm, lưu và mở học liệu được cấp quyền theo lớp hoặc khóa học."
        action="Tiếp tục học"
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm tài liệu, chủ đề, lớp học..."
          style={{ minWidth: 280 }}
        />
        <UiSelect
          aria-label="Lọc danh mục"
          w={170}
          value={category}
          onChange={setCategory}
          data={[{ value: "all", label: "Tất cả danh mục" }, "IELTS", "Speaking", "Listening"]}
        />
        <UiSelect
          aria-label="Lọc tài nguyên đã lưu"
          w={160}
          value={saved}
          onChange={setSaved}
          data={[
            { value: "all", label: "Tất cả" },
            { value: "saved", label: "Đã lưu" },
            { value: "unsaved", label: "Chưa lưu" },
          ]}
        />
      </PageToolbar>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Stack>
          <UiDataTable
            table={table}
            columnCount={columns.length}
            minWidth={860}
            emptyTitle="Không tìm thấy tài nguyên."
          />
          <Text size="xs" c="dimmed">
            {table.getRowModel().rows.length}/{resources.length} tài nguyên · tìm kiếm, lọc danh mục và trạng thái lưu
          </Text>
        </Stack>
        <Paper className="panel" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <div>
              <Text fw={700}>{selected.title}</Text>
              <Text size="sm" c="dimmed">
                {kindLabel[selected.kind]} · {selected.category} · {selected.subject}
              </Text>
            </div>
            {selected.saved ? <BookmarkCheck size={22} /> : <Bookmark size={22} />}
          </Group>
          <Paper className="panelHighlight" p="xl" mb="md">
            <Group>
              {selected.kind === "video" ? <PlayCircle size={28} /> : <FileText size={28} />}
              <div>
                <Text fw={650}>Player / viewer mẫu</Text>
                <Text size="sm" c="dimmed">
                  Signed URL sẽ được cấp từ backend khi người dùng mở tài nguyên đã publish.
                </Text>
              </div>
            </Group>
          </Paper>
          <Stack gap="xs">
            <Text size="sm">Phạm vi truy cập: {selected.scope}</Text>
            <Text size="sm">Thời lượng gợi ý: {selected.duration}</Text>
            <Group justify="flex-end">
              <UiButton variant="default" leftSection={<Bookmark size={16} />}>
                {selected.saved ? "Bỏ lưu" : "Lưu tài nguyên"}
              </UiButton>
              <UiButton leftSection={<PlayCircle size={16} />}>Mở học liệu</UiButton>
            </Group>
          </Stack>
        </Paper>
      </SimpleGrid>
    </div>
  );
}
