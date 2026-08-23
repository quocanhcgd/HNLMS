"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { CalendarClock, ClipboardCheck, FileCheck2, FileText, MessageCircle, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiStatusBadge } from "@/components/ui";

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

export default function TeacherClassDetailPage() {
  const pathname = usePathname();
  const activeKey = tabs.find((tab) => pathname.endsWith(`/${tab.key}`))?.key ?? "overview";
  const active = tabs.find((tab) => tab.key === activeKey) ?? tabs[1];
  return <div className="page">
    <PageHeader title="IF-2609 · IELTS Foundation A2+" subtitle="Lớp được phân công · 18 học viên · T2/T4/T6 · 18:00-19:30" />
    <Group gap="xs" mb="md" wrap="wrap"><UiStatusBadge role="success">Đang dạy</UiStatusBadge><UiStatusBadge role="warning">Buổi kế tiếp còn thiếu bài tập về nhà</UiStatusBadge></Group>
    <nav className="classDetailTabs" aria-label="Các chức năng của lớp học">{tabs.map((tab) => { const Icon = tab.icon; return <Link key={tab.key} href={`/teacher/classes/if-2609/${tab.key}`} className={`classDetailTab ${tab.key === activeKey ? "active" : ""}`} aria-current={tab.key === activeKey ? "page" : undefined}><Icon size={16}/><span>{tab.label}</span></Link>; })}</nav>
    <Paper className="panel classDetailContent" p="lg" withBorder><Group justify="space-between" mb="md"><div><Text fw={700}>{active.label}</Text><Text size="sm" c="dimmed">{active.summary}</Text></div><UiButton variant="default">Làm mới dữ liệu</UiButton></Group><Paper className="panelHighlight" p="lg"><Text fw={700}>Luồng xử lý hiện tại</Text><Text size="sm" c="dimmed" mt="xs">Trước buổi dạy: chuẩn bị học liệu. Trong buổi dạy: điểm danh và chấm bài trên lớp. Sau buổi dạy: chấm bài về nhà, xác nhận worklog và gửi thông tin cho học vụ/payroll.</Text></Paper><Group mt="lg"><UiButton>Thực hiện hành động chính</UiButton><UiButton variant="default" component={Link} href="/teacher/worklog">Mở worklog buổi dạy</UiButton></Group></Paper>
  </div>;
}
