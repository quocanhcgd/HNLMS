"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Text } from "@mantine/core";
import { CalendarClock, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type AcademicSection = "programs" | "classes";
type ProgramStatus = "Đã công bố" | "Bản nháp" | "Đang rà soát";
type ClassStatus = "Mở tuyển sinh" | "Sắp khai giảng" | "Đủ chỗ" | "Đang học";

type ProgramRow = {
  department: string;
  code: string;
  name: string;
  level: string;
  moduleCount: number;
  version: number;
  owner: string;
  status: ProgramStatus;
  updatedAt: string;
};

type ClassRow = {
  program: string;
  code: string;
  branch: string;
  modality: string;
  capacity: number;
  enrolled: number;
  teacher: string;
  schedule: string;
  startDate: string;
  status: ClassStatus;
};

const programs: ProgramRow[] = [
  {
    department: "Ngoại ngữ",
    code: "IELTS",
    name: "Lộ trình IELTS",
    level: "Foundation → Advanced",
    moduleCount: 8,
    version: 2,
    owner: "Lan Anh",
    status: "Đã công bố",
    updatedAt: "20/08/2026",
  },
  {
    department: "Kỹ năng",
    code: "BIZ",
    name: "Tiếng Anh doanh nghiệp",
    level: "A2 → B2",
    moduleCount: 5,
    version: 1,
    owner: "Quốc Huy",
    status: "Bản nháp",
    updatedAt: "18/08/2026",
  },
  {
    department: "Ngoại ngữ",
    code: "TOEIC",
    name: "TOEIC 700+",
    level: "Pre-Intermediate",
    moduleCount: 6,
    version: 3,
    owner: "Mai Chi",
    status: "Đang rà soát",
    updatedAt: "21/08/2026",
  },
];

const classes: ClassRow[] = [
  {
    program: "IELTS Foundation",
    code: "IF-2609",
    branch: "Cầu Giấy",
    modality: "Trực tiếp",
    capacity: 12,
    enrolled: 11,
    teacher: "Lan Anh",
    schedule: "T2/T4/T6 · 18:00-19:30",
    startDate: "01/09/2026",
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
    startDate: "07/09/2026",
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
    startDate: "Đang học",
    status: "Đủ chỗ",
  },
  {
    program: "TOEIC 700+",
    code: "TOEIC-2609",
    branch: "Cầu Giấy",
    modality: "Trực tiếp",
    capacity: 16,
    enrolled: 9,
    teacher: "Minh Tuấn",
    schedule: "T2/T5 · 19:45-21:15",
    startDate: "10/09/2026",
    status: "Mở tuyển sinh",
  },
];

const programStatusRoles: Record<ProgramStatus, "success" | "warning" | "neutral"> = {
  "Đã công bố": "success",
  "Bản nháp": "neutral",
  "Đang rà soát": "warning",
};

const classStatusRoles: Record<ClassStatus, "success" | "warning" | "neutral" | "info"> = {
  "Mở tuyển sinh": "success",
  "Sắp khai giảng": "warning",
  "Đủ chỗ": "neutral",
  "Đang học": "info",
};

export function AcademicWorkspace({ section }: { section: AcademicSection }) {
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [status, setStatus] = useState<string | null>("all");
  const [branch, setBranch] = useState<string | null>("all");

  const programColumns = useMemo<ColumnDef<ProgramRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Chương trình",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.name}</Text>
            <Text size="xs" c="dimmed">
              {row.original.code} · {row.original.level}
            </Text>
          </div>
        ),
      },
      { accessorKey: "department", header: "Ngành" },
      { accessorKey: "moduleCount", header: "Học phần", cell: ({ getValue }) => `${getValue<number>()} học phần` },
      { accessorKey: "version", header: "Phiên bản", cell: ({ getValue }) => `v${getValue<number>()}` },
      { accessorKey: "owner", header: "Phụ trách" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ProgramStatus>();
          return <UiStatusBadge role={programStatusRoles[value]}>{value}</UiStatusBadge>;
        },
      },
      { accessorKey: "updatedAt", header: "Cập nhật" },
    ],
    [],
  );

  const classColumns = useMemo<ColumnDef<ClassRow>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Lớp",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.code}</Text>
            <Text size="xs" c="dimmed">
              {row.original.program}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "branch",
        header: "Chi nhánh",
        cell: ({ row }) => (
          <div>
            {row.original.branch}
            <Text size="xs" c="dimmed">
              {row.original.modality}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "schedule",
        header: "Lịch học",
        cell: ({ getValue }) => (
          <Group gap="xs" wrap="nowrap">
            <CalendarClock size={15} />
            <Text size="sm">{getValue<string>()}</Text>
          </Group>
        ),
      },
      { accessorKey: "teacher", header: "Giảng viên" },
      { accessorKey: "startDate", header: "Khai giảng" },
      {
        accessorKey: "enrolled",
        header: "Sức chứa",
        cell: ({ row }) => `${row.original.enrolled}/${row.original.capacity}`,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ClassStatus>();
          return <UiStatusBadge role={classStatusRoles[value]}>{value}</UiStatusBadge>;
        },
      },
    ],
    [],
  );

  const isPrograms = section === "programs";
  const data = isPrograms ? programs : classes;
  const columns = isPrograms ? programColumns : classColumns;
  const title = isPrograms ? "Chương trình đào tạo" : "Lớp học";
  const subtitle = isPrograms
    ? "Quản lý danh mục chương trình, phiên bản, học phần và trạng thái công bố."
    : "Quản lý lớp, lịch học, giảng viên, sức chứa và trạng thái tuyển sinh.";

  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const searchable = JSON.stringify(item).toLowerCase();
        const matchesQuery = searchable.includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || item.status === status;
        const matchesBranch = isPrograms || branch === "all" || !branch || ("branch" in item && item.branch === branch);
        return matchesQuery && matchesStatus && matchesBranch;
      }),
    [branch, data, isPrograms, query, status],
  );

  const table = useReactTable<ProgramRow | ClassRow>({
    data: filteredData,
    columns: columns as ColumnDef<ProgramRow | ClassRow>[],
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="page">
      <PageHeader title={title} subtitle={subtitle} action={isPrograms ? "Tạo chương trình" : "Mở lớp mới"} />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm kiếm"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder={isPrograms ? "Tìm chương trình, mã, ngành..." : "Tìm lớp, khóa học, giảng viên..."}
        />
        <UiSelect
          aria-label="Lọc trạng thái"
          w={190}
          value={status}
          onChange={setStatus}
          data={
            isPrograms
              ? [{ value: "all", label: "Tất cả trạng thái" }, "Đã công bố", "Bản nháp", "Đang rà soát"]
              : [{ value: "all", label: "Tất cả trạng thái" }, "Mở tuyển sinh", "Sắp khai giảng", "Đủ chỗ", "Đang học"]
          }
        />
        {!isPrograms ? (
          <UiSelect
            aria-label="Lọc chi nhánh"
            w={180}
            value={branch}
            onChange={setBranch}
            data={[{ value: "all", label: "Tất cả chi nhánh" }, "Cầu Giấy", "Hai Bà Trưng", "Online"]}
          />
        ) : null}
      </PageToolbar>
      <UiDataTable
        table={table}
        columnCount={columns.length}
        minWidth={isPrograms ? 900 : 1050}
        emptyTitle={isPrograms ? "Không tìm thấy chương trình phù hợp." : "Không tìm thấy lớp học phù hợp."}
      />
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length}/{data.length} bản ghi · cùng chuẩn toolbar, bảng và trạng
        thái với các trang quản trị khác
      </Text>
    </div>
  );
}
