"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowRight, BookOpen, CalendarClock, CheckCircle2, CircleAlert, ClipboardCheck, MessageSquare, Search, Video, WalletCards } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiStatusBadge, UiTextInput } from "@/components/ui";

type StudentPortalSection = "overview" | "progress" | "schedule" | "scores" | "tuition" | "homework";
type Row = { classCode: string; courseName: string; teacher: string; schedule: string; progress: number; attendance: string; score: string; tuition: string; homework: string; status: "Đang học" | "Hoàn thành" | "Cần hỗ trợ" };
const rows: Row[] = [
  { classCode: "IF-2609", courseName: "IELTS Foundation", teacher: "Lan Anh", schedule: "T2/T4/T6 · 18:00–19:30", progress: 62, attendance: "12/14 buổi", score: "8.1/10", tuition: "Còn 2.000.000đ · hạn 30/08", homework: "Unit 5 · hạn 26/08", status: "Đang học" },
  { classCode: "TOEIC-2609", courseName: "TOEIC 700+", teacher: "Minh Tuấn", schedule: "T2/T5 · 19:45–21:15", progress: 18, attendance: "4/5 buổi", score: "560/990", tuition: "Đã hoàn tất", homework: "Mini test 2 · hạn 28/08", status: "Cần hỗ trợ" },
];
const role = { "Đang học": "info", "Hoàn thành": "success", "Cần hỗ trợ": "warning" } as const;
const quickActions = [
  { label: "Xem lịch học", href: "/student/schedule", icon: CalendarClock, detail: "Buổi gần nhất hôm nay 18:00" },
  { label: "Làm bài tập", href: "/student/homework", icon: ClipboardCheck, detail: "2 bài đang chờ xử lý" },
  { label: "Mở lớp online", href: "/student/online", icon: Video, detail: "1 phòng sắp mở" },
  { label: "Tin nhắn học tập", href: "/student/messages", icon: MessageSquare, detail: "1 tin chưa đọc" },
];

export function StudentPortalWorkspace({ section }: { section: StudentPortalSection }) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(() => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(query.toLowerCase())), [query]);
  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "classCode", header: "Lớp", cell: ({ row }) => <div><Text fw={600}>{row.original.classCode}</Text><Text size="xs" c="dimmed">{row.original.courseName}</Text></div> },
    { accessorKey: "schedule", header: "Lịch học", cell: ({ getValue }) => <Group gap="xs" wrap="nowrap"><CalendarClock size={15} /><Text size="sm">{getValue<string>()}</Text></Group> },
    { accessorKey: "teacher", header: "Giảng viên" },
    { accessorKey: "progress", header: "Tiến độ", cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge> },
    { accessorKey: "attendance", header: "Điểm danh" },
    { accessorKey: "score", header: "Điểm" },
    { accessorKey: "tuition", header: "Học phí" },
    { accessorKey: "homework", header: "Bài tập" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<Row["status"]>(); return <UiStatusBadge role={role[value]}>{value}</UiStatusBadge>; } },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton component="a" href={`/student/classes/${row.original.classCode.toLowerCase()}`} size="compact-xs" variant="subtle" rightSection={<ArrowRight size={14} />}>Chi tiết</UiButton> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const isProgress = section === "progress";
  const averageProgress = Math.round(rows.reduce((sum, item) => sum + item.progress, 0) / rows.length);

  return <div className="page studentWorkspace">
    <PageHeader title={isProgress ? "Tiến độ học tập" : "Cổng học viên"} subtitle={isProgress ? "Theo dõi tiến độ, điểm danh, kết quả và cảnh báo theo từng lớp đang học." : "Một nơi để biết hôm nay cần học gì, việc nào đang chờ và kết quả của từng lớp."} />
    {!isProgress ? <>
      <Group justify="space-between" align="flex-end" mb="lg"><div><Text fw={700} fz="lg">Tổng quan hôm nay</Text><Text size="sm" c="dimmed">Dữ liệu học tập được cập nhật theo các lớp bạn đang tham gia.</Text></div><UiButton component="a" href="/student/progress" variant="subtle" rightSection={<ArrowRight size={15} />}>Xem toàn bộ tiến độ</UiButton></Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="xl">
        <Paper component="a" href="/student/classes" className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}><Group justify="space-between"><BookOpen size={20} /><Text size="xs" c="dimmed">LỚP ĐANG HỌC</Text></Group><Text fz={28} fw={700} mt="sm">{rows.length}</Text><Text size="xs" c="dimmed">1 lớp cần được chú ý</Text></Paper>
        <Paper component="a" href="/student/progress" className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}><Group justify="space-between"><CheckCircle2 size={20} /><Text size="xs" c="dimmed">TIẾN ĐỘ TRUNG BÌNH</Text></Group><Text fz={28} fw={700} mt="sm">{averageProgress}%</Text><Text size="xs" c="dimmed">Theo nội dung đã công bố</Text></Paper>
        <Paper component="a" href="/student/schedule" className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}><Group justify="space-between"><CalendarClock size={20} /><Text size="xs" c="dimmed">ĐIỂM DANH</Text></Group><Text fz={28} fw={700} mt="sm">16/19</Text><Text size="xs" c="dimmed">84% số buổi đã tham dự</Text></Paper>
        <Paper component="a" href="/student/homework" className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}><Group justify="space-between"><CircleAlert size={20} /><Text size="xs" c="dimmed">CẦN XỬ LÝ</Text></Group><Text fz={28} fw={700} mt="sm">3</Text><Text size="xs" c="dimmed">2 bài tập · 1 học phí</Text></Paper>
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md" mb="md">
        <Paper component="section" className="panel studentOverviewPanel" p="md" withBorder>
          <Text fw={700}>Lối tắt học tập</Text>
          <Text size="xs" c="dimmed" mb="sm">Đi thẳng đến việc cần làm</Text>
          <Stack gap={0}>{quickActions.map(({ label, href, icon: Icon, detail }) => <Group key={href} justify="space-between" py="sm" style={{ borderBottom: "1px solid var(--app-border)" }}><Group gap="sm"><Icon size={18} /><div><Text size="sm" fw={600}>{label}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group><UiButton component="a" href={href} size="compact-xs" variant="subtle" aria-label={label} rightSection={<ArrowRight size={14} />}>Mở</UiButton></Group>)}</Stack>
        </Paper>
        <Paper component="section" className="panel studentOverviewPanel" p="md" withBorder>
          <Group justify="space-between"><div><Text fw={700}>Lịch gần nhất</Text><Text size="xs" c="dimmed">Hai buổi tiếp theo của bạn</Text></div><UiButton component="a" href="/student/schedule" size="compact-xs" variant="subtle">Xem lịch</UiButton></Group>
          <Stack gap="sm" mt="sm"><Group justify="space-between" py="sm" style={{ borderBottom: "1px solid var(--app-border)" }}><div><Text size="sm" fw={600}>IELTS Foundation · IF-2609</Text><Text size="xs" c="dimmed">Hôm nay · 18:00–19:30 · Lan Anh</Text></div><Group gap="xs"><UiStatusBadge role="info">Sắp diễn ra</UiStatusBadge><UiButton component="a" href="/student/classes/if-2609" size="compact-xs" variant="subtle">Mở lớp</UiButton></Group></Group><Group justify="space-between" py="sm" style={{ borderBottom: "1px solid var(--app-border)" }}><div><Text size="sm" fw={600}>TOEIC 700+ · TOEIC-2609</Text><Text size="xs" c="dimmed">Ngày mai · 19:45–21:15 · Minh Tuấn</Text></div><Group gap="xs"><UiStatusBadge role="neutral">Trực tiếp</UiStatusBadge><UiButton component="a" href="/student/classes/toeic-2609" size="compact-xs" variant="subtle">Mở lớp</UiButton></Group></Group></Stack>
        </Paper>
      </SimpleGrid>
      <Paper component="section" className="panel studentOverviewPanel" p="md" withBorder>
        <Group justify="space-between"><div><Text fw={700}>Việc cần xử lý</Text><Text size="xs" c="dimmed">Ưu tiên hoàn thành trước hạn</Text></div><UiButton component="a" href="/student/homework" size="compact-xs" variant="subtle">Mở danh sách</UiButton></Group>
        <Stack gap={0} mt="sm"><Group justify="space-between" py="sm" style={{ borderBottom: "1px solid var(--app-border)" }}><Group gap="sm"><ClipboardCheck size={18} /><div><Text size="sm" fw={600}>Unit 5 · Listening clinic</Text><Text size="xs" c="dimmed">IF-2609 · Hạn nộp 26/08</Text></div></Group><Group gap="xs"><UiStatusBadge role="warning">Sắp đến hạn</UiStatusBadge><UiButton component="a" href="/student/homework" size="compact-xs" variant="subtle">Mở bài</UiButton></Group></Group><Group justify="space-between" py="sm" style={{ borderBottom: "1px solid var(--app-border)" }}><Group gap="sm"><WalletCards size={18} /><div><Text size="sm" fw={600}>Học phí kỳ 02</Text><Text size="xs" c="dimmed">IF-2609 · Còn 2.000.000đ · hạn 30/08</Text></div></Group><UiButton component="a" href="/student/billing" size="compact-xs" variant="subtle">Xem hóa đơn</UiButton></Group></Stack>
      </Paper>
    </> : null}
    <Group justify="space-between" align="flex-end" mt={isProgress ? 0 : "xl"} mb="sm"><div><Text fw={700} fz="lg">{isProgress ? "Tiến độ theo lớp" : "Tóm tắt theo lớp"}</Text><Text size="sm" c="dimmed">Điểm, điểm danh, học phí và bài tập được gom trong cùng một bảng.</Text></div><PageToolbar className="toolbar"><UiTextInput aria-label="Tìm kiếm lớp học" value={query} onChange={(e) => setQuery(e.currentTarget.value)} style={{ minWidth: 260 }} leftSection={<Search size={16} />} placeholder="Tìm lớp, lịch, bài tập..." /></PageToolbar></Group>
    <UiDataTable table={table} columnCount={columns.length} minWidth={1320} emptyTitle="Không tìm thấy dữ liệu học tập phù hợp." />
    <Text size="xs" c="dimmed" mt="sm">{table.getRowModel().rows.length}/{rows.length} lớp · Chỉ hiển thị dữ liệu đã được công bố trong phạm vi học viên.</Text>
  </div>;
}
