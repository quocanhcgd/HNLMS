"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardCheck, Edit3, FileCheck2, FileText, MessageCircle, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { DetailTabContent } from "./detail-tab-content";

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
  if (["students", "sessions", "assignments", "materials", "attendance", "scores", "feedback", "notifications"].includes(activeKey)) return <DetailTabContent activeKey={activeKey} />;
  return <Paper className="classInfoCallout" p="lg"><Text fw={700}>{summary.split(".")[0]}</Text><Text size="sm" c="dimmed" mt="xs">{summary}</Text></Paper>;
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


const classStudents = [
  { name: "Nguyễn Minh Anh", attendance: "12/14", progress: "68%", latestScore: "8.5/10", homework: "Trễ 1 bài", status: "Theo dõi" },
  { name: "Trần Gia Huy", attendance: "14/14", progress: "54%", latestScore: "7.2/10", homework: "Đủ bài", status: "Cần review" },
  { name: "Lê Phương Linh", attendance: "13/14", progress: "76%", latestScore: "9.0/10", homework: "Đủ bài", status: "Ổn định" },
];
const infoColumns = (headers: Array<{ key: string; label: string }>) => headers.map((header) => ({ accessorKey: header.key, header: header.label }));
function StudentsTab() { const columns = infoColumns([{ key: "name", label: "Học viên" }, { key: "attendance", label: "Điểm danh" }, { key: "progress", label: "Tiến độ" }, { key: "latestScore", label: "Điểm gần nhất" }, { key: "homework", label: "Bài tập" }]); return <Stack gap="md"><KpiCards items={[["18", "Học viên", "success"], ["14/18", "Đã tham dự gần nhất", "info"], ["2", "Cần hỗ trợ", "warning"], ["1", "Chờ handoff học vụ", "danger"]]} /><SimpleGrid cols={{ base: 1, md: 2 }}><Paper className="panel" p="md" withBorder><Text fw={700} mb="md">Danh sách học viên</Text><UiDataTable table={useReactTable({ data: classStudents, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={760} emptyTitle="Chưa có học viên." /></Paper><Paper className="panel" p="lg" withBorder><Text fw={700}>Handoff cần xử lý</Text><Text size="sm" c="dimmed" mt="xs">Giáo viên ghi nhận vấn đề học tập, học vụ tiếp nhận và xử lý theo scope.</Text><Group mt="md"><UiButton>Gửi học vụ</UiButton><UiButton variant="default">Mở trao đổi lớp</UiButton></Group></Paper></SimpleGrid></Stack>; }
function SessionsTab() { const rows = [{ session: "Unit 5 · Listening clinic", date: "24/08 · 18:00", materials: "4/5", attendance: "Chưa ghi", worklog: "Chưa xác nhận", status: "Cần chuẩn bị" }, { session: "Unit 4 · Grammar review", date: "22/08 · 18:00", materials: "5/5", attendance: "14/16", worklog: "Đã xác nhận", status: "Hoàn tất" }]; const columns = infoColumns([{ key: "session", label: "Buổi học" }, { key: "date", label: "Thời gian" }, { key: "materials", label: "Học liệu" }, { key: "attendance", label: "Điểm danh" }, { key: "worklog", label: "Worklog" }]); return <Stack gap="md"><KpiCards items={[["3", "Buổi tuần này", "info"], ["1", "Cần chuẩn bị", "warning"], ["1", "Chờ xác nhận worklog", "warning"], ["2/3", "Đã xác nhận lịch", "success"]]} /><Paper className="panel" p="md" withBorder><UiDataTable table={useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={900} emptyTitle="Chưa có buổi học." /></Paper></Stack>; }
function AssignmentsTab() { const rows = [{ title: "Listening warm-up", type: "Bài tập trên lớp", due: "Trong buổi", submitted: "16/18", graded: "14/18", status: "Chấm ngay" }, { title: "Writing Task 1", type: "Bài tập về nhà", due: "26/08 · 21:00", submitted: "12/18", graded: "0/12", status: "Chờ chấm sau" }, { title: "Mini test Unit 5", type: "Bài kiểm tra", due: "28/08", submitted: "0/18", graded: "-", status: "Chưa mở" }]; const columns = infoColumns([{ key: "title", label: "Bài" }, { key: "type", label: "Loại" }, { key: "due", label: "Hạn" }, { key: "submitted", label: "Đã nộp" }, { key: "graded", label: "Đã chấm" }]); return <Stack gap="md"><KpiCards items={[["14", "Chờ chấm trên lớp", "warning"], ["12", "Bài về nhà đã nộp", "info"], ["0", "Bài về nhà đã chấm", "danger"], ["1", "Bài kiểm tra sắp mở", "success"]]} /><Paper className="panel" p="md" withBorder><Group justify="flex-end" mb="md"><UiButton>Giao bài mới</UiButton><UiButton variant="default">Mở hàng đợi chấm</UiButton></Group><UiDataTable table={useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={900} emptyTitle="Chưa có bài tập." /></Paper></Stack>; }
function MaterialsTab() { const rows = [{ title: "IELTS Listening · Warm-up", type: "Bài giảng", access: "Đã công bố", version: "v3", viewer: "Mở trong hệ thống" }, { title: "Listening vocabulary pack", type: "Tài liệu tham khảo", access: "Đã công bố", version: "v1", viewer: "Mở trong hệ thống" }, { title: "Unit 5 worksheet", type: "Bài tập", access: "Chưa công bố", version: "Bản nháp", viewer: "-" }]; const columns = infoColumns([{ key: "title", label: "Học liệu" }, { key: "type", label: "Loại" }, { key: "access", label: "Trạng thái" }, { key: "version", label: "Phiên bản" }, { key: "viewer", label: "Cách mở" }]); return <Stack gap="md"><KpiCards items={[["5", "Học liệu buổi kế tiếp", "info"], ["4", "Đã công bố", "success"], ["1", "Chưa công bố", "warning"], ["0", "Lỗi xử lý", "success"]]} /><Paper className="panel" p="md" withBorder><Group justify="flex-end" mb="md"><UiButton>Thêm học liệu</UiButton><UiButton variant="default">Xem trước lớp</UiButton></Group><UiDataTable table={useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={900} emptyTitle="Chưa có học liệu." /></Paper></Stack>; }
function AttendanceTab() { const rows = classStudents.map((student) => ({ student: student.name, present: student.attendance, latest: student.name === "Trần Gia Huy" ? "Có mặt" : "Cần ghi", note: student.name === "Nguyễn Minh Anh" ? "Vắng 2 buổi" : "" })); const columns = infoColumns([{ key: "student", label: "Học viên" }, { key: "present", label: "Tỷ lệ" }, { key: "latest", label: "Buổi gần nhất" }, { key: "note", label: "Ghi chú" }]); return <Stack gap="md"><KpiCards items={[["14/16", "Buổi gần nhất", "info"], ["87,5%", "Tỷ lệ tham dự", "success"], ["2", "Cần xác minh", "warning"], ["1", "Đã báo học vụ", "danger"]]} /><Paper className="panel" p="md" withBorder><Group justify="flex-end" mb="md"><UiButton>Chốt điểm danh</UiButton><UiButton variant="default">Gửi cảnh báo</UiButton></Group><UiDataTable table={useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={760} emptyTitle="Chưa có dữ liệu điểm danh." /></Paper></Stack>; }
function ScoresTab() { const rows = classStudents.map((student) => ({ student: student.name, inClass: student.name === "Lê Phương Linh" ? "9.0" : "8.5", test: student.name === "Trần Gia Huy" ? "7.2" : "8.1", homework: student.homework === "Đủ bài" ? "Chờ chấm" : "-", status: "Đang theo dõi" })); const columns = infoColumns([{ key: "student", label: "Học viên" }, { key: "inClass", label: "Trên lớp" }, { key: "test", label: "Kiểm tra" }, { key: "homework", label: "Bài về nhà" }, { key: "status", label: "Trạng thái" }]); return <Stack gap="md"><KpiCards items={[["8,2", "Điểm trung bình", "info"], ["14", "Điểm trên lớp đã chấm", "success"], ["12", "Bài về nhà chờ chấm", "warning"], ["0", "Điểm đã điều chỉnh", "info"]]} /><Paper className="panel" p="md" withBorder><Group justify="flex-end" mb="md"><UiButton>Chấm bài</UiButton><UiButton variant="default">Công bố điểm</UiButton></Group><UiDataTable table={useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={820} emptyTitle="Chưa có điểm." /></Paper></Stack>; }
function FeedbackTab() { return <Stack gap="md"><Paper className="panel" p="lg" withBorder><Text fw={700}>Phản hồi buổi học gần nhất</Text><Text size="sm" c="dimmed" mt="xs">Học viên phản hồi về tốc độ nghe và thời lượng thực hành speaking.</Text><Group mt="md"><UiStatusBadge role="warning">Cần gửi học vụ</UiStatusBadge><UiButton>Ghi nhận phản hồi</UiButton></Group></Paper><Paper className="panel" p="lg" withBorder><Text fw={700}>Ghi chú của giáo viên</Text><Textarea mt="sm" minRows={5} placeholder="Ghi lại điều cần điều chỉnh ở buổi sau..." /><Group justify="flex-end" mt="md"><UiButton>Lưu phản hồi</UiButton></Group></Paper></Stack>; }
function KpiCards({ items }: { items: Array<[string, string, "success" | "info" | "warning" | "danger"]> }) { return <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="sm">{items.map(([value, label, role]) => <Paper className={`classInfoCard classInfoCard--${role === "danger" ? "warning" : role}`} p="md" key={label}><Text className="classInfoLabel">{label}</Text><Text className="classInfoValue" fw={700} fz="xl">{value}</Text></Paper>)}</SimpleGrid>; }

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
