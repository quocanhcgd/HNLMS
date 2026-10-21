"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { CalendarClock, Search, Video } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type SessionStatus = "Sắp diễn ra" | "Đang học" | "Đã kết thúc";
type Session = { id: string; className: string; subject: string; program: string; startsAt: string; teacher: string; modality: string; status: SessionStatus; attendance: string };
const sessions: Session[] = [
  { id: "session-1", className: "IF-2609", subject: "Tiếng Anh", program: "IELTS Foundation", startsAt: "Hôm nay · 18:00-19:30", teacher: "Lan Anh", modality: "Online", status: "Sắp diễn ra", attendance: "Chưa điểm danh" },
  { id: "session-2", className: "TOEIC-2609", subject: "Tiếng Anh", program: "TOEIC 700+", startsAt: "Hôm nay · 19:45-21:15", teacher: "Minh Tuấn", modality: "Tại trung tâm", status: "Sắp diễn ra", attendance: "Chưa điểm danh" },
  { id: "session-3", className: "MATH-2609", subject: "Toán", program: "Toán nâng cao", startsAt: "Hôm qua · 17:30-19:00", teacher: "Thu Hà", modality: "Tại trung tâm", status: "Đã kết thúc", attendance: "Có mặt" },
];
const statusRole: Record<SessionStatus, "info" | "success" | "neutral"> = { "Sắp diễn ra": "info", "Đang học": "success", "Đã kết thúc": "neutral" };

export default function StudentSchedulePage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [joinNotice, setJoinNotice] = useState("");
  const filtered = useMemo(() => sessions.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (status === "all" || !status || item.status === status)), [query, status]);
  const columns = useMemo<ColumnDef<Session>[]>(() => [
    { accessorKey: "className", header: "Lớp", cell: ({ row }) => <div><Text fw={600}>{row.original.className}</Text><Text size="xs" c="dimmed">{row.original.subject} · {row.original.program}</Text></div> },
    { accessorKey: "startsAt", header: "Thời gian", cell: ({ getValue }) => <Group gap="xs" wrap="nowrap"><CalendarClock size={15} /><Text size="sm">{getValue<string>()}</Text></Group> },
    { accessorKey: "teacher", header: "Giảng viên" },
    { accessorKey: "modality", header: "Hình thức" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<SessionStatus>(); return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
    { accessorKey: "attendance", header: "Điểm danh" },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" disabled={row.original.status === "Đã kết thúc" || row.original.modality !== "Online"} leftSection={<Video size={14} />} onClick={() => setSelected(row.original)}>Vào lớp</UiButton> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const upcomingCount = sessions.filter((item) => item.status === "Sắp diễn ra").length;
  const onlineCount = sessions.filter((item) => item.modality === "Online").length;
  const attendedCount = sessions.filter((item) => item.attendance === "Có mặt").length;
  return <div className="page">
    <PageHeader title="Lịch học" subtitle="Theo dõi các buổi học theo môn, chương trình, lớp, giảng viên và hình thức học." />
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
      <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">BUỔI SẮP DIỄN RA</Text><Text fz={24} fw={700}>{upcomingCount}</Text></Paper>
      <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">BUỔI ONLINE</Text><Text fz={24} fw={700}>{onlineCount}</Text></Paper>
      <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">ĐÃ ĐIỂM DANH</Text><Text fz={24} fw={700}>{attendedCount}/{sessions.length}</Text></Paper>
    </SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm lịch học" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm lớp, môn, giảng viên..." style={{ minWidth: 280 }} /><UiSelect aria-label="Lọc trạng thái lịch học" w={180} value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, "Sắp diễn ra", "Đang học", "Đã kết thúc"]} /></PageToolbar>
    <Paper className="panel scheduleTablePanel" p="md" withBorder><Stack gap="xs"><UiDataTable table={table} columnCount={columns.length} minWidth={1060} emptyTitle="Không tìm thấy buổi học phù hợp." /><Text size="xs" c="dimmed">{table.getRowModel().rows.length}/{sessions.length} buổi học · Lịch đã công bố theo các lớp đang ghi danh.</Text><Text size="xs" c="dimmed">Ghi chú: Nút <b>Vào lớp</b> chỉ bật cho buổi online chưa kết thúc. Điểm danh được cập nhật sau khi giáo viên xác nhận; buổi tại trung tâm hiển thị để theo dõi lịch nhưng không có nút vào lớp.</Text></Stack></Paper>
    <UiModal opened={selected !== null} onClose={() => { setSelected(null); setJoinNotice(""); }} title={selected ? `Vào lớp · ${selected.className}` : "Vào lớp"}>{selected ? <Stack gap="sm"><Text fw={600}>{selected.subject} · {selected.program}</Text><Text size="sm">{selected.startsAt} · Giảng viên {selected.teacher}</Text><Text size="sm" c="dimmed">Phòng học online sẽ mở khi giáo viên bắt đầu buổi học.</Text>{joinNotice ? <UiStatusBadge role="success">{joinNotice}</UiStatusBadge> : null}<Group justify="flex-end"><UiButton variant="default" onClick={() => { setSelected(null); setJoinNotice(""); }}>Đóng</UiButton>{selected.modality === "Online" ? <UiButton disabled={Boolean(joinNotice)} onClick={() => setJoinNotice("Đã ghi nhận tham gia; điểm danh sẽ cập nhật sau buổi học.")}>Vào phòng học</UiButton> : null}</Group></Stack> : null}</UiModal>
  </div>;
}
