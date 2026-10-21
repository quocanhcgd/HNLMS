"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { AlertTriangle, Bell, BookOpen, CreditCard, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiStatusBadge, UiTextInput } from "@/components/ui";

type Row = {
  studentId: string;
  student: string;
  classId: string;
  classCode: string;
  schedule: string;
  progress: number;
  score: string;
  tuition: string;
  homework: string;
  delegation: "Đang hiệu lực" | "Sắp hết hạn";
};
const rows: Row[] = [
  {
    studentId: "student-minh-anh",
    student: "Nguyễn Minh Anh",
    classId: "if-2609",
    classCode: "IF-2609",
    schedule: "T2/T4/T6 · 18:00",
    progress: 62,
    score: "8.1/10",
    tuition: "Còn 2.000.000đ",
    homework: "Unit 5 · hạn 26/08",
    delegation: "Đang hiệu lực",
  },
  {
    studentId: "student-minh-anh",
    student: "Nguyễn Minh Anh",
    classId: "toeic-2609",
    classCode: "TOEIC-2609",
    schedule: "T2/T5 · 19:45",
    progress: 18,
    score: "560/990",
    tuition: "Đã hoàn tất",
    homework: "Mini test 2",
    delegation: "Sắp hết hạn",
  },
];

export function ParentPortalWorkspace() {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () => rows.filter((x) => JSON.stringify(x).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "student",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.student}</Text>
            <Text size="xs" c="dimmed">
              {row.original.classCode}
            </Text>
          </div>
        ),
      },
      { accessorKey: "schedule", header: "Lịch học" },
      {
        accessorKey: "progress",
        header: "Tiến độ",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge>,
      },
      { accessorKey: "score", header: "Điểm" },
      { accessorKey: "tuition", header: "Học phí" },
      { accessorKey: "homework", header: "Bài tập" },
      {
        accessorKey: "delegation",
        header: "Ủy quyền",
        cell: ({ getValue }) => {
          const value = getValue<Row["delegation"]>();
          return <UiStatusBadge role={value === "Đang hiệu lực" ? "success" : "warning"}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap="xs" wrap="nowrap">
            <UiButton component={Link} href={`/parent/classes/${row.original.classId}`} size="compact-xs" variant="default">
              Xem lớp
            </UiButton>
            <UiButton
              component={Link}
              href={`/parent/conversations?student=${row.original.studentId}&classId=${row.original.classId}`}
              size="compact-xs"
              variant="subtle"
              leftSection={<MessageCircle size={14} />}
            >
              Trao đổi
            </UiButton>
            <UiButton component={Link} href={`/parent/classes?student=${row.original.studentId}`} size="compact-xs" variant="subtle">
              Các lớp của con
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
        title="Cổng phụ huynh"
        subtitle="Theo dõi lịch học, tiến độ, điểm, học phí và bài tập theo phạm vi ủy quyền từng học viên."
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Paper component={Link} href="/parent/students" className="classInfoCard classInfoCard--info" p="md">
          <Text className="classInfoLabel">HỌC VIÊN ĐƯỢC THEO DÕI</Text>
          <Text className="classInfoValue" fw={700}>
            2
          </Text>
        </Paper>
        <Paper component={Link} href="/parent/notifications" className="classInfoCard classInfoCard--warning" p="md">
          <Text className="classInfoLabel">VIỆC CẦN LƯU Ý</Text>
          <Text className="classInfoValue" fw={700}>
            3
          </Text>
        </Paper>
        <Paper component={Link} href="/parent/classes" className="classInfoCard classInfoCard--success" p="md">
          <Text className="classInfoLabel">TỶ LỆ THAM DỰ</Text>
          <Text className="classInfoValue" fw={700}>
            87,5%
          </Text>
        </Paper>
      </SimpleGrid>
      <Paper className="classInfoCallout" p="md" mb="md">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <Group gap="sm" align="flex-start" wrap="nowrap">
            <AlertTriangle size={18} />
            <Stack gap={2}>
              <Text fw={600}>Việc cần xử lý</Text>
              <Text size="sm" c="dimmed">Có bài tập sắp đến hạn và một hóa đơn chưa hoàn tất trong phạm vi theo dõi.</Text>
            </Stack>
          </Group>
          <Group gap="xs">
            <UiButton component={Link} href="/parent/classes/if-2609" size="compact-xs" variant="default" leftSection={<BookOpen size={14} />}>
              Xem bài tập
            </UiButton>
            <UiButton component={Link} href="/parent/payments?student=student-minh-anh" size="compact-xs" variant="subtle" leftSection={<CreditCard size={14} />}>
              Xem học phí
            </UiButton>
            <UiButton component={Link} href="/parent/notifications?student=student-minh-anh" size="compact-xs" variant="subtle" leftSection={<Bell size={14} />}>
              Xem thông báo
            </UiButton>
          </Group>
        </Group>
      </Paper>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, học phí..."
        />
      </PageToolbar>
      <Paper className="panel parentTablePanel" p="md" withBorder>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1160}
          emptyTitle="Không tìm thấy dữ liệu phụ huynh phù hợp."
        />
      </Paper>
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length}/{rows.length} bản ghi · không tạo layout/bảng riêng.
      </Text>
    </div>
  );
}
