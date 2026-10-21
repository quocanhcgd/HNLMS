"use client";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Text } from "@mantine/core";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { listParentCompetencyProfiles } from "@/lib/competency-profiles";

export function ParentCompetencyWorkspace() {
  const searchParams = useSearchParams();
  const rows = useMemo(
    () =>
      ["student-minh-anh", "student-gia-huy"].flatMap((studentId) =>
        listParentCompetencyProfiles(studentId, new Set(["view_competency"])),
      ),
    [],
  );
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<string | null>(searchParams.get("student") ?? "all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (student === "all" || !student || row.studentId === student) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [query, rows, student],
  );
  const columns = useMemo<ColumnDef<CompetencyProfileReadModel>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.studentName}</Text>
            <Text size="xs" c="dimmed">
              {row.original.className}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "competencyName",
        header: "Môn / năng lực",
        cell: ({ row }) => (
          <div>
            <Text size="sm">
              {row.original.subjectName} · {row.original.competencyName}
            </Text>
            <Text size="xs" c="dimmed">
              {row.original.programName}
            </Text>
          </div>
        ),
      },
      { id: "baseline", accessorFn: (row) => row.baseline.label, header: "Đầu vào" },
      { id: "current", accessorFn: (row) => row.current.label, header: "Hiện tại" },
      { id: "target", accessorFn: (row) => row.target.label, header: "Mục tiêu" },
      { id: "evidence", accessorFn: (row) => row.evidence.sourceLabel, header: "Minh chứng" },
      { accessorKey: "teacherFeedback", header: "Nhận xét đã công bố" },
      {
        id: "delegation",
        header: "Ủy quyền",
        enableSorting: false,
        cell: () => <UiStatusBadge role="success">Được xem năng lực</UiStatusBadge>,
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
        title="Hồ sơ năng lực của con"
        subtitle="Chỉ hiển thị hồ sơ đã công bố khi ủy quyền xem năng lực còn hiệu lực cho từng học viên."
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm hồ sơ năng lực"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm môn, năng lực, lớp..."
          style={{ minWidth: 290 }}
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
        minWidth={1080}
        emptyTitle="Không có hồ sơ năng lực trong phạm vi ủy quyền."
      />
      <Text size="xs" c="dimmed" mt="sm">
        {data.length} hồ sơ · Quyền xem tiến độ hoặc điểm không tự động cấp quyền xem hồ sơ năng lực.
      </Text>
    </div>
  );
}
