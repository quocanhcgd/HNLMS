"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { GraduationCap, Search } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type StudentRow = {
  id: string;
  name: string;
  relation: string;
  classes: string;
  progress: number;
  attendance: string;
  status: "Đang học" | "Sắp khai giảng";
  permissions: string[];
  effectiveTo: string;
};
const initialRows: StudentRow[] = [
  {
    id: "student-minh-anh",
    name: "Nguyễn Minh Anh",
    relation: "Con",
    classes: "IF-2609 · TOEIC-2609",
    progress: 62,
    attendance: "14/16 buổi",
    status: "Đang học",
    permissions: ["Lớp & lịch học", "Tiến độ", "Điểm & nhận xét", "Điểm danh", "Hồ sơ năng lực", "Trao đổi giáo viên", "Học phí"],
    effectiveTo: "31/12/2026",
  },
  {
    id: "student-gia-huy",
    name: "Trần Gia Huy",
    relation: "Con",
    classes: "MATH-2609",
    progress: 18,
    attendance: "4/5 buổi",
    status: "Đang học",
    permissions: ["Lớp & lịch học", "Tiến độ", "Điểm & nhận xét", "Điểm danh", "Trao đổi giáo viên"],
    effectiveTo: "30/09/2026",
  },
];

export default function ParentStudentsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<StudentRow | null>(null);
  const data = useMemo(
    () =>
      initialRows.filter(
        (row) =>
          (status === "all" || !status || row.status === status) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, status],
  );
  const columns = useMemo<ColumnDef<StudentRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Học viên",
        cell: ({ row }) => (
          <Group gap="sm" wrap="nowrap">
            <GraduationCap size={18} />
            <div>
              <Text fw={600}>{row.original.name}</Text>
              <Text size="xs" c="dimmed">
                {row.original.relation} · {row.original.id}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "classes", header: "Lớp đang theo học" },
      {
        accessorKey: "progress",
        header: "Tiến độ",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge>,
      },
      { accessorKey: "attendance", header: "Điểm danh" },
      {
        id: "delegation",
        header: "Phạm vi ủy quyền",
        cell: ({ row }) => (
          <div>
            <UiStatusBadge role={row.original.effectiveTo === "30/09/2026" ? "warning" : "success"}>
              {row.original.permissions.length} quyền đang hiệu lực
            </UiStatusBadge>
            <Text size="xs" c="dimmed" mt={4}>
              Đến {row.original.effectiveTo}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiStatusBadge role={getValue() === "Đang học" ? "success" : "warning"}>{getValue<string>()}</UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            <UiButton
              component={Link}
              href={`/parent/classes?student=${row.original.id}`}
              size="compact-xs"
              variant="default"
            >
              Xem lớp
            </UiButton>
            <UiButton size="compact-xs" variant="subtle" onClick={() => setSelected(row.original)}>
              Hồ sơ
            </UiButton>
          </Group>
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className="page">
      <PageHeader
        title="Học viên được ủy quyền"
        subtitle="Danh sách học viên phụ huynh được phép theo dõi theo từng tập quyền."
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Paper className="classInfoCard classInfoCard--info" p="md">
          <Text className="classInfoLabel">HỌC VIÊN</Text>
          <Text className="classInfoValue" fw={700}>
            {initialRows.length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--success" p="md">
          <Text className="classInfoLabel">ĐANG HỌC</Text>
          <Text className="classInfoValue" fw={700}>
            {initialRows.filter((row) => row.status === "Đang học").length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--warning" p="md">
          <Text className="classInfoLabel">CẦN THEO DÕI</Text>
          <Text className="classInfoValue" fw={700}>
            2
          </Text>
        </Paper>
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm học viên"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm tên, mã học viên, lớp..."
          style={{ minWidth: 290 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái"
          w={180}
          value={status}
          onChange={setStatus}
          data={[{ value: "all", label: "Tất cả trạng thái" }, "Đang học", "Sắp khai giảng"]}
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1210}
        emptyTitle="Không tìm thấy học viên phù hợp."
      />
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Hồ sơ theo dõi · ${selected.name}` : "Hồ sơ học viên"}
      >
        {selected ? (
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={700}>{selected.classes}</Text>
              <UiStatusBadge role="success">{selected.status}</UiStatusBadge>
            </Group>
            <Paper className="panelHighlight" p="md">
              <Text size="sm">
                Tiến độ khóa đang theo dõi: <strong>{selected.progress}%</strong>
              </Text>
              <Text size="sm" mt="xs">
                Điểm danh: <strong>{selected.attendance}</strong>
              </Text>
            </Paper>
            <Text size="sm" c="dimmed">
              Các quyền được cấp riêng cho học viên này; thay đổi hoặc gia hạn do trung tâm xác thực với phụ huynh.
            </Text>
            <Paper className="panelHighlight" p="md">
              <Text size="xs" c="dimmed" mb={6}>
                QUYỀN ĐANG HIỆU LỰC ĐẾN {selected.effectiveTo}
              </Text>
              <Group gap="xs">
                {selected.permissions.map((permission) => (
                  <UiStatusBadge key={permission} role="success">
                    {permission}
                  </UiStatusBadge>
                ))}
              </Group>
            </Paper>
            <Group justify="flex-end">
              <UiButton component={Link} href={`/parent/classes?student=${selected.id}`} variant="default">
                Mở lớp học
              </UiButton>
              {selected.permissions.includes("Hồ sơ năng lực") ? (
                <UiButton component={Link} href={`/parent/competency?student=${selected.id}`} variant="subtle">
                  Mở năng lực
                </UiButton>
              ) : null}
              <UiButton onClick={() => setSelected(null)}>Đóng</UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
