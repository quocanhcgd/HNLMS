"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, CircleDollarSign, ClipboardCheck, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { readDemoSession, type DemoSession } from "@/lib/demo-auth";

const operations = [
  { href: "/admin/admission", title: "Tuyển sinh cơ sở", description: "Theo dõi lead, phân công tư vấn và bàn giao học viên trong phạm vi cơ sở.", icon: UsersRound, color: "blue" },
  { href: "/admin/academic/classes", title: "Lớp học & buổi học", description: "Điều phối lớp, lịch học, sĩ số và tình trạng vận hành từng buổi.", icon: BookOpen, color: "teal" },
  { href: "/admin/academic/students", title: "Học viên cơ sở", description: "Tra cứu hồ sơ học viên đang thuộc các lớp của cơ sở.", icon: ClipboardCheck, color: "violet" },
  { href: "/admin/academic/teacher-assignments", title: "Phân công giảng dạy", description: "Kiểm tra giáo viên, tải dạy và thay thế theo lịch cơ sở.", icon: BriefcaseBusiness, color: "orange" },
  { href: "/admin/hrm", title: "Nhân sự cơ sở", description: "Xem nhân sự, tải làm việc và xử lý đơn nghỉ được phân quyền.", icon: UsersRound, color: "indigo" },
  { href: "/admin/finance/branch-finance", title: "Tài chính cơ sở", description: "Theo dõi ngân sách, thu chi và đối soát theo chi nhánh.", icon: CircleDollarSign, color: "green" },
  { href: "/admin/reporting", title: "Báo cáo vận hành", description: "Xem chỉ số và xuất báo cáo đã lọc theo phạm vi cơ sở.", icon: Building2, color: "cyan" },
];

const branchNames: Record<string, string> = { b1: "Cầu Giấy", b2: "Hai Bà Trưng" };

export default function BranchOperationsPage() {
  const [session, setSession] = useState<DemoSession | null>(null);
  useEffect(() => { setSession(readDemoSession()); }, []);
  const branch = session?.branchId ? branchNames[session.branchId] ?? session.branchId : "Cơ sở được phân quyền";
  return (
    <div className="page">
      <PageHeader title="Vận hành cơ sở" subtitle="Điểm điều phối các công việc hằng ngày của cơ sở, với dữ liệu và thao tác được giới hạn theo phạm vi phân quyền." />
      <Paper withBorder p="md" mb="md" className="panel">
        <Group justify="space-between" wrap="wrap"><div><Text size="sm" c="dimmed">Phạm vi đang làm việc</Text><Text fw={750} size="lg">{branch}</Text></div><Badge color="teal" variant="light">Chỉ dữ liệu cơ sở</Badge></Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {operations.map(({ href, title, description, icon: Icon, color }) => <Paper key={href} component={Link} href={href} withBorder p="md" className="panel" style={{ textDecoration: "none", color: "inherit" }}><Stack gap="sm"><Group justify="space-between"><ThemeIcon color={color} variant="light" size={38}><Icon size={20} /></ThemeIcon><ArrowRight size={18} /></Group><div><Text fw={700}>{title}</Text><Text size="sm" c="dimmed" mt={4}>{description}</Text></div></Stack></Paper>)}
      </SimpleGrid>
      <Text size="xs" c="dimmed" mt="lg">Các chức năng quản trị toàn tổ chức như bảng lương tổng, cấu hình hệ thống và dữ liệu ngoài cơ sở không thuộc vai trò này.</Text>
    </div>
  );
}
