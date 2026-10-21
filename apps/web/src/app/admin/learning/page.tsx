import { BookOpen, Files, Library, ArrowRight } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiStatusBadge } from "@/components/ui";

const workspaces = [
  {
    title: "Nội dung học tập",
    description: "Soạn, rà soát và công bố học liệu theo môn, lớp và từng buổi học.",
    href: "/admin/learning/content",
    label: "Mở nội dung",
    icon: Files,
    color: "blue",
    metric: "24 học liệu",
  },
  {
    title: "Thư viện quản trị",
    description: "Quản lý tài nguyên dùng chung, quyền xem trực tuyến và phạm vi khai thác.",
    href: "/admin/learning/library",
    label: "Mở thư viện",
    icon: Library,
    color: "violet",
    metric: "18 tài nguyên",
  },
] as const;

export default function LearningAdminPage() {
  return (
    <div className="page">
      <PageHeader
        title="Quản trị học liệu"
        subtitle="Điều hành nội dung và tài nguyên học tập trong một luồng thống nhất, từ soạn thảo đến công bố."
      />

      <Paper withBorder p="lg" mb="md" className="panelHighlight">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
          <Group gap="md" wrap="nowrap">
            <ThemeIcon size={48} radius="md" color="primary">
              <BookOpen size={24} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">Trung tâm học liệu</Text>
              <Text fz={27} fw={800}>Sẵn sàng cho lớp học</Text>
              <Text size="sm" c="dimmed" mt={4}>
                Theo dõi trạng thái kiểm duyệt, phạm vi truy cập và liên kết học liệu theo từng buổi.
              </Text>
            </div>
          </Group>
          <UiStatusBadge role="success" variant="dot">Đồng bộ nghiệp vụ</UiStatusBadge>
        </Group>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <Metric label="Học liệu đang dùng" value="24" detail="đã gắn vào lớp học" />
        <Metric label="Chờ duyệt" value="5" detail="cần kiểm tra trước khi công bố" />
        <Metric label="Tài nguyên thư viện" value="18" detail="được phân quyền xem" />
        <Metric label="Buổi học đã gắn" value="36" detail="có học liệu tương ứng" />
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, md: 2 }}>
        {workspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <Paper key={workspace.href} withBorder p="lg" className="panel">
              <Stack gap="md">
                <Group justify="space-between" align="flex-start">
                  <ThemeIcon size={42} radius="md" color={workspace.color} variant="light"><Icon size={21} /></ThemeIcon>
                  <UiStatusBadge role="info">{workspace.metric}</UiStatusBadge>
                </Group>
                <div>
                  <Text fw={750} fz={19}>{workspace.title}</Text>
                  <Text size="sm" c="dimmed" mt={5}>{workspace.description}</Text>
                </div>
                <UiButton component="a" href={workspace.href} variant="light" rightSection={<ArrowRight size={15} />}>
                  {workspace.label}
                </UiButton>
              </Stack>
            </Paper>
          );
        })}
      </SimpleGrid>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Paper className="panel" p="md" withBorder>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text fz={22} fw={780}>{value}</Text>
      <Text size="xs" c="dimmed">{detail}</Text>
    </Paper>
  );
}
