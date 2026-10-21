"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Bell, Check, Search } from "lucide-react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type NotificationRow = {
  id: string;
  title: string;
  category: "Lịch học" | "Học tập" | "Học phí" | "Trao đổi";
  student: string;
  studentId: string;
  classId?: string;
  createdAt: string;
  read: boolean;
  detail: string;
  relatedHref: string;
  relatedLabel: string;
};
const initialNotifications: NotificationRow[] = [
  {
    id: "n1",
    title: "Buổi học Listening clinic sắp diễn ra",
    category: "Lịch học",
    student: "Nguyễn Minh Anh · IF-2609",
    studentId: "student-minh-anh",
    classId: "if-2609",
    createdAt: "Hôm nay 09:10",
    read: false,
    detail: "Buổi học diễn ra lúc 18:00-19:30 trên Zoom. Phụ huynh có thể xem trạng thái tham dự sau buổi học.",
    relatedHref: "/parent/classes/if-2609",
    relatedLabel: "Mở lớp học",
  },
  {
    id: "n2",
    title: "Giáo viên đã công bố nhận xét mới",
    category: "Học tập",
    student: "Nguyễn Minh Anh · IF-2609",
    studentId: "student-minh-anh",
    classId: "if-2609",
    createdAt: "Hôm qua 16:45",
    read: false,
    detail: "Hồ sơ năng lực đã được cập nhật với nhận xét và minh chứng đã công bố.",
    relatedHref: "/parent/competency?student=student-minh-anh",
    relatedLabel: "Mở hồ sơ năng lực",
  },
  {
    id: "n3",
    title: "Hóa đơn INV-2608-001 đến hạn",
    category: "Học phí",
    student: "Nguyễn Minh Anh",
    studentId: "student-minh-anh",
    createdAt: "20/08/2026",
    read: true,
    detail: "Khoản học phí còn phải thanh toán: 2.000.000đ.",
    relatedHref: "/parent/payments?student=student-minh-anh",
    relatedLabel: "Mở hóa đơn",
  },
  {
    id: "n4",
    title: "Giáo viên đã phản hồi trao đổi",
    category: "Trao đổi",
    student: "Trần Gia Huy · MATH-2609",
    studentId: "student-gia-huy",
    classId: "math-2609",
    createdAt: "19/08/2026",
    read: true,
    detail: "Mở mục Trao đổi với giáo viên để xem nội dung đầy đủ.",
    relatedHref: "/parent/conversations?student=student-gia-huy&classId=math-2609",
    relatedLabel: "Mở trao đổi",
  },
];

export default function ParentNotificationsPage() {
  const [rows, setRows] = useState(initialNotifications);
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<string | null>("all");
  const [category, setCategory] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<NotificationRow | null>(null);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (category === "all" || !category || row.category === category) &&
          (student === "all" || !student || row.studentId === student) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query, rows, student],
  );
  const columns = useMemo<ColumnDef<NotificationRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Thông báo",
        cell: ({ row }) => (
          <Group gap="sm" wrap="nowrap">
            <Bell size={17} />
            <div>
              <Text fw={row.original.read ? 500 : 700}>{row.original.title}</Text>
              <Text size="xs" c="dimmed">
                {row.original.student}
              </Text>
            </div>
          </Group>
        ),
      },
      {
        accessorKey: "category",
        header: "Nhóm",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<string>()}</UiStatusBadge>,
      },
      { accessorKey: "createdAt", header: "Thời gian" },
      {
        accessorKey: "read",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiStatusBadge role={getValue<boolean>() ? "neutral" : "warning"}>
            {getValue<boolean>() ? "Đã đọc" : "Chưa đọc"}
          </UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap="xs">
            <UiButton
              size="compact-xs"
              variant="default"
              onClick={() => {
                setSelected(row.original);
                setRows((value) => value.map((item) => (item.id === row.original.id ? { ...item, read: true } : item)));
              }}
            >
              Xem
            </UiButton>
            {!row.original.read ? (
              <UiButton
                size="compact-xs"
                onClick={() =>
                  setRows((value) =>
                    value.map((item) => (item.id === row.original.id ? { ...item, read: true } : item)),
                  )
                }
                leftSection={<Check size={14} />}
              >
                Đã đọc
              </UiButton>
            ) : null}
            <UiButton
              component={Link}
              href={row.original.relatedHref}
              size="compact-xs"
              variant="subtle"
              onClick={() =>
                setRows((value) =>
                  value.map((item) => (item.id === row.original.id ? { ...item, read: true } : item)),
                )
              }
            >
              {row.original.relatedLabel}
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
        title="Thông báo phụ huynh"
        subtitle="Thông báo về lịch học, học phí, tiến độ và trao đổi theo quyền được ủy quyền."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm thông báo"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm nội dung, học viên..."
          style={{ minWidth: 290 }}
        />
        <UiSelect
          aria-label="Lọc nhóm thông báo"
          w={180}
          value={category}
          onChange={setCategory}
          data={[{ value: "all", label: "Tất cả nhóm" }, "Lịch học", "Học tập", "Học phí", "Trao đổi"]}
        />
        <UiSelect
          aria-label="Lọc học viên"
          w={210}
          value={student}
          onChange={setStudent}
          data={[
            { value: "all", label: "Tất cả học viên" },
            { value: "student-minh-anh", label: "Nguyễn Minh Anh" },
            { value: "student-gia-huy", label: "Trần Gia Huy" },
          ]}
        />
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={1000}
        emptyTitle="Không có thông báo phù hợp."
      />
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.title ?? "Chi tiết thông báo"}
      >
        {selected ? (
          <Stack gap="md">
            <Group justify="space-between">
              <UiStatusBadge role="info">{selected.category}</UiStatusBadge>
              <Text size="sm" c="dimmed">
                {selected.createdAt}
              </Text>
            </Group>
            <Text>{selected.detail}</Text>
            <Text size="sm" c="dimmed">
              Phạm vi hiển thị được giới hạn theo học viên và quyền ủy quyền của tài khoản phụ huynh.
            </Text>
            <Group justify="flex-end">
              <UiButton
                component={Link}
                href={selected.relatedHref}
                variant="default"
                onClick={() =>
                  setRows((value) =>
                    value.map((item) => (item.id === selected.id ? { ...item, read: true } : item)),
                  )
                }
              >
                {selected.relatedLabel}
              </UiButton>
              <UiButton onClick={() => setSelected(null)}>Đóng</UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
      <Paper className="classInfoCallout" p="md" mt="md">
        <Text size="sm">
          <strong>{rows.filter((row) => !row.read).length}</strong> thông báo chưa đọc
        </Text>
      </Paper>
    </div>
  );
}
