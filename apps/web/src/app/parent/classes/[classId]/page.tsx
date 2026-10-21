"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowLeft, CheckCircle2, Eye, FileText, Search, Video, XCircle } from "lucide-react";
import { Group, Paper, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import {
  findStudentClass,
  listStudentSessions,
  type StudentSession,
  type StudentSessionStatus,
} from "@/app/student/classes/student-class-data";
import { parentLearningApi, type ParentLearningAssignmentSummary } from "@/lib/parent-learning-api";

const statusRole: Record<StudentSessionStatus, "success" | "info" | "neutral"> = {
  "Đã học": "success",
  "Đang học": "info",
  "Sắp học": "neutral",
};
const attendanceRole = (value: string) => (value === "Có mặt" ? "success" : value === "Vắng" ? "danger" : "warning");
function materialType(contentType: string): "PDF" | "DOCX" | "PPTX" | "Video" | "YouTube" {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("youtube")) return "YouTube";
  if (normalized.includes("video")) return "Video";
  if (normalized.includes("slide") || normalized.includes("ppt")) return "PPTX";
  if (normalized.includes("doc")) return "DOCX";
  return "PDF";
}

export default function ParentClassDetailPage() {
  const params = useParams<{ classId: string }>();
  const classInfo = findStudentClass(params.classId);
  const classId = classInfo?.id ?? params.classId;
  const [sessions, setSessions] = useState(() => listStudentSessions(classId));
  const [assignmentSummaries, setAssignmentSummaries] = useState<ParentLearningAssignmentSummary[]>([]);
  const childId = classId === "math-2609" ? "student-gia-huy" : "student-minh-anh";
  const [apiState, setApiState] = useState<"loading" | "ready" | "fallback">("loading");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [dateRange, setDateRange] = useState<string | null>("all");
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>("all");
  const [attendanceStatus, setAttendanceStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<StudentSession | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([
      parentLearningApi.listForStudent(childId, classId),
      parentLearningApi.listAssignmentSummaries(childId, classId),
    ])
      .then(([output, assignmentRows]) => {
        if (!active) return;
        setAssignmentSummaries(assignmentRows);
        if (!output.length) { setApiState("fallback"); return; }
        const learning = output[0];
        setSessions((current) => current.map((session) => {
          const sessionKey = session.id.replace(classId + "-", "");
          const attendance = learning.attendance.find((item) => item.sessionId === session.id || item.sessionId === sessionKey);
          const materials = learning.materials.filter((item) => !item.sessionId || item.sessionId === session.id || item.sessionId === sessionKey);
          const sessionAssignments = assignmentRows.filter((item) => item.sessionId === sessionKey || item.sessionId === "session-" + session.number);
          const gradedAssignment = sessionAssignments.find((item) => item.submission?.lifecycle === "graded" && item.submission.gradePublicationStatus === "published");
          const submittedAssignment = sessionAssignments.find((item) => item.submission?.lifecycle === "submitted" || item.submission?.lifecycle === "graded");
          const publishedScore = gradedAssignment?.submission?.score !== undefined ? gradedAssignment : undefined;
          return {
            ...session,
            materials: materials.length ? materials.map((item) => ({ id: item.id, title: item.title, type: materialType(item.contentType), source: item.source ?? "internal://materials/" + item.id, published: true })) : session.materials,
            attendance: attendance ? attendance.status === "present" ? "Có mặt" : attendance.status === "late" ? "Muộn" : attendance.status === "excused" ? "Có phép" : "Vắng" : session.attendance,
            assignments: sessionAssignments.length ? gradedAssignment ? "Đã chấm" : submittedAssignment ? "Chờ chấm" : "Chưa nộp" : session.assignments,
            score: publishedScore ? String(publishedScore.submission?.score) + "/" + publishedScore.maxScore : session.score,
            scoreTitle: publishedScore?.title,
          };
        }));
        setApiState("ready");
      })
      .catch(() => {
        if (active) setApiState("fallback");
      });
    return () => {
      active = false;
    };
  }, [childId, classId]);
  const data = useMemo(
    () =>
      sessions.filter(
        (row) =>
          (status === "all" || !status || row.status === status) &&
          (assignmentStatus === "all" ||
            !assignmentStatus ||
            (assignmentStatus === "incomplete"
              ? ["Chưa nộp", "Chờ chấm"].includes(row.assignments)
              : row.assignments === assignmentStatus)) &&
          (attendanceStatus === "all" || !attendanceStatus || row.attendance === attendanceStatus) &&
          (dateRange === "all" ||
            !dateRange ||
            (dateRange === "completed"
              ? row.status === "Đã học"
              : dateRange === "upcoming"
                ? row.status === "Sắp học"
                : true)) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [assignmentStatus, attendanceStatus, dateRange, query, sessions, status],
  );
  const columns = useMemo<ColumnDef<StudentSession>[]>(
    () => [
      {
        accessorKey: "number",
        header: "Buổi",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>Buổi {row.original.number}</Text>
            <Text size="xs" c="dimmed">
              {row.original.date} · {row.original.time}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "title",
        header: "Nội dung",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {row.original.objective}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "materials",
        header: "Học liệu",
        cell: ({ row }) => <Text size="sm">{row.original.materials.length} nội dung</Text>,
      },
      {
        accessorKey: "assignments",
        header: "Bài tập",
        cell: ({ getValue }) => (
          <UiStatusBadge role={getValue() === "Đã nộp" ? "success" : getValue() === "Chưa nộp" ? "warning" : "neutral"}>
            {getValue<string>()}
          </UiStatusBadge>
        ),
      },
      {
        accessorKey: "score",
        header: "Điểm",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.score}</Text>
            {row.original.scoreTitle ? <Text size="xs" c="dimmed">{row.original.scoreTitle}</Text> : null}
          </div>
        ),
      },
      {
        accessorKey: "attendance",
        header: "Điểm danh",
        cell: ({ getValue }) => (
          <UiStatusBadge role={attendanceRole(getValue<string>()) as "success" | "danger" | "warning"}>
            {getValue<string>()}
          </UiStatusBadge>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<StudentSessionStatus>();
          return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton
            size="compact-xs"
            variant="default"
            leftSection={<Eye size={14} />}
            onClick={() => setSelected(row.original)}
          >
            Xem buổi học
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
  if (!classInfo)
    return (
      <div className="page">
        <PageHeader
          title="Không tìm thấy lớp học"
          subtitle="Lớp học không tồn tại hoặc không nằm trong phạm vi ủy quyền."
        />
        <UiButton component={Link} href="/parent/classes" leftSection={<ArrowLeft size={16} />}>
          Quay lại lớp học
        </UiButton>
      </div>
    );
  const childName = classId === "math-2609" ? "Trần Gia Huy" : "Nguyễn Minh Anh";
  const completed = sessions.filter((row) => row.status === "Đã học").length;
  const submitted = assignmentSummaries.filter((item) => item.submission?.lifecycle === "submitted" || item.submission?.lifecycle === "graded").length;
  const attended = sessions.filter((row) => row.attendance === "Có mặt").length;
  const selectedAssignments = selected
    ? assignmentSummaries.filter(
        (item) => item.sessionId === `session-${selected.number}` || item.sessionId === String(selected.number),
      )
    : [];
  return (
    <div className="page">
      <Group mb="sm">
        <UiButton component={Link} href="/parent/classes" variant="subtle" leftSection={<ArrowLeft size={16} />}>
          Lớp học của con
        </UiButton>
      </Group>
      <PageHeader
        title={`${classInfo.code} · ${classInfo.course}`}
        subtitle={`${childName} · ${classInfo.subject} · ${classInfo.program} · GV ${classInfo.teacher} · ${classInfo.schedule}`}
      />
      <Group gap="xs" mb="md">
        <UiStatusBadge role="success">{classInfo.status}</UiStatusBadge>
        <UiStatusBadge role="info">{classInfo.room}</UiStatusBadge>
        <UiStatusBadge role="neutral">Phạm vi ủy quyền</UiStatusBadge>
        <UiStatusBadge role={apiState === "ready" ? "success" : apiState === "loading" ? "info" : "warning"}>
          {apiState === "ready" ? "Đã đồng bộ" : apiState === "loading" ? "Đang đồng bộ" : "Dữ liệu mẫu"}
        </UiStatusBadge>
        <UiButton component={Link} href={"/parent/conversations?student=" + childId + "&classId=" + classId} size="compact-xs" variant="default">
          Trao đổi giáo viên
        </UiButton>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md" mb="md">
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            TIẾN ĐỘ KHÓA
          </Text>
          <Text fz={25} fw={700}>
            {classInfo.progress}%
          </Text>
          <Progress value={classInfo.progress} mt="xs" />
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            BUỔI ĐÃ HỌC
          </Text>
          <Text fz={25} fw={700}>
            {completed}/{sessions.length}
          </Text>
          <Text size="xs" c="dimmed">
            Theo lịch công bố
          </Text>
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            BÀI TẬP ĐÃ NỘP
          </Text>
          <Text fz={25} fw={700}>
            {submitted}/{assignmentSummaries.length}
          </Text>
          <Text size="xs" c="dimmed">
            Không bao gồm bài chưa mở
          </Text>
        </Paper>
        <Paper className="panel" p="md" withBorder>
          <Text size="xs" c="dimmed">
            ĐIỂM DANH
          </Text>
          <Text fz={25} fw={700}>
            {attended}/{sessions.filter((row) => row.attendance !== "Chưa điểm danh").length}
          </Text>
          <Text size="xs" c="dimmed">
            Có mặt / đã diễn ra
          </Text>
        </Paper>
      </SimpleGrid>
      <Paper className="panel" p="lg" withBorder>
        <Group justify="space-between" mb="md">
          <div>
            <Text fw={700}>Theo dõi từng buổi học</Text>
            <Text size="sm" c="dimmed">
              Xem nội dung, học liệu, bài tập, điểm số, điểm danh và nhận xét đã công bố.
            </Text>
          </div>
          <UiStatusBadge role="info">
            {data.length}/{sessions.length} buổi
          </UiStatusBadge>
        </Group>
        <PageToolbar className="toolbar">
          <UiTextInput
            aria-label="Tìm buổi học"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder="Tìm nội dung, ngày, bài tập..."
            style={{ minWidth: 300 }}
          />
          <UiSelect
            aria-label="Lọc trạng thái buổi"
            w={180}
            value={status}
            onChange={setStatus}
            data={[{ value: "all", label: "Tất cả trạng thái" }, "Đã học", "Đang học", "Sắp học"]}
          />
          <UiSelect
            aria-label="Lọc khoảng thời gian"
            w={180}
            value={dateRange}
            onChange={setDateRange}
            data={[
              { value: "all", label: "Tất cả thời gian" },
              { value: "completed", label: "Buổi đã diễn ra" },
              { value: "upcoming", label: "Buổi sắp diễn ra" },
            ]}
          />
          <UiSelect
            aria-label="Lọc tình trạng bài tập"
            w={190}
            value={assignmentStatus}
            onChange={setAssignmentStatus}
            data={[
              { value: "all", label: "Tất cả bài tập" },
              { value: "incomplete", label: "Chưa hoàn tất" },
              "Đã nộp",
              "Đã chấm",
              "Chờ chấm",
              "Chưa mở",
            ]}
          />
          <UiSelect
            aria-label="Lọc điểm danh"
            w={170}
            value={attendanceStatus}
            onChange={setAttendanceStatus}
            data={[{ value: "all", label: "Tất cả điểm danh" }, "Có mặt", "Vắng", "Có phép", "Chưa điểm danh"]}
          />
        </PageToolbar>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1300}
          emptyTitle="Không có buổi học phù hợp."
        />
        <Text size="xs" c="dimmed" mt="sm">
          {apiState === "ready"
            ? "Đã đồng bộ dữ liệu theo quyền ủy quyền của học viên/lớp."
            : "Dữ liệu chỉ đọc theo quyền ủy quyền; phụ huynh không thể sửa điểm, điểm danh hoặc nộp bài thay học viên."}
        </Text>
      </Paper>
      <UiModal
        opened={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `Buổi ${selected.number} · ${selected.title}` : "Chi tiết buổi học"}
        size="lg"
      >
        {selected ? (
          <Stack gap="md">
            <Group justify="space-between">
              <UiStatusBadge role={statusRole[selected.status]}>{selected.status}</UiStatusBadge>
              <Text size="sm" c="dimmed">
                {selected.date} · {selected.time} · {selected.mode} · {selected.room}
              </Text>
            </Group>
            <Text>{selected.objective}</Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Paper className="panelHighlight" p="sm">
                <Text size="xs" c="dimmed">
                  BÀI TẬP
                </Text>
                <Text fw={600}>{selected.assignments}</Text>
              </Paper>
              <Paper className="panelHighlight" p="sm">
                <Text size="xs" c="dimmed">
                  ĐIỂM
                </Text>
                <Text fw={600}>{selected.score}</Text>
                {selected.scoreTitle ? <Text size="xs" c="dimmed">{selected.scoreTitle}</Text> : null}
              </Paper>
              <Paper className="panelHighlight" p="sm">
                <Text size="xs" c="dimmed">
                  ĐIỂM DANH
                </Text>
                <Group gap="xs">
                  {selected.attendance === "Có mặt" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  <Text fw={600}>{selected.attendance}</Text>
                </Group>
              </Paper>
            </SimpleGrid>
            <Text fw={600}>Học liệu đã công bố</Text>
            {selected.materials
              .filter((material) => material.published)
              .map((material) => (
                <Group key={material.id} justify="space-between">
                  <Group gap="sm">
                    {material.type === "Video" ? <Video size={16} /> : <FileText size={16} />}
                    <Text size="sm">
                      {material.title} · {material.type}
                    </Text>
                  </Group>
                  <UiStatusBadge role="success">Chỉ xem trên hệ thống</UiStatusBadge>
                </Group>
              ))}
            <Text fw={600}>Tình trạng bài tập</Text>
            {selected.assignments === "Chưa mở" ? (
              <Text size="sm" c="dimmed">
                Bài tập của buổi này chưa được giáo viên công bố.
              </Text>
            ) : selectedAssignments.length ? (
              <Stack gap="xs">
                {selectedAssignments.map((assignment) => {
                  const lifecycle = assignment.submission?.lifecycle;
                  const score =
                    lifecycle === "graded" && assignment.submission?.gradePublicationStatus === "published"
                      ? `${assignment.submission.score}/${assignment.maxScore}`
                      : null;
                  const label =
                    lifecycle === "graded"
                      ? score ? `Đã chấm · ${score}` : "Đã chấm"
                      : lifecycle === "submitted"
                        ? "Đã nộp · chờ chấm"
                        : "Chưa nộp";
                  return (
                    <Group key={assignment.id} justify="space-between">
                      <Text size="sm">{assignment.title}</Text>
                      <UiStatusBadge role={lifecycle === "graded" ? "success" : lifecycle === "submitted" ? "info" : "warning"}>
                        {label}
                      </UiStatusBadge>
                    </Group>
                  );
                })}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                {selected.assignments}. Phụ huynh chỉ theo dõi tình trạng, không thể mở hoặc nộp bài thay học viên.
              </Text>
            )}
            <Group justify="flex-end">
              <UiButton onClick={() => setSelected(null)}>Đóng</UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
