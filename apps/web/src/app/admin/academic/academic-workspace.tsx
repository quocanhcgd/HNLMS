"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Alert, Badge, Card, Group, NumberInput, Select, Stack, Table, Text, Title } from "@mantine/core";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarClock, GraduationCap, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiBadge, UiButton, UiSelect, UiTable, UiTextInput } from "@/components/ui";

type AcademicSection = "programs" | "classes";
type ProgramRow = { department: string; code: string; name: string; status: string; version: number };
type ClassRow = {
  program: string;
  code: string;
  branch: string;
  modality: string;
  capacity: number;
  enrolled: number;
  teacher: string;
  schedule: string;
  status: string;
};

const programs: ProgramRow[] = [
  { department: "Ngoại ngữ", code: "IELTS", name: "Lộ trình IELTS", status: "Đã công bố", version: 2 },
  { department: "Kỹ năng", code: "BIZ", name: "Tiếng Anh doanh nghiệp", status: "Bản nháp", version: 1 },
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

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp size={14} />;
  if (direction === "desc") return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} opacity={0.5} />;
}

export function AcademicWorkspace({ section }: { section: AcademicSection }) {
  const [feedback, setFeedback] = useState("");
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [status, setStatus] = useState<string | null>("all");
  const [capacity, setCapacity] = useState<number | string>(12);

  const programColumns = useMemo<ColumnDef<ProgramRow>[]>(
    () => [
      { accessorKey: "department", header: "Ngành" },
      { accessorKey: "code", header: "Mã" },
      {
        accessorKey: "name",
        header: "Chương trình",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.name}</Text>
            <Text size="xs" c="dimmed">
              Mục tiêu, học phần, điều kiện hoàn thành
            </Text>
          </div>
        ),
      },
      { accessorKey: "version", header: "Phiên bản", cell: ({ getValue }) => `v${getValue<number>()}` },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiBadge color={getValue<string>() === "Đã công bố" ? "teal" : "yellow"}>{getValue<string>()}</UiBadge>
        ),
      },
    ],
    [],
  );

  const classColumns = useMemo<ColumnDef<ClassRow>[]>(
    () => [
      { accessorKey: "program", header: "Khóa học" },
      { accessorKey: "code", header: "Lớp", cell: ({ getValue }) => <Text fw={600}>{getValue<string>()}</Text> },
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
          <Group gap="xs">
            <CalendarClock size={15} />
            {getValue<string>()}
          </Group>
        ),
      },
      { accessorKey: "teacher", header: "Giảng viên" },
      {
        accessorKey: "enrolled",
        header: "Sức chứa",
        cell: ({ row }) => `${row.original.enrolled}/${row.original.capacity}`,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiBadge color={getValue<string>() === "Đủ chỗ" ? "gray" : "teal"}>{getValue<string>()}</UiBadge>
        ),
      },
    ],
    [],
  );

  const data = section === "programs" ? programs : classes;
  const columns = section === "programs" ? programColumns : classColumns;
  const filteredData = useMemo(
    () =>
      data.filter((item) => {
        const value = JSON.stringify(item).toLowerCase();
        const matchesQuery = value.includes(query.toLowerCase());
        const matchesStatus = status === "all" || !status || ("status" in item && item.status === status);
        return matchesQuery && matchesStatus;
      }),
    [data, query, status],
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

  const title = section === "programs" ? "Chương trình và học phần" : "Lớp học và lịch";
  const subtitle =
    section === "programs"
      ? "Quản lý ngành, chương trình, khóa học và học phần."
      : "Mở lớp, gán giảng viên, sức chứa và trạng thái tuyển sinh.";

  return (
    <div className="page">
      <PageHeader title={title} subtitle={subtitle} />
      {feedback ? (
        <Alert color="teal" mb="md" title="Cập nhật đào tạo" withCloseButton onClose={() => setFeedback("")}>
          {feedback}
        </Alert>
      ) : null}
      <Card withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Title order={3}>{section === "programs" ? "Danh mục chương trình đào tạo" : "Danh sách lớp học"}</Title>
            <Text c="dimmed" size="sm">
              Dữ liệu được lọc, sắp xếp và phân trang theo cùng một mẫu bảng nghiệp vụ.
            </Text>
          </div>
          <UiButton
            leftSection={section === "programs" ? <Plus size={16} /> : <GraduationCap size={16} />}
            onClick={() =>
              setFeedback(
                section === "programs" ? "Đã tạo bản nháp chương trình mới." : "Đã tạo lớp ở trạng thái mở tuyển sinh.",
              )
            }
          >
            {section === "programs" ? "Tạo chương trình" : "Mở lớp mới"}
          </UiButton>
        </Group>
        <PageToolbar className="toolbar">
          <UiTextInput
            aria-label="Tìm kiếm"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder={section === "programs" ? "Tìm ngành, mã, chương trình..." : "Tìm khóa học, lớp, giảng viên..."}
          />
          <UiSelect
            aria-label="Lọc trạng thái"
            value={status}
            onChange={setStatus}
            data={
              section === "programs"
                ? ["all", "Đã công bố", "Bản nháp"]
                : ["all", "Mở tuyển sinh", "Sắp khai giảng", "Đủ chỗ"]
            }
          />
          {section === "classes" ? (
            <>
              <Select
                aria-label="Lọc hình thức"
                placeholder="Tất cả hình thức"
                data={["Trực tiếp", "Trực tuyến", "Kết hợp"]}
              />
              <NumberInput aria-label="Sức chứa lớp mới" value={capacity} onChange={setCapacity} min={1} />
            </>
          ) : null}
        </PageToolbar>
        <Table.ScrollContainer minWidth={section === "programs" ? 760 : 1050}>
          <UiTable verticalSpacing="md" horizontalSpacing="lg">
            <Table.Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <Table.Th key={header.id}>
                      <button
                        className="tableSortButton"
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIndicator direction={header.column.getIsSorted()} />
                      </button>
                    </Table.Th>
                  ))}
                </Table.Tr>
              ))}
            </Table.Thead>
            <Table.Tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Td>
                    ))}
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={columns.length}>
                    <Text c="dimmed" ta="center" py="xl">
                      Không tìm thấy dữ liệu phù hợp.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </UiTable>
        </Table.ScrollContainer>
        <Text size="xs" c="dimmed" mt="sm">
          TanStack Table · {table.getRowModel().rows.length}/{data.length} bản ghi · tìm kiếm và sắp xếp theo cột
        </Text>
      </Card>
      {section === "classes" ? (
        <Alert mt="md" color="yellow" title="Kiểm tra xung đột lịch">
          Lịch mới sẽ được kiểm tra trùng giảng viên, phòng học và buổi học trực tuyến trước khi xác nhận.
        </Alert>
      ) : null}
    </div>
  );
}
