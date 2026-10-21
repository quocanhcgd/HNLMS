"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { BookOpen, Search } from "lucide-react";
import { Group, Paper, SimpleGrid, Text } from "@mantine/core";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { studentClasses, type StudentClass } from "@/app/student/classes/student-class-data";
import { parentLearningApi } from "@/lib/parent-learning-api";

type ParentClassRow = StudentClass & { studentName: string; period: string };
const fallbackRows: ParentClassRow[] = [
  { ...studentClasses[0], studentName: "Nguyễn Minh Anh", period: "08/2026 - 11/2026" },
  { ...studentClasses[1], studentName: "Nguyễn Minh Anh", period: "08/2026 - 12/2026" },
  { ...studentClasses[2], studentName: "Trần Gia Huy", period: "09/2026 - 12/2026" },
];

export default function ParentClassesPage() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<ParentClassRow[]>(fallbackRows);
  const [apiState, setApiState] = useState<"loading" | "ready" | "fallback">("loading");
  const [query, setQuery] = useState("");
  const [student, setStudent] = useState<string | null>(searchParams.get("student") ?? "all");
  const [status, setStatus] = useState<string | null>("all");
  const [subject, setSubject] = useState<string | null>("all");
  const [teacher, setTeacher] = useState<string | null>("all");
  const [period, setPeriod] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  useEffect(() => {
    let active = true;
    void Promise.all([
      parentLearningApi.listForStudent("student-minh-anh"),
      parentLearningApi.listForStudent("student-gia-huy"),
    ])
      .then(([minhAnhRows, giaHuyRows]) => {
        if (!active) return;
        const outputRows = [...minhAnhRows, ...giaHuyRows];
        if (!outputRows.length) {
          setApiState("fallback");
          return;
        }
        const merged = fallbackRows.map((row) => {
          const output = outputRows.find((item) => item.classId === row.id || item.className === row.code);
          if (!output) return row;
          const score = output.scores.length
            ? `${((output.scores.reduce((sum, item) => sum + item.score / item.maxScore, 0) / output.scores.length) * 10).toFixed(1)}/10`
            : row.score;
          const attendanceCount = output.attendance.filter(
            (item) => item.status === "present" || item.status === "late",
          ).length;
          const attendedTotal = output.attendance.length || Number(row.attendance.match(/\d+/)?.[0] ?? 0);
          return {
            ...row,
            progress: output.progressPercent ?? row.progress,
            course: output.programName || row.course,
            subject: output.subjectName || row.subject,
            attendance: `${attendanceCount}/${attendedTotal || "-"} buổi`,
            score,
          };
        });
        setRows(merged);
        setApiState("ready");
      })
      .catch(() => {
        if (active) setApiState("fallback");
      });
    return () => {
      active = false;
    };
  }, []);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (student === "all" ||
            !student ||
            row.studentName === student ||
            (student === "student-minh-anh" && row.studentName === "Nguyễn Minh Anh") ||
            (student === "student-gia-huy" && row.studentName === "Trần Gia Huy")) &&
          (status === "all" || !status || row.status === status) &&
          (subject === "all" || !subject || row.subject === subject) &&
          (teacher === "all" || !teacher || row.teacher === teacher) &&
          (period === "all" || !period || row.period === period) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [period, query, rows, status, student, subject, teacher],
  );
  const columns = useMemo<ColumnDef<ParentClassRow>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Học viên",
        cell: ({ row }) => (
          <Group gap="sm" wrap="nowrap">
            <BookOpen size={18} />
            <div>
              <Text fw={600}>{row.original.studentName}</Text>
              <Text size="xs" c="dimmed">
                {row.original.code}
              </Text>
            </div>
          </Group>
        ),
      },
      {
        accessorKey: "course",
        header: "Môn / chương trình",
        cell: ({ row }) => (
          <div>
            <Text size="sm" fw={600}>
              {row.original.course}
            </Text>
            <Text size="xs" c="dimmed">
              {row.original.subject} · {row.original.program}
            </Text>
          </div>
        ),
      },
      { accessorKey: "teacher", header: "Giáo viên" },
      { accessorKey: "period", header: "Thời gian khóa" },
      { accessorKey: "attendance", header: "Buổi / điểm danh" },
      {
        accessorKey: "progress",
        header: "Tiến độ",
        cell: ({ getValue }) => <UiStatusBadge role="info">{getValue<number>()}%</UiStatusBadge>,
      },
      { accessorKey: "score", header: "Điểm gần nhất" },
      { accessorKey: "nextSession", header: "Buổi tiếp theo" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiStatusBadge
            role={getValue() === "Đang học" ? "success" : getValue() === "Đã hoàn thành" ? "neutral" : "warning"}
          >
            {getValue<string>()}
          </UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton component={Link} href={`/parent/classes/${row.original.id}`} size="compact-xs" variant="default">
            Xem lớp
          </UiButton>
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
        title="Lớp học của con"
        subtitle="Theo dõi số buổi, tiến độ, bài tập, điểm và điểm danh theo từng lớp của học viên."
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="md">
        <Paper className="classInfoCard classInfoCard--info" p="md">
          <Text className="classInfoLabel">LỚP ĐANG THEO DÕI</Text>
          <Text className="classInfoValue" fw={700}>
            {rows.length}
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--success" p="md">
          <Text className="classInfoLabel">BUỔI ĐÃ HỌC</Text>
          <Text className="classInfoValue" fw={700}>
            25
          </Text>
        </Paper>
        <Paper className="classInfoCard classInfoCard--warning" p="md">
          <Text className="classInfoLabel">BÀI TẬP CẦN XEM</Text>
          <Text className="classInfoValue" fw={700}>
            2
          </Text>
        </Paper>
      </SimpleGrid>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm lớp học"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, môn, giáo viên..."
          style={{ minWidth: 320 }}
        />
        <UiSelect
          aria-label="Lọc học viên"
          w={200}
          value={student}
          onChange={setStudent}
          data={[{ value: "all", label: "Tất cả học viên" }, "Nguyễn Minh Anh", "Trần Gia Huy"]}
        />
        <UiSelect
          aria-label="Lọc trạng thái lớp"
          w={180}
          value={status}
          onChange={setStatus}
          data={[{ value: "all", label: "Tất cả trạng thái" }, "Đang học", "Sắp khai giảng", "Đã hoàn thành"]}
        />
        <UiSelect
          aria-label="Lọc môn học"
          w={170}
          value={subject}
          onChange={setSubject}
          data={[{ value: "all", label: "Tất cả môn học" }, "Tiếng Anh", "Toán", "Ngữ văn"]}
        />
        <UiSelect
          aria-label="Lọc giáo viên"
          w={190}
          value={teacher}
          onChange={setTeacher}
          data={[{ value: "all", label: "Tất cả giáo viên" }, "Nguyễn Lan Anh", "Minh Tuấn", "Thu Hà"]}
        />
        <UiSelect
          aria-label="Lọc thời gian khóa"
          w={190}
          value={period}
          onChange={setPeriod}
          data={[
            { value: "all", label: "Tất cả thời gian" },
            "08/2026 - 11/2026",
            "08/2026 - 12/2026",
            "09/2026 - 12/2026",
          ]}
        />
      </PageToolbar>
      <Paper className="panel parentTablePanel" p="md" withBorder>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1450}
          emptyTitle="Không tìm thấy lớp học phù hợp."
        />
      </Paper>
      <Text size="xs" c="dimmed" mt="sm">
        {apiState === "ready"
          ? "Đã đồng bộ dữ liệu học tập theo quyền ủy quyền từ máy chủ."
          : apiState === "loading"
            ? "Đang đồng bộ dữ liệu học tập theo quyền ủy quyền..."
            : "Đang hiển thị dữ liệu mẫu; máy chủ học tập chưa có dữ liệu hoặc chưa phản hồi."}{" "}
        · {data.length}/{rows.length} lớp
      </Text>
    </div>
  );
}
