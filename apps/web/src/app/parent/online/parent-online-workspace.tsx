"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { CalendarClock, Search, Video } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type OnlineRow = {
  id: string;
  child: string;
  className: string;
  title: string;
  time: string;
  attendance: string;
  recording: string;
  status: "Sắp diễn ra" | "Đang live" | "Đã kết thúc";
};
const rows: OnlineRow[] = [
  {
    id: "online-1",
    child: "Nguyễn Minh Anh",
    className: "IF-2609",
    title: "Unit 5 · Listening clinic",
    time: "Hôm nay 18:00-19:30",
    attendance: "Chưa tham dự",
    recording: "-",
    status: "Sắp diễn ra",
  },
  {
    id: "online-2",
    child: "Trần Gia Huy",
    className: "TOEIC-2609",
    title: "Mini test review",
    time: "Hôm qua 19:45",
    attendance: "Có tham dự",
    recording: "Sẵn sàng",
    status: "Đã kết thúc",
  },
];
const role = { "Sắp diễn ra": "info", "Đang live": "success", "Đã kết thúc": "neutral" } as const;

export function ParentOnlineWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<OnlineRow | null>(null);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === "all" || !status || row.status === status) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
  );
  const columns = useMemo<ColumnDef<OnlineRow>[]>(
    () => [
      {
        accessorKey: "child",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.child}</Text>
            <Text size="xs" c="dimmed">
              {row.original.className} · {row.original.title}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "time",
        header: "Thời gian",
        cell: ({ getValue }) => (
          <Group gap="xs">
            <CalendarClock size={15} />
            <Text size="sm">{getValue<string>()}</Text>
          </Group>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<OnlineRow["status"]>();
          return <UiStatusBadge role={role[value]}>{value}</UiStatusBadge>;
        },
      },
      { accessorKey: "attendance", header: "Điểm danh" },
      { accessorKey: "recording", header: "Bản ghi" },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton size="compact-xs" variant="default" onClick={() => setSelected(row.original)}>
            {row.original.status === "Đã kết thúc" ? "Xem bản ghi" : "Chi tiết"}
          </UiButton>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data,
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
        title="Lớp online của con"
        subtitle="Phụ huynh theo dõi buổi học online, thời gian tham dự và bản ghi khi được giáo viên cho phép."
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Paper className="classInfoCard classInfoCard--info" p="md">
          <Text className="classInfoLabel">BUỔI SẮP DIỄN RA</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.filter((row) => row.status === "Sắp diễn ra").length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--success" p="md">
          <Text className="classInfoLabel">ĐÃ THAM DỰ</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.filter((row) => row.attendance === "Có tham dự").length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--warning" p="md">
          <Text className="classInfoLabel">BẢN GHI SẴN SÀNG</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.filter((row) => row.recording === "Sẵn sàng").length}
          </Text>
        </Paper>
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm buổi online"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, bản ghi..."
          style={{ minWidth: 290 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái buổi online"
          w={180}
          value={status}
          onChange={setStatus}
          data={[{ value: "all", label: "Tất cả trạng thái" }, "Sắp diễn ra", "Đang live", "Đã kết thúc"]}
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1050}
        emptyTitle="Không tìm thấy buổi học liên quan."
      />
      <Paper className="classInfoCallout" p="md" mt="md">
        <Group gap="sm" align="flex-start">
          <Video size={18} />
          <Stack gap={2}>
            <Text size="sm">Hệ thống chỉ hiển thị bản ghi khi phụ huynh được phép.</Text>
            <Text size="sm" c="dimmed">Bản ghi chỉ xuất hiện sau khi giáo viên công bố.</Text>
          </Stack>
        </Group>
      </Paper>
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.title} · ${selected.child}` : "Chi tiết buổi học online"}
      >
        {selected ? (
          <Stack gap="md">
            <Group justify="space-between">
              <UiStatusBadge role={role[selected.status]}>{selected.status}</UiStatusBadge>
              <Text size="sm" c="dimmed">
                {selected.time}
              </Text>
            </Group>
            <Text>Lớp {selected.className}</Text>
            <Text size="sm">Điểm danh: {selected.attendance}</Text>
            {selected.recording === "Sẵn sàng" ? (
              <Paper className="panelHighlight" p="md">
                <Text fw={600}>Bản ghi đã sẵn sàng</Text>
                <Text size="sm" c="dimmed" mt="xs">
                  Mở trong hệ thống theo quyền được cấp; không cung cấp nút tải xuống.
                </Text>
              </Paper>
            ) : (
              <Text size="sm" c="dimmed">
                Chưa có bản ghi được công bố.
              </Text>
            )}
            <Group justify="flex-end">
              <UiButton onClick={() => setSelected(null)}>Đóng</UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
