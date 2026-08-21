"use client";
import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { ArrowRight, LockKeyhole, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiButton } from "@/components/ui";
import { accessNavigation, accessPermissionGroups, accessUsers, type AccessSection } from "./access-data";

export function AccessWorkspace() {
  const [section, setSection] = useState<AccessSection>("roles");
  const [selectedUser, setSelectedUser] = useState<string>(accessUsers[0].id);
  const user = accessUsers.find((item) => item.id === selectedUser) ?? accessUsers[0];
  return (
    <div className="page">
      <PageHeader
        title="Quyền truy cập"
        subtitle="Gán vai trò và phạm vi dữ liệu an toàn theo tổ chức."
        action="Lưu thay đổi"
      />
      <Box maw={1180}>
        <SegmentedControl
          fullWidth
          mb="xl"
          value={section}
          onChange={(value) => setSection(value as AccessSection)}
          data={accessNavigation.map(({ key, label }) => ({ value: key, label }))}
        />
        {section === "roles" ? (
          <div className="dashboardGrid">
            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={3}>Người dùng</Title>
                  <Text size="sm" c="dimmed">
                    Chọn người dùng để cấu hình quyền.
                  </Text>
                </div>
                <UiButton leftSection={<Plus size={15} />}>Mời người dùng</UiButton>
              </Group>
              <Stack gap={0}>
                {accessUsers.map((item) => (
                  <Button
                    key={item.id}
                    variant={selectedUser === item.id ? "light" : "subtle"}
                    color={selectedUser === item.id ? "cyan" : "gray"}
                    justify="space-between"
                    fullWidth
                    h="auto"
                    py="sm"
                    onClick={() => setSelectedUser(item.id)}
                  >
                    <Box ta="left">
                      <Text size="sm" fw={600}>
                        {item.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.email}
                      </Text>
                    </Box>
                    <Badge variant="light">{item.role}</Badge>
                  </Button>
                ))}
              </Stack>
            </Card>
            <Card withBorder radius="md" padding="lg">
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={3}>{user.name}</Title>
                  <Text size="sm" c="dimmed">
                    Vai trò quyết định chức năng; phạm vi quyết định dữ liệu.
                  </Text>
                </div>
                <ShieldCheck size={22} />
              </Group>
              <Text size="sm" fw={600} mb="xs">
                Vai trò hiện tại
              </Text>
              <Group mb="lg">
                <Badge color="cyan" size="lg">
                  {user.role}
                </Badge>
                <Text size="sm" c="dimmed">
                  {user.scope}
                </Text>
              </Group>
              <Divider mb="md" />
              <Text size="sm" fw={600} mb="xs">
                Quyền trong vai trò
              </Text>
              <Stack gap="sm">
                {accessPermissionGroups.map((group) => (
                  <Box key={group.key}>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb={4}>
                      {group.label}
                    </Text>
                    <Stack gap={4}>
                      {group.permissions.map((permission) => (
                        <Checkbox key={permission} label={permission} defaultChecked />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Card>
          </div>
        ) : (
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between" mb="md">
              <div>
                <Title order={3}>Phạm vi dữ liệu</Title>
                <Text size="sm" c="dimmed">
                  Các grant có thời hạn sẽ được kiểm tra ở backend trên từng request.
                </Text>
              </div>
              <UiButton leftSection={<Plus size={15} />}>Thêm phạm vi</UiButton>
            </Group>
            <Table.ScrollContainer minWidth={700}>
              <Table verticalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Người dùng</Table.Th>
                    <Table.Th>Loại phạm vi</Table.Th>
                    <Table.Th>Đối tượng</Table.Th>
                    <Table.Th>Hiệu lực</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        {user.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">Chi nhánh</Badge>
                    </Table.Td>
                    <Table.Td>Cơ sở Cầu Giấy</Table.Td>
                    <Table.Td>
                      <Badge color="teal" variant="dot">
                        Đang hiệu lực
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="xs" rightSection={<ArrowRight size={14} />}>
                        Chi tiết
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td>
                      <Text fw={600} size="sm">
                        Trần Hoàng Nam
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light">Lớp</Badge>
                    </Table.Td>
                    <Table.Td>IELTS Foundation A1</Table.Td>
                    <Table.Td>
                      <Badge color="yellow" variant="dot">
                        Có thời hạn
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Button variant="subtle" size="xs" rightSection={<ArrowRight size={14} />}>
                        Chi tiết
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            <Group mt="lg" gap="xs">
              <LockKeyhole size={16} />
              <Text size="xs" c="dimmed">
                UI chỉ là lớp điều khiển. API vẫn bắt buộc organization và scope check.
              </Text>
            </Group>
          </Card>
        )}
      </Box>
    </div>
  );
}
