"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { CalendarClock, ExternalLink, PlayCircle, Search, Video } from "lucide-react";
import { Group, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type SessionStatus = "Sắp diễn ra" | "Đang live" | "Đã kết thúc";
type RecordingStatus = "Chưa có" | "Đang xử lý" | "Đã công bố";
type Row = {
  id: string;
  className: string;
  subject: string;
  program: string;
  teacher: string;
  session: string;
  time: string;
  mode: "Trực tuyến";
  status: SessionStatus;
  attendance: string;
  recording: RecordingStatus;
  roomReady: boolean;
};
const rows: Row[] = [
  {
    id: "if-2609-05",
    className: "IF-2609",
    subject: "Tiếng Anh",
    program: "IELTS Foundation",
    teacher: "Nguyễn Lan Anh",
    session: "Buổi 05 · Listening clinic",
    time: "Hôm nay 18:00–19:30",
    mode: "Trực tuyến",
    status: "Sắp diễn ra",
    attendance: "Chưa điểm danh",
    recording: "Chưa có",
    roomReady: true,
  },
  {
    id: "math-2609-03",
    className: "MATH-2609",
    subject: "Toán",
    program: "Toán 9 nâng cao",
    teacher: "Trần Minh Đức",
    session: "Buổi 03 · Ôn tập hàm số",
    time: "Ngày mai 19:00–20:30",
    mode: "Trực tuyến",
    status: "Sắp diễn ra",
    attendance: "Chưa điểm danh",
    recording: "Chưa có",
    roomReady: false,
  },
  {
    id: "toeic-2609-04",
    className: "TOEIC-2609",
    subject: "Tiếng Anh",
    program: "TOEIC 600",
    teacher: "Phạm Hoài Nam",
    session: "Buổi 04 · Mini test review",
    time: "Hôm qua 19:45–21:15",
    mode: "Trực tuyến",
    status: "Đã kết thúc",
    attendance: "Có tham dự",
    recording: "Đã công bố",
    roomReady: false,
  },
  {
    id: "lit-2609-02",
    className: "LIT-2609",
    subject: "Ngữ văn",
    program: "Ngữ văn 9",
    teacher: "Lê Thu Hà",
    session: "Buổi 02 · Đọc hiểu",
    time: "12/09/2026 17:30–19:00",
    mode: "Trực tuyến",
    status: "Đã kết thúc",
    attendance: "Vắng có phép",
    recording: "Đang xử lý",
    roomReady: false,
  },
];
const statusRole: Record<SessionStatus, "info" | "success" | "neutral"> = {
  "Sắp diễn ra": "info",
  "Đang live": "success",
  "Đã kết thúc": "neutral",
};
const recordingRole: Record<RecordingStatus, "neutral" | "warning" | "success"> = {
  "Chưa có": "neutral",
  "Đang xử lý": "warning",
  "Đã công bố": "success",
};

export function StudentOnlineWorkspace() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dialog, setDialog] = useState<{ kind: "join" | "recording" | "detail"; row: Row } | null>(null);
  const [actionNotice, setActionNotice] = useState("");
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === "all" || !status || row.status === status) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
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
              {row.original.subject} · {row.original.program}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "session",
        header: "Buổi học",
        cell: ({ row }) => (
          <div>
            <Text size="sm">{row.original.session}</Text>
            <Text size="xs" c="dimmed">
              {row.original.teacher}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "time",
        header: "Thời gian",
        cell: ({ getValue }) => (
          <Group gap="xs" wrap="nowrap">
            <CalendarClock size={15} />
            <Text size="sm" style={{ whiteSpace: "nowrap" }}>
              {getValue<string>()}
            </Text>
          </Group>
        ),
      },
      { accessorKey: "mode", header: "Hình thức" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<SessionStatus>();
          return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>;
        },
      },
      { accessorKey: "attendance", header: "Điểm danh" },
      {
        accessorKey: "recording",
        header: "Bản ghi",
        cell: ({ getValue }) => {
          const value = getValue<RecordingStatus>();
          return <UiStatusBadge role={recordingRole[value]}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            {row.original.status !== "Đã kết thúc" ? (
              <UiButton
                size="compact-xs"
                leftSection={<Video size={14} />}
                onClick={() => setDialog({ kind: "join", row: row.original })}
                disabled={!row.original.roomReady}
              >
                Vào lớp
              </UiButton>
            ) : null}
            {row.original.recording === "Đã công bố" ? (
              <UiButton
                size="compact-xs"
                variant="default"
                leftSection={<PlayCircle size={14} />}
                onClick={() => setDialog({ kind: "recording", row: row.original })}
              >
                Xem bản ghi
              </UiButton>
            ) : null}
            <UiButton
              size="compact-xs"
              variant="subtle"
              leftSection={<ExternalLink size={14} />}
              onClick={() => setDialog({ kind: "detail", row: row.original })}
            >
              Chi tiết
            </UiButton>
          </Group>
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
        title="Lớp online"
        subtitle="Theo dõi các buổi học thuộc lớp của bạn, vào phòng khi mở và xem bản ghi đã công bố."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm lớp online"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm lớp, môn, giảng viên..."
          style={{ minWidth: 300 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái lớp online"
          w={180}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "Sắp diễn ra", label: "Sắp diễn ra" },
            { value: "Đang live", label: "Đang live" },
            { value: "Đã kết thúc", label: "Đã kết thúc" },
          ]}
        />
      </PageToolbar>
      <Stack>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1360}
          emptyTitle="Không tìm thấy buổi học online."
        />
        <Text size="xs" c="dimmed">
          {table.getRowModel().rows.length}/{rows.length} buổi học · Dữ liệu chỉ thuộc các lớp bạn đang tham gia.
        </Text>
        <Stack gap={2}>
          <Text size="xs" c="dimmed">
            Ghi chú: Nút <b>Vào lớp</b> chỉ bật khi giáo viên đã mở phòng. Bạn nên vào trước 5 phút.
          </Text>
          <Text size="xs" c="dimmed">
            Bản ghi chỉ xem được sau khi công bố; trạng thái xử lý hiển thị tại bảng. Chi tiết bao gồm lịch, học liệu và điểm danh.
          </Text>
        </Stack>
      </Stack>
      <UiModal
        opened={dialog !== null}
        onClose={() => {
          setDialog(null);
          setActionNotice("");
        }}
        title={
          dialog?.kind === "join"
            ? "Vào lớp online"
            : dialog?.kind === "recording"
              ? "Bản ghi buổi học"
              : "Chi tiết buổi học"
        }
      >
        {dialog ? (
          <Stack gap="sm">
            <Text fw={600}>
              {dialog.row.className} · {dialog.row.session}
            </Text>
            <Text size="sm" c="dimmed">
              {dialog.row.subject} · {dialog.row.program} · GV {dialog.row.teacher}
            </Text>
            <Text size="sm">
              {dialog.row.time} · {dialog.row.mode}
            </Text>
            {dialog.kind === "join" ? (
              <Text size="sm">Phòng học đã sẵn sàng. Hệ thống sẽ ghi nhận điểm danh khi bạn tiếp tục.</Text>
            ) : dialog.kind === "recording" ? (
              <Text size="sm">Bản ghi đã được công bố. Học viên có thể xem lại nội dung và học liệu đính kèm.</Text>
            ) : (
              <Text size="sm">
                Điểm danh: {dialog.row.attendance}. Bản ghi: {dialog.row.recording}.
              </Text>
            )}
            {actionNotice ? <UiStatusBadge role="success">{actionNotice}</UiStatusBadge> : null}
            <Group justify="flex-end">
              <UiButton
                variant="default"
                onClick={() => {
                  setDialog(null);
                  setActionNotice("");
                }}
              >
                Đóng
              </UiButton>
              {dialog.kind === "join" || dialog.kind === "recording" ? (
                <UiButton
                  disabled={Boolean(actionNotice)}
                  onClick={() =>
                    setActionNotice(
                      dialog.kind === "join" ? "Đã ghi nhận tham gia buổi học." : "Đã mở bản ghi buổi học.",
                    )
                  }
                >
                  {dialog.kind === "join" ? "Mở phòng học" : "Xem bản ghi"}
                </UiButton>
              ) : null}
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
