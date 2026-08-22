"use client";
import { useState } from "react";
import {
  Alert,
  Badge,
  Card,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { BookOpen, CalendarClock, GraduationCap, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton, UiSelect } from "@/components/ui";

type Section = "programs" | "classes";
const programs = [
  { department: "Ngoại ngữ", code: "IELTS", name: "Lộ trình IELTS", status: "Đã công bố", version: 2 },
  { department: "Kỹ năng", code: "BIZ", name: "Tiếng Anh doanh nghiệp", status: "Bản nháp", version: 1 },
];
const classes = [
  {
    program: "IELTS Foundation",
    code: "IF-2609",
    branch: "Cầu Giấy",
    modality: "Trực tiếp",
    capacity: 12,
    enrolled: 11,
    teacher: "Lan Anh",
    schedule: "T2/T4/T6 · 18:00-19:30",
    status: "Mở tuyển sinh",
  },
  {
    program: "IELTS Advanced",
    code: "IA-2610",
    branch: "Hai Bà Trưng",
    modality: "Kết hợp",
    capacity: 15,
    enrolled: 14,
    teacher: "Mai Chi",
    schedule: "T7 · 09:00-11:30",
    status: "Sắp khai giảng",
  },
  {
    program: "Giao tiếp doanh nghiệp",
    code: "BIZ-2608",
    branch: "Online",
    modality: "Trực tuyến",
    capacity: 20,
    enrolled: 20,
    teacher: "Quốc Huy",
    schedule: "T3/T5 · 12:30-13:15",
    status: "Đủ chỗ",
  },
];

export function AcademicWorkspace({ initialSection = "programs" }: { initialSection?: Section }) {
  const [section, setSection] = useState<Section>(initialSection);
  const [feedback, setFeedback] = useState("");
  const [programName, setProgramName] = useState("");
  const [className, setClassName] = useState("");
  const [capacity, setCapacity] = useState<number | string>(12);
  return (
    <div className="page">
      <PageHeader
        title="Quản lý đào tạo"
        subtitle="Quản lý chương trình, khóa học, học phần, lớp học và lịch học theo chi nhánh."
        action="Tạo chương trình"
      />
      {feedback ? (
        <Alert color="teal" mb="md" title="Cập nhật đào tạo" withCloseButton onClose={() => setFeedback("")}>
          {feedback}
        </Alert>
      ) : null}
      <Group mb="lg">
        <UiButton
          variant={section === "programs" ? "filled" : "default"}
          leftSection={<BookOpen size={16} />}
          onClick={() => setSection("programs")}
        >
          Chương trình và học phần
        </UiButton>
        <UiButton
          variant={section === "classes" ? "filled" : "default"}
          leftSection={<GraduationCap size={16} />}
          onClick={() => setSection("classes")}
        >
          Lớp học và lịch
        </UiButton>
      </Group>
      {section === "programs" ? (
        <Stack>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Chương trình đào tạo</Title>
                <Text c="dimmed" size="sm">
                  Quản lý ngành, chương trình, khóa học và học phần.
                </Text>
              </div>
              <UiButton
                leftSection={<Plus size={16} />}
                onClick={() => {
                  setProgramName("Lộ trình giao tiếp cơ bản");
                  setFeedback("Đã tạo bản nháp chương trình mới.");
                }}
              >
                Tạo chương trình
              </UiButton>
            </Group>
            <Table.ScrollContainer minWidth={760}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Ngành</Table.Th>
                    <Table.Th>Mã</Table.Th>
                    <Table.Th>Chương trình</Table.Th>
                    <Table.Th>Phiên bản</Table.Th>
                    <Table.Th>Trạng thái</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {programs.map((item) => (
                    <Table.Tr key={item.code}>
                      <Table.Td>{item.department}</Table.Td>
                      <Table.Td>{item.code}</Table.Td>
                      <Table.Td>
                        <Text fw={600}>{item.name}</Text>
                        <Text size="xs" c="dimmed">
                          Mục tiêu, học phần, điều kiện hoàn thành
                        </Text>
                      </Table.Td>
                      <Table.Td>v{item.version}</Table.Td>
                      <Table.Td>
                        <Badge color={item.status === "Đã công bố" ? "teal" : "yellow"}>{item.status}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
          <SimpleGrid cols={{ base: 1, md: 3 }}>
            <Card withBorder>
              <Text size="xs" c="dimmed">
                Ngành đào tạo
              </Text>
              <Title order={2}>4</Title>
            </Card>
            <Card withBorder>
              <Text size="xs" c="dimmed">
                Chương trình đã công bố
              </Text>
              <Title order={2}>12</Title>
            </Card>
            <Card withBorder>
              <Text size="xs" c="dimmed">
                Học phần đang sử dụng
              </Text>
              <Title order={2}>68</Title>
            </Card>
          </SimpleGrid>
        </Stack>
      ) : (
        <Stack>
          <Card withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Lớp học đang quản lý</Title>
                <Text c="dimmed" size="sm">
                  Mở lớp, gán giảng viên, sức chứa và trạng thái tuyển sinh.
                </Text>
              </div>
              <UiButton
                leftSection={<Plus size={16} />}
                onClick={() => {
                  setClassName("Lớp IELTS Foundation tháng 10");
                  setFeedback("Đã tạo lớp ở trạng thái mở tuyển sinh.");
                }}
              >
                Mở lớp mới
              </UiButton>
            </Group>
            <Group mb="md">
              <UiSelect
                aria-label="Lọc chi nhánh"
                placeholder="Tất cả chi nhánh"
                data={["Tất cả chi nhánh", "Cầu Giấy", "Hai Bà Trưng", "Online"]}
              />
              <Select label="Hình thức" placeholder="Tất cả hình thức" data={["Trực tiếp", "Trực tuyến", "Kết hợp"]} />
              <NumberInput label="Sức chứa lớp mới" value={capacity} onChange={setCapacity} min={1} />
              <TextInput
                label="Tên lớp mẫu"
                value={className}
                onChange={(event) => setClassName(event.currentTarget.value)}
                placeholder="Ví dụ: IELTS Foundation tháng 10"
              />
            </Group>
            <Table.ScrollContainer minWidth={1050}>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Khóa học</Table.Th>
                    <Table.Th>Lớp</Table.Th>
                    <Table.Th>Chi nhánh</Table.Th>
                    <Table.Th>Lịch học</Table.Th>
                    <Table.Th>Giảng viên</Table.Th>
                    <Table.Th>Sức chứa</Table.Th>
                    <Table.Th>Trạng thái</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {classes.map((item) => (
                    <Table.Tr key={item.code}>
                      <Table.Td>{item.program}</Table.Td>
                      <Table.Td>
                        <Text fw={600}>{item.code}</Text>
                      </Table.Td>
                      <Table.Td>
                        {item.branch}
                        <Text size="xs" c="dimmed">
                          {item.modality}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <CalendarClock size={15} />
                          {item.schedule}
                        </Group>
                      </Table.Td>
                      <Table.Td>{item.teacher}</Table.Td>
                      <Table.Td>
                        {item.enrolled}/{item.capacity}
                      </Table.Td>
                      <Table.Td>
                        <Badge color={item.status === "Đủ chỗ" ? "gray" : "teal"}>{item.status}</Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
          <Alert color="yellow" title="Kiểm tra xung đột lịch">
            Lịch mới sẽ được kiểm tra trùng giảng viên, phòng học và buổi học trực tuyến trước khi xác nhận.
          </Alert>
        </Stack>
      )}
    </div>
  );
}
