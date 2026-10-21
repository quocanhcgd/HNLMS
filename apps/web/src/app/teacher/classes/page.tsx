"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Badge, Group, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { CalendarClock, CheckCircle2, ClipboardCheck, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ClassStatus = "Đang dạy" | "Sắp khai giảng" | "Cần rà soát";
type TeachingClass = {
  classCode: string;
  course: string;
  students: number;
  schedule: string;
  nextSession: string;
  prepared: string;
  attendance: string;
  status: ClassStatus;
};

const classes: TeachingClass[] = [
  {
    classCode: "IF-2609",
    course: "IELTS Foundation · A2+",
    students: 18,
    schedule: "T2/T4/T6 · 18:00-19:30",
    nextSession: "Hôm nay · Listening clinic",
    prepared: "4/5 học liệu",
    attendance: "Chưa ghi",
    status: "Cần rà soát",
  },
  {
    classCode: "TOEIC-2609",
    course: "TOEIC 700+ · Reading",
    students: 16,
    schedule: "T2/T5 · 19:45-21:15",
    nextSession: "Ngày mai · Mini test review",
    prepared: "5/5 học liệu",
    attendance: "14/16",
    status: "Đang dạy",
  },
  {
    classCode: "IA-2610",
    course: "IELTS Academic · Speaking",
    students: 12,
    schedule: "T3/T6 · 17:00-18:30",
    nextSession: "Thứ sáu · Speaking practice",
    prepared: "3/5 học liệu",
    attendance: "10/12",
    status: "Sắp khai giảng",
  },
];

const statusRole: Record<ClassStatus, "success" | "warning" | "info"> = {
  "Đang dạy": "success",
  "Sắp khai giảng": "info",
  "Cần rà soát": "warning",
};

export default function TeacherClassesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () =>
      classes.filter((item) => {
        const matchesQuery = JSON.stringify(item).toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        return matchesQuery && matchesStatus;
      }),
    [query, status],
  );
  const columns = useMemo<ColumnDef<TeachingClass>[]>(
    () => [
      {
        accessorKey: "classCode",
        header: "Lớp được phân công",
        cell: ({ row }) => (
          <div>
            <Link className="tableLinkButton" href={`/teacher/classes/${row.original.classCode.toLowerCase()}`}>
              <Text fw={600}>{row.original.classCode}</Text>
            </Link>
            <Text size="xs" c="dimmed">
              {row.original.course}
            </Text>
          </div>
        ),
      },
      { accessorKey: "students", header: "Sĩ số", cell: ({ getValue }) => <Text>{getValue<number>()} học viên</Text> },
      { accessorKey: "schedule", header: "Lịch cố định" },
      { accessorKey: "nextSession", header: "Buổi kế tiếp" },
      { accessorKey: "prepared", header: "Học liệu" },
      { accessorKey: "attendance", header: "Điểm danh" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ClassStatus>();
          return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiRowActions
            actions={{ view: () => router.push(`/teacher/classes/${row.original.classCode.toLowerCase()}`) }}
            labels={{ view: "Mở lớp" }}
          />
        ),
      },
    ],
    [router],
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
  const activeCount = classes.filter((item) => item.status === "Đang dạy").length;
  const reviewCount = classes.filter((item) => item.status === "Cần rà soát").length;
  const totalStudents = classes.reduce((sum, item) => sum + item.students, 0);
  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title="Lớp đang dạy"
        subtitle="Lớp được phân công, buổi kế tiếp, học liệu cần chuẩn bị và việc giáo viên cần xử lý."
      />
      <Paper
        withBorder
        p="lg"
        mb="md"
        className="teacher-classes-overview"
        style={{
          background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))",
          borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group align="flex-start" gap="md">
            <ThemeIcon size={48} radius="md" color="blue">
              <UsersRound size={25} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">
                Phân công giảng dạy
              </Text>
              <Text fz={32} fw={800} lh={1.1}>
                {classes.length} lớp đang theo dõi
              </Text>
              <Group gap="xs" mt={6}>
                <Badge color="blue" variant="light">
                  {totalStudents} học viên
                </Badge>
                <Text size="xs" c="dimmed">
                  Tiến độ chuẩn bị và điểm danh theo lớp
                </Text>
              </Group>
            </div>
          </Group>
          <div className="teacher-classes-summary">
            <Group gap="xl">
              <div>
                <Text size="xs" c="dimmed">
                  Đang dạy
                </Text>
                <Text fw={750} c="teal">
                  {activeCount}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Cần rà soát
                </Text>
                <Text fw={750} c="orange">
                  {reviewCount}
                </Text>
              </div>
              <div>
                <Text size="xs" c="dimmed">
                  Học liệu chuẩn
                </Text>
                <Text fw={750}>67%</Text>
              </div>
            </Group>
            <Progress value={67} color="teal" size="sm" mt="md" />
          </div>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <Metric
          icon={<UsersRound size={18} />}
          label="Lớp phụ trách"
          value={`${classes.length}`}
          detail={`${totalStudents} học viên`}
          color="blue"
        />
        <Metric
          icon={<CalendarClock size={18} />}
          label="Buổi kế tiếp"
          value="3"
          detail="trong tuần này"
          color="violet"
        />
        <Metric
          icon={<ClipboardCheck size={18} />}
          label="Cần chuẩn bị"
          value={`${reviewCount}`}
          detail="lớp cần rà soát"
          color="orange"
        />
        <Metric
          icon={<CheckCircle2 size={18} />}
          label="Điểm danh"
          value="24/28"
          detail="86% đã ghi nhận"
          color="teal"
        />
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm lớp đang dạy"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm lớp, khóa học, buổi dạy..."
          style={{ minWidth: 300 }}
        />
        <UiSelect
          aria-label="Lọc trạng thái lớp"
          w={190}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            ...Object.keys(statusRole).map((value) => ({ value, label: value })),
          ]}
        />
      </PageToolbar>
      <Stack>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1180}
          emptyTitle="Không tìm thấy lớp được phân công."
        />
        <Text size="xs" c="dimmed">
          {table.getRowModel().rows.length}/{classes.length} lớp · dữ liệu mẫu teacher workspace
        </Text>
      </Stack>
      <Paper className="panel" p="lg" mt="md" withBorder>
        <Group>
          <CheckCircle2 size={20} />
          <div>
            <Text fw={700}>Sau buổi dạy</Text>
            <Text size="sm" c="dimmed">
              Bài tập trên lớp chấm ngay; bài tập về nhà đi vào hàng đợi chấm sau. Worklog chỉ gửi payroll sau khi giáo
              viên xác nhận.
            </Text>
          </div>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <Paper className="panel" p="md" withBorder>
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
