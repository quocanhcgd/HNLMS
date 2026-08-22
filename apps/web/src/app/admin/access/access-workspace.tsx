"use client";
import { useMemo, useState } from "react";
import { type ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Box, Button, Card, Checkbox, Divider, Group, SegmentedControl, Stack, Text, Title } from "@mantine/core";
import { ArrowRight, LockKeyhole, Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UiBadge, UiButton, UiDataTable, UiStatusBadge, type UiStatusRole } from "@/components/ui";
import { accessNavigation, accessPermissionGroups, accessUsers, type AccessSection } from "./access-data";

type ScopeGrantRow = {
  userName: string;
  userEmail?: string;
  scopeType: string;
  target: string;
  status: string;
  role: UiStatusRole;
};

export function AccessWorkspace() {
  const [section, setSection] = useState<AccessSection>("roles");
  const [selectedUser, setSelectedUser] = useState<string>(accessUsers[0].id);
  const user = accessUsers.find((item) => item.id === selectedUser) ?? accessUsers[0];
  const grantRows = useMemo<ScopeGrantRow[]>(
    () => [
      {
        userName: user.name,
        userEmail: user.email,
        scopeType: "Chi nhánh",
        target: "Cơ sở Cầu Giấy",
        status: "Đang hiệu lực",
        role: "success",
      },
      {
        userName: "Trần Hoàng Nam",
        scopeType: "Lớp",
        target: "IELTS Foundation A1",
        status: "Có thời hạn",
        role: "warning",
      },
    ],
    [user.email, user.name],
  );
  const grantColumns = useMemo<ColumnDef<ScopeGrantRow>[]>(
    () => [
      {
        accessorKey: "userName",
        header: "Người dùng",
        cell: ({ row }) => (
          <div>
            <Text fw={600} size="sm">
              {row.original.userName}
            </Text>
            {row.original.userEmail ? (
              <Text size="xs" c="dimmed">
                {row.original.userEmail}
              </Text>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "scopeType",
        header: "Loại phạm vi",
        cell: ({ getValue }) => <UiBadge variant="light">{String(getValue())}</UiBadge>,
      },
      { accessorKey: "target", header: "Đối tượng" },
      {
        accessorKey: "status",
        header: "Hiệu lực",
        cell: ({ row }) => (
          <UiStatusBadge role={row.original.role} variant="dot">
            {row.original.status}
          </UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <Button variant="subtle" size="xs" rightSection={<ArrowRight size={14} />}>
            Chi tiết
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [],
  );
  const grantsTable = useReactTable({ data: grantRows, columns: grantColumns, getCoreRowModel: getCoreRowModel() });
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
                    <UiBadge variant="light">{item.role}</UiBadge>
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
                <UiStatusBadge role="primary" size="lg">
                  {user.role}
                </UiStatusBadge>
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
            <UiDataTable table={grantsTable} columnCount={grantColumns.length} minWidth={700} />
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
