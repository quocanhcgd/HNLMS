"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { CalendarClock, ClipboardCheck, Edit3, FileCheck2, FileText, MessageCircle, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

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
  return (
    <>
      <Group justify="space-between" mb="md"><div><Text fw={700}>{summary.split(".")[0]}</Text><Text size="sm" c="dimmed">{summary}</Text></div><UiButton variant="default">Làm mới dữ liệu</UiButton></Group>
      <Paper className="panelHighlight" p="lg"><Text fw={700}>Luồng xử lý hiện tại</Text><Text size="sm" c="dimmed" mt="xs">Trước buổi dạy: chuẩn bị học liệu. Trong buổi dạy: điểm danh và chấm bài trên lớp. Sau buổi dạy: chấm bài về nhà, xác nhận worklog và gửi thông tin cho học vụ/payroll.</Text></Paper>
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

function ScheduleTab() {
  const scheduleRows = [
    { day: "Thứ 2", date: "24/08", time: "18:00-19:30", session: "Unit 5 · Listening clinic", mode: "Online", room: "Zoom · Phòng IF-2609", status: "Đã xác nhận" },
    { day: "Thứ 4", date: "26/08", time: "18:00-19:30", session: "Unit 5 · In-class practice", mode: "Tại lớp", room: "Phòng A203", status: "Đã xác nhận" },
    { day: "Thứ 6", date: "28/08", time: "18:00-19:30", session: "Unit 5 · Review & homework", mode: "Online", room: "Zoom · Phòng IF-2609", status: "Chờ học vụ duyệt" },
  ];
  const columns = [
    { accessorKey: "day", header: "Ngày", cell: ({ row }: any) => <div><Text fw={600}>{row.original.day}</Text><Text size="xs" c="dimmed">{row.original.date}</Text></div> },
    { accessorKey: "time", header: "Giờ học" },
    { accessorKey: "session", header: "Nội dung buổi học" },
    { accessorKey: "mode", header: "Hình thức" },
    { accessorKey: "room", header: "Phòng / liên kết" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }: any) => <UiStatusBadge role={getValue() === "Đã xác nhận" ? "success" : "warning"}>{getValue()}</UiStatusBadge> },
  ];
  return <Stack gap="md">
    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm"><Paper className="panelHighlight" p="md"><Text size="sm" c="dimmed">Lịch cố định</Text><Text fw={700}>T2/T4/T6</Text><Text size="sm">18:00-19:30</Text></Paper><Paper className="panelHighlight" p="md"><Text size="sm" c="dimmed">Buổi kế tiếp</Text><Text fw={700}>Thứ 2 · 24/08</Text><Text size="sm">Online · 18:00</Text></Paper><Paper className="panelHighlight" p="md"><Text size="sm" c="dimmed">Phê duyệt</Text><Text fw={700}>2/3 buổi đã xác nhận</Text><Text size="sm">1 buổi chờ học vụ</Text></Paper></SimpleGrid>
    <Group className="toolbar"><UiTextInput aria-label="Tìm buổi học" placeholder="Tìm ngày, nội dung, phòng..." leftSection={<Search size={16} />} /><UiSelect aria-label="Lọc hình thức" w={160} defaultValue="all" data={[{ value: "all", label: "Tất cả hình thức" }, "Online", "Tại lớp"]} /><UiButton variant="default" leftSection={<Edit3 size={16} />}>Đề xuất đổi lịch</UiButton></Group>
    <UiDataTable table={useReactTable({ data: scheduleRows, columns, getCoreRowModel: getCoreRowModel() })} columnCount={columns.length} minWidth={1000} emptyTitle="Chưa có lịch học." />
    <Text size="sm" c="dimmed">Đổi lịch cần ghi rõ lý do, slot thay thế và được học vụ duyệt trước khi thông báo học viên/phụ huynh.</Text>
  </Stack>;
}
