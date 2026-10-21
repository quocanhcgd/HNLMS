"use client";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Badge, Group, Paper, Progress, Text, ThemeIcon } from "@mantine/core";
import { CalendarClock, CheckCircle2, Search, Video } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { teacherOnlineApi } from "@/lib/teacher-online-api";

type Row = {
  id: string;
  className: string;
  title: string;
  time: string;
  provider: string;
  status: "Sắp diễn ra" | "Đang live" | "Đã kết thúc";
  attendance: string;
  recording: string;
};
const rows: Row[] = [
  {
    id: "online-if-2609-05",
    className: "IF-2609",
    title: "Unit 5 · Listening clinic",
    time: "Hôm nay 18:00-19:30",
    provider: "Zoom",
    status: "Sắp diễn ra",
    attendance: "0/18",
    recording: "Chưa có",
  },
  {
    id: "online-toeic-2609-04",
    className: "TOEIC-2609",
    title: "Mini test review",
    time: "Hôm qua 19:45-21:15",
    provider: "Google Meet",
    status: "Đã kết thúc",
    attendance: "14/16",
    recording: "Sẵn sàng",
  },
];
const role = { "Sắp diễn ra": "info", "Đang live": "success", "Đã kết thúc": "neutral" } as const;
export function TeacherOnlineWorkspace() {
  const [items, setItems] = useState<Row[]>(rows);
  const [apiReady, setApiReady] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    void teacherOnlineApi
      .list()
      .then((data) => {
        if (active && data.length) {
          setItems(data);
          setApiReady(true);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const live = items.filter((x) => x.status === "Đang live").length;
  const upcoming = items.filter((x) => x.status === "Sắp diễn ra").length;
  const finished = items.filter((x) => x.status === "Đã kết thúc").length;
  const data = useMemo(
    () =>
      items.filter(
        (x) =>
          (status === "all" || !status || x.status === status) &&
          JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, query, status],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "className",
        header: "Lớp",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.className}</Text>
            <Text size="xs" c="dimmed">
              {row.original.title}
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
      { accessorKey: "provider", header: "Nền tảng" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const v = getValue<Row["status"]>();
          return <UiStatusBadge role={role[v]}>{v}</UiStatusBadge>;
        },
      },
      { accessorKey: "attendance", header: "Điểm danh" },
      { accessorKey: "recording", header: "Bản ghi" },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiRowActions
            labels={{ publish: "Mở phòng host", archive: "Xem bản ghi" }}
            actions={{
              publish:
                row.original.status === "Sắp diễn ra"
                  ? async () => {
                      try {
                        const saved = await teacherOnlineApi.open(row.original.id);
                        setItems((current) => current.map((item) => (item.id === saved.id ? saved : item)));
                        setNotice(`Đã mở phòng host cho ${row.original.className}.`);
                      } catch {
                        setNotice("Không thể mở phòng trên máy chủ.");
                      }
                    }
                  : undefined,
              archive:
                row.original.status === "Đã kết thúc"
                  ? async () => {
                      try {
                        await teacherOnlineApi.recording(row.original.id);
                        setNotice(`Đang mở bản ghi ${row.original.title}.`);
                      } catch {
                        setNotice("Bản ghi chưa sẵn sàng trên máy chủ.");
                      }
                    }
                  : undefined,
            }}
          />
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
    <div className="page teacherWorkspace">
      <PageHeader
        title="Lớp học online"
        subtitle="Giảng viên quản lý lịch live, vào phòng học, theo dõi đồng bộ điểm danh và bản ghi."
      />
      <Text size="sm" fw={600} mb="md">
        Buổi học kế tiếp
      </Text>
      <Paper
        withBorder
        p="lg"
        mb="md"
        className="teacher-online-overview"
        style={{
          background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))",
          borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Group gap="md">
            <ThemeIcon size={44} radius="md" color="blue">
              <Video size={22} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">
                Trung tâm lớp học online
              </Text>
              <Text fz={28} fw={800}>
                {upcoming + live + finished} buổi trong lịch
              </Text>
              <Group gap="xs" mt={5}>
                <Badge color="teal" variant="light" leftSection={<CheckCircle2 size={12} />}>
                  {finished} đã kết thúc
                </Badge>
                <Text size="xs" c="dimmed">
                  {upcoming} sắp diễn ra · {live} đang live
                </Text>
              </Group>
            </div>
          </Group>
          <div className="teacher-online-summary">
            <Text size="xs" c="dimmed">
              Tỷ lệ có bản ghi
            </Text>
            <Text fw={750}>50%</Text>
            <Progress value={50} color="teal" size="sm" mt={6} />
          </div>
        </Group>
      </Paper>
      {notice ? (
        <Alert color="teal" mb="md" withCloseButton onClose={() => setNotice("")}>
          {notice}
        </Alert>
      ) : null}
      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm lớp, buổi học..."
          style={{ minWidth: 280 }}
        />
        <UiSelect
          w={170}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả" },
            { value: "Sắp diễn ra", label: "Sắp diễn ra" },
            { value: "Đang live", label: "Đang live" },
            { value: "Đã kết thúc", label: "Đã kết thúc" },
          ]}
        />
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1160}
          emptyTitle="Không tìm thấy buổi học online."
        />
        <Text size="xs" c="dimmed" mt="sm">
          {apiReady ? "Đã đồng bộ với máy chủ" : "Đang hiển thị dữ liệu mẫu; máy chủ lớp online chưa phản hồi"} ·{" "}
          {table.getRowModel().rows.length}/{items.length} buổi học · thao tác mở phòng và xem bản ghi nằm ngay trên
          từng dòng.
        </Text>
      </Paper>
    </div>
  );
}
