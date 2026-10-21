"use client";

import { Badge, Group, Paper, Progress, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import {
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiStatusBadge } from "@/components/ui";

const tasks = [
  {
    title: "Trước buổi dạy",
    detail: "IF-2609 · chuẩn bị 5 loại học liệu",
    state: "Cần chuẩn bị",
    role: "warning" as const,
    icon: Clock3,
    color: "orange",
    href: "/teacher/content",
  },
  {
    title: "Trong buổi dạy",
    detail: "Điểm danh và chấm bài trên lớp",
    state: "Chưa bắt đầu",
    role: "info" as const,
    icon: BookOpenCheck,
    color: "blue",
    href: "/teacher/classes/if-2609/sessions",
  },
  {
    title: "Sau buổi dạy",
    detail: "Chấm bài về nhà và xác nhận worklog",
    state: "3 việc cần xử lý",
    role: "warning" as const,
    icon: FileCheck,
    color: "violet",
    href: "/teacher/worklog",
  },
  {
    title: "Công & lương",
    detail: "18 giờ lớp · phiếu lương tháng 08",
    state: "Đã công bố",
    role: "success" as const,
    icon: Wallet,
    color: "teal",
    href: "/teacher/payroll",
  },
];

export default function TeacherPage() {
  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title="Tổng quan giảng dạy"
        subtitle="Những việc giáo viên cần hoàn thành trước, trong và sau mỗi buổi dạy."
      />
      <Paper
        withBorder
        p="lg"
        mb="md"
        className="teacher-overview"
        style={{
          background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))",
          borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group align="flex-start" gap="md">
            <ThemeIcon size={48} radius="md" color="blue">
              <CalendarClock size={25} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">
                Nhịp giảng dạy hôm nay
              </Text>
              <Text fz={32} fw={800} lh={1.1}>
                2 buổi học cần theo dõi
              </Text>
              <Group gap="xs" mt={6}>
                <Badge color="orange" variant="light">
                  1 việc cần chuẩn bị
                </Badge>
                <Text size="xs" c="dimmed">
                  Cập nhật theo lớp được phân công
                </Text>
              </Group>
            </div>
          </Group>
          <div className="teacher-overview-summary">
            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  Lớp phụ trách
                </Text>
                <Text fw={750}>3</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Học viên
                </Text>
                <Text fw={750}>46</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Tiến độ tuần
                </Text>
                <Text fw={750} c="teal">
                  82%
                </Text>
              </div>
            </Group>
            <Progress value={82} color="teal" size="sm" mt="md" />
          </div>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
          <Metric
          icon={<CalendarClock size={18} />}
          label="Buổi dạy tuần này"
          value="8"
          detail="2 buổi hôm nay"
          color="blue"
          href="/teacher/worklog"
        />
        <Metric
          icon={<ClipboardCheck size={18} />}
          label="Bài cần chấm"
          value="12"
          detail="4 bài quá hạn"
          color="orange"
          href="/teacher/classes/if-2609/assignments"
        />
        <Metric icon={<CheckCircle2 size={18} />} label="Điểm danh" value="44/46" detail="96% học viên" color="teal" href="/teacher/classes/if-2609/attendance" />
        <Metric
          icon={<Sparkles size={18} />}
          label="Học liệu công bố"
          value="9"
          detail="2 bản đang duyệt"
          color="violet"
          href="/teacher/content"
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Paper className="panel teacher-task" p="lg" withBorder key={task.title}>
              <Group justify="space-between" align="flex-start">
                <Group gap="sm">
                  <ThemeIcon color={task.color} variant="light" size={38}>
                    <Icon size={19} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700}>{task.title}</Text>
                    <Text size="sm" c="dimmed">
                      {task.detail}
                    </Text>
                  </div>
                </Group>
                <UiStatusBadge role={task.role}>{task.state}</UiStatusBadge>
              </Group>
              <Progress
                value={task.role === "success" ? 100 : task.role === "warning" ? 58 : 18}
                color={task.color}
                size="sm"
                mt="lg"
              />
              <Group justify="space-between" mt="xs">
                <Text size="xs" c="dimmed">
                  Tiến độ công việc
                </Text>
                <Text size="xs" fw={650}>
                  {task.role === "success" ? "Hoàn tất" : task.role === "warning" ? "Cần hành động" : "Sẵn sàng"}
                </Text>
              </Group>
              <Group justify="flex-end" mt="sm">
                <UiButton component="a" href={task.href} size="compact-xs" variant="subtle">
                  Mở chức năng
                </UiButton>
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>
      <Paper className="panelHighlight" p="md" mt="md">
        <Group justify="space-between" wrap="wrap">
          <Group gap="sm">
            <ThemeIcon variant="light" color="blue">
              <CalendarClock size={17} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">
                Lịch tiếp theo
              </Text>
              <Text fw={650}>IF-2609 · Listening clinic · Hôm nay 18:00</Text>
            </div>
          </Group>
          <UiButton component="a" href="/teacher/classes/if-2609" variant="default">
            Mở lớp
          </UiButton>
        </Group>
      </Paper>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
  href: string;
}) {
  return (
    <Paper component="a" href={href} className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}>
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon color={color} variant="light" size={36} radius="md">
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text fz={21} fw={750}>
            {value}
          </Text>
          <Text size="xs" c="dimmed">
            {detail}
          </Text>
        </div>
      </Group>
    </Paper>
  );
}
