"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Edit3, FileCheck2, FileText, MessageCircle, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

const tabs = [
  { key: "schedule", label: "Lịch học", icon: CalendarClock, summary: "Lịch tuần, lịch buổi học và thay đổi thời khóa biểu." },
  { key: "overview", label: "Tổng quan", icon: ClipboardCheck, summary: "Mục tiêu, tiến độ và việc cần xử lý của lớp." },
  { key: "students", label: "Học viên", icon: UsersRound, summary: "Danh sách học viên, trạng thái học tập và rủi ro cần báo học vụ." },
  { key: "sessions", label: "Các buổi học", icon: CalendarClock, summary: "Từng buổi dạy, điểm danh, học liệu và worklog." },
  { key: "assignments", label: "Bài tập", icon: FileCheck2, summary: "Bài tập trên lớp chấm ngay; bài tập về nhà chờ chấm sau." },
  { key: "materials", label: "Tài liệu", icon: FileText, summary: "Bài giảng, tài liệu tham khảo và nội dung mở trực tiếp trong hệ thống." },
  { key: "attendance", label: "Điểm danh", icon: ClipboardCheck, summary: "Ghi nhận có mặt, muộn, vắng và ghi chú từng học viên." },
  { key: "scores", label: "Bảng điểm", icon: FileCheck2, summary: "Điểm bài trên lớp, bài kiểm tra và bài tập đã công bố." },
  { key: "feedback", label: "Phản hồi buổi học", icon: MessageCircle, summary: "Ghi nhận phản hồi lớp và vấn đề cần học vụ hỗ trợ." },
  { key: "notifications", label: "Thông báo", icon: MessageCircle, summary: "Thông báo đến học viên, phụ huynh và học vụ trong scope lớp." },
];

function ClassDetailTabContent({ activeKey, summary }: { activeKey: string; summary: string }) {
  if (activeKey === "schedule") return <ScheduleTab />;
  if (activeKey === "overview") return <OverviewTab />;
  return (
    <>
      <Group justify="space-between" mb="md"><div><Text fw={700}>{summary.split(".")[0]}</Text><Text size="sm" c="dimmed">{summary}</Text></div><UiButton variant="default">Làm mới dữ liệu</UiButton></Group>
      <Paper className="classInfoCallout" p="lg"><Text fw={700}>Luồng xử lý hiện tại</Text><Text size="sm" c="dimmed" mt="xs">Trước buổi dạy: chuẩn bị học liệu. Trong buổi dạy: điểm danh và chấm bài trên lớp. Sau buổi dạy: chấm bài về nhà, xác nhận worklog và gửi thông tin cho học vụ/payroll.</Text></Paper>
    </>
  );
}

export default function TeacherClassDetailPage() {
  const pathname = usePathname();
  const activeKey = tabs.find((tab) => pathname.endsWith(`/${tab.key}`))?.key ?? "overview";
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[1];
  return <div className="page">
    <PageHeader title="IF-2609 · IELTS Foundation A2+" subtitle="Lớp được phân công · 18 học viên · T2/T4/T6 · 18:00-19:30" />
    <Group gap="xs" mb="md" wrap="wrap"><UiStatusBadge role="success">Đang dạy</UiStatusBadge><UiStatusBadge role="warning">Buổi kế tiếp còn thiếu bài tập về nhà</UiStatusBadge></Group>
    <nav className="classDetailTabs" aria-label="Các chức năng của lớp học">{tabs.map((tab) => { const Icon = tab.icon; return <Link key={tab.key} href={`/teacher/classes/if-2609/${tab.key}`} className={`classDetailTab ${tab.key === activeKey ? "active" : ""}`} aria-current={tab.key === activeKey ? "page" : undefined}><Icon size={16}/><span>{tab.label}</span></Link>; })}</nav>
    <Paper className="panel classDetailContent" p="lg" withBorder><Group justify="space-between" mb="md"><div><Text fw={700}>{active.label}</Text><Text size="sm" c="dimmed">{active.summary}</Text></div><UiButton variant="default">Làm mới dữ liệu</UiButton></Group><ClassDetailTabContent activeKey={active.key} summary={active.summary} /></Paper>
  </div>;
}

function OverviewTab() {
  return <Stack gap="md">
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="sm">
      <Paper className="classInfoCard classInfoCard--success" p="md"><Text className="classInfoLabel">Sĩ số</Text><Text className="classInfoValue" fw={700} fz="xl">18/18</Text><UiStatusBadge role="success">Đủ sĩ số</UiStatusBadge></Paper>
      <Paper className="classInfoCard classInfoCard--primary" p="md"><Text className="classInfoLabel">Tiến độ lớp</Text><Text className="classInfoValue" fw={700} fz="xl">62%</Text><Text className="classInfoMeta" size="sm">Unit 5/8</Text></Paper>
      <Paper className="classInfoCard classInfoCard--info" p="md"><Text className="classInfoLabel">Điểm danh gần nhất</Text><Text className="classInfoValue" fw={700} fz="xl">14/16</Text><Text className="classInfoMeta" size="sm">87,5% tham dự</Text></Paper>
      <Paper className="classInfoCard classInfoCard--warning" p="md"><Text className="classInfoLabel">Việc cần xử lý</Text><Text className="classInfoValue" fw={700} fz="xl">4</Text><UiStatusBadge role="warning">Cần xem hôm nay</UiStatusBadge></Paper>
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
      <Paper className="panel" p="lg" withBorder><Group mb="md"><ThemeIcon color="yellow" variant="light"><AlertTriangle size={18}/></ThemeIcon><div><Text fw={700}>Học viên cần hỗ trợ</Text><Text size="sm" c="dimmed">Giáo viên ghi nhận, học vụ tiếp nhận handoff.</Text></div></Group><Stack gap="sm"><Group justify="space-between"><div><Text fw={600}>Nguyễn Minh Anh</Text><Text size="xs" c="dimmed">Vắng 2 buổi · homework trễ</Text></div><UiStatusBadge role="warning">Theo dõi</UiStatusBadge></Group><Group justify="space-between"><div><Text fw={600}>Trần Gia Huy</Text><Text size="xs" c="dimmed">Speaking confidence thấp</Text></div><UiStatusBadge role="info">Cần review</UiStatusBadge></Group><UiButton variant="default">Gửi học vụ</UiButton></Stack></Paper>
      <Paper className="panel" p="lg" withBorder><Group mb="md"><ThemeIcon color="green" variant="light"><CheckCircle2 size={18}/></ThemeIcon><div><Text fw={700}>Checklist buổi kế tiếp</Text><Text size="sm" c="dimmed">Tách rõ trước/trong/sau buổi dạy.</Text></div></Group><Stack gap="sm"><Text size="sm">✓ Bài giảng và bài tập trên lớp đã công bố</Text><Text size="sm">✓ Bài kiểm tra đã sẵn sàng</Text><Text size="sm">○ Bài tập về nhà chưa công bố</Text><Text size="sm">○ Xác nhận slot online với học vụ</Text></Stack></Paper>
    </SimpleGrid>
  </Stack>;
}

function ScheduleTab() {
  const scheduleRows = [
    { day: "Thứ 2", date: "24/08", time: "18:00-19:30", session: "Unit 5 · Listening clinic", mode: "Online", room: "Zoom · Phòng IF-2609", status: "Đã xác nhận" },
    { day: "Thứ 4", date: "26/08", time: "18:00-19:30", session: "Unit 5 · In-class practice", mode: "Tại lớp", room: "Phòng A203", status: "Đã xác nhận" },
    { day: "Thứ 6", date: "28/08", time: "18:00-19:30", session: "Unit 5 · Review & homework", mode: "Online", room: "Zoom · Phòng IF-2609", status: "Chờ học vụ duyệt" },
  ];
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const columns = useMemo<ColumnDef<(typeof scheduleRows)[number]>[]>(() => [
    { accessorKey: "day", header: "Ngày", cell: ({ row }) => <div><Text fw={600}>{row.original.day}</Text><Text size="xs" c="dimmed">{row.original.date}</Text></div> },
    { accessorKey: "time", header: "Giờ học" },
    { accessorKey: "session", header: "Nội dung buổi học" },
    { accessorKey: "mode", header: "Hình thức" },
    { accessorKey: "room", header: "Phòng / liên kết" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => <UiStatusBadge role={getValue() === "Đã xác nhận" ? "success" : "warning"}>{String(getValue())}</UiStatusBadge> },
  ], []);
  const filteredRows = useMemo(() => scheduleRows.filter((row) => {
    const matchesQuery = JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
    const matchesMode = mode === "all" || !mode || row.mode === mode;
    return matchesQuery && matchesMode;
  }), [mode, query]);
  const table = useReactTable({ data: filteredRows, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <Stack gap="md">
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm"><Paper className="classInfoCard classInfoCard--primary" p="md"><Text className="classInfoLabel">Lịch cố định</Text><Text className="classInfoValue" fw={700}>T2/T4/T6</Text><Text className="classInfoMeta" size="sm">18:00-19:30</Text></Paper><Paper className="classInfoCard classInfoCard--info" p="md"><Text className="classInfoLabel">Buổi kế tiếp</Text><Text className="classInfoValue" fw={700}>Thứ 2 · 24/08</Text><Text className="classInfoMeta" size="sm">Online · 18:00</Text></Paper><Paper className="classInfoCard classInfoCard--warning" p="md"><Text className="classInfoLabel">Phê duyệt</Text><Text className="classInfoValue" fw={700}>2/3 buổi đã xác nhận</Text><Text className="classInfoMeta" size="sm">1 buổi chờ học vụ</Text></Paper></SimpleGrid>
    {requestSent ? <UiStatusBadge role="success">Đã gửi đề xuất đổi lịch, đang chờ học vụ duyệt.</UiStatusBadge> : null}
    <Group className="toolbar"><UiTextInput aria-label="Tìm buổi học" value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Tìm ngày, nội dung, phòng..." leftSection={<Search size={16} />} /><UiSelect aria-label="Lọc hình thức" w={160} value={mode} onChange={setMode} data={[{ value: "all", label: "Tất cả hình thức" }, "Online", "Tại lớp"]} /><UiButton variant="default" leftSection={<Edit3 size={16} />} onClick={() => setRequestOpen(true)}>Đề xuất đổi lịch</UiButton></Group>
    <UiDataTable table={table} columnCount={columns.length} minWidth={1000} emptyTitle="Không có buổi học phù hợp." />
    <Text size="sm" c="dimmed">Hiển thị {filteredRows.length}/{scheduleRows.length} buổi. Đổi lịch cần ghi rõ lý do, slot thay thế và được học vụ duyệt.</Text>
    <UiModal opened={requestOpen} onClose={() => setRequestOpen(false)} title="Đề xuất đổi lịch" size="lg"><Stack><Text size="sm" c="dimmed">Đề xuất sẽ chưa thay đổi lịch chính thức cho đến khi học vụ duyệt.</Text><UiSelect label="Buổi cần đổi" data={["Thứ 6 · 28/08 · 18:00-19:30"]} defaultValue="Thứ 6 · 28/08 · 18:00-19:30" /><UiTextInput label="Slot đề xuất" placeholder="Ví dụ: Thứ 7 · 09:00-10:30" /><Textarea label="Lý do" placeholder="Nêu lý do và ảnh hưởng đến lớp..." minRows={4} /><Group justify="flex-end"><UiButton variant="default" onClick={() => setRequestOpen(false)}>Hủy</UiButton><UiButton onClick={() => { setRequestSent(true); setRequestOpen(false); }}>Gửi học vụ duyệt</UiButton></Group></Stack></UiModal>
  </Stack>;
}
