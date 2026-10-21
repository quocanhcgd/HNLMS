"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Badge, Group, Paper, Progress, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { CalendarClock, CheckCircle2, ClipboardCheck, FileCheck2, FileText, Search, Send, Upload } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  PageToolbar,
  UiButton,
  UiDataTable,
  UiEditModal,
  UiModal,
  UiRowActions,
  UiSelect,
  UiStatusBadge,
  UiTextInput,
} from "@/components/ui";
import { teacherClassOperationsApi, type TeacherSessionOperation } from "@/lib/teacher-class-operations-api";

type SessionStatus = "Cần chuẩn bị" | "Sẵn sàng" | "Đã điểm danh" | "Đã xác nhận";
type SessionRow = {
  id: string;
  date: string;
  time: string;
  className: string;
  title: string;
  students: number;
  materials: number;
  attendance: number;
  status: SessionStatus;
  worklog: "Chưa gửi" | "Đã gửi";
};

const fromApi = (row: TeacherSessionOperation): SessionRow => row;

const initialRows: SessionRow[] = [
  {
    id: "session-5",
    date: "28/08/2026",
    time: "18:00 - 19:30",
    className: "IF-2609",
    title: "Listening clinic · Unit 5",
    students: 18,
    materials: 4,
    attendance: 0,
    status: "Cần chuẩn bị",
    worklog: "Chưa gửi",
  },
  {
    id: "session-4",
    date: "27/08/2026",
    time: "19:45 - 21:15",
    className: "TOEIC-2609",
    title: "Mini test review",
    students: 16,
    materials: 5,
    attendance: 14,
    status: "Đã điểm danh",
    worklog: "Chưa gửi",
  },
  {
    id: "session-3",
    date: "26/08/2026",
    time: "17:00 - 18:30",
    className: "IA-2610",
    title: "Speaking practice",
    students: 12,
    materials: 5,
    attendance: 12,
    status: "Đã xác nhận",
    worklog: "Đã gửi",
  },
  {
    id: "session-2",
    date: "25/08/2026",
    time: "18:00 - 19:30",
    className: "IF-2609",
    title: "Grammar in context",
    students: 18,
    materials: 5,
    attendance: 18,
    status: "Đã xác nhận",
    worklog: "Đã gửi",
  },
];

const statusRole: Record<SessionStatus, "warning" | "info" | "success"> = {
  "Cần chuẩn bị": "warning",
  "Sẵn sàng": "info",
  "Đã điểm danh": "info",
  "Đã xác nhận": "success",
};

export function TeacherWorklogWorkspace() {
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<SessionRow | null>(null);
  const [modal, setModal] = useState<"details" | "materials" | "attendance" | "worklog" | null>(null);
  const [notice, setNotice] = useState("");
  const [apiReady, setApiReady] = useState(false);
  const [materialType, setMaterialType] = useState("Bài giảng");
  const [materialTitle, setMaterialTitle] = useState("Listening clinic · Unit 5");
  const [materialDescription, setMaterialDescription] = useState(
    "Mục tiêu, cách thực hiện và tiêu chí hoàn thành của học viên.",
  );
  const [materialAttachment, setMaterialAttachment] = useState<File | null>(null);
  useEffect(() => { let active = true; void teacherClassOperationsApi.list().then((items) => { if (!active || !items.length) return; setRows(items.map(fromApi)); setApiReady(true); }).catch(() => undefined); return () => { active = false; }; }, []);
  const [worklogNote, setWorklogNote] = useState("");
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (filter === "all" || row.status === filter) &&
          JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [rows, query, filter],
  );
  const ready = rows.filter((row) => row.materials >= 5).length;
  const confirmed = rows.filter((row) => row.status === "Đã xác nhận").length;
  const pending = rows.filter((row) => row.status !== "Đã xác nhận").length;
  const totalStudents = rows.reduce((sum, row) => sum + row.students, 0);
  const totalAttendance = rows.reduce((sum, row) => sum + row.attendance, 0);
  const columns = useMemo<ColumnDef<SessionRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Ngày / giờ",
        cell: ({ row }) => (
          <div>
            <Text fw={650}>{row.original.date}</Text>
            <Text size="xs" c="dimmed">
              {row.original.time}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "className",
        header: "Lớp / nội dung",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.className}</Text>
            <Text size="xs" c="dimmed">
              {row.original.title}
            </Text>
          </div>
        ),
      },
      { accessorKey: "students", header: "Sĩ số", cell: ({ getValue }) => <Text>{getValue<number>()} học viên</Text> },
      {
        accessorKey: "materials",
        header: "Học liệu",
        cell: ({ row }) => (
          <UiStatusBadge role={row.original.materials >= 5 ? "success" : "warning"}>
            {row.original.materials}/5
          </UiStatusBadge>
        ),
      },
      {
        accessorKey: "attendance",
        header: "Điểm danh",
        cell: ({ row }) => (
          <Text>
            {row.original.attendance}/{row.original.students}
          </Text>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<SessionStatus>();
          return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiRowActions
            labels={{ view: "Chi tiết", edit: "Quản lý học liệu", publish: "Ghi điểm danh", archive: "Xác nhận công" }}
            actions={{
              view: () => {
                setSelected(row.original);
                setModal("details");
              },
              edit: () => {
                setSelected(row.original);
                setModal("materials");
              },
              publish: () => {
                setSelected(row.original);
                setModal("attendance");
              },
              archive:
                row.original.worklog === "Chưa gửi" && row.original.materials >= 5 && row.original.attendance > 0
                  ? () => {
                      setSelected(row.original);
                      setModal("worklog");
                    }
                  : undefined,
            }}
          />
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
  const current = selected ?? rows[0];
  const saveMaterials = async () => {
    if (!current) return;
    if (!apiReady) { setNotice("Máy chủ buổi dạy chưa phản hồi; học liệu chưa được lưu."); return; }
    try {
      const saved = await teacherClassOperationsApi.materials(current.id, { title: materialTitle, type: materialType, description: materialDescription, attachmentName: materialAttachment?.name });
      setRows((items) => items.map((row) => row.id === saved.id ? saved : row));
    } catch { setNotice("Không thể lưu học liệu trên máy chủ."); return; }
    setNotice(`Đã lưu học liệu cho ${current.className} · ${current.title} trên máy chủ.`);
    setModal(null);
  };
  const saveAttendance = async () => {
    if (!current) return;
    if (!apiReady) { setNotice("Máy chủ buổi dạy chưa phản hồi; điểm danh chưa được lưu."); return; }
    try { const saved = await teacherClassOperationsApi.attendance(current.id, current.students); setRows((items) => items.map((row) => row.id === saved.id ? saved : row)); } catch { setNotice("Không thể lưu điểm danh trên máy chủ."); return; }
    setNotice(`Đã ghi nhận điểm danh ${current.className} trên máy chủ.`);
    setModal(null);
  };
  const saveWorklog = async () => {
    if (!current || !worklogNote.trim()) return;
    if (!apiReady) { setNotice("Máy chủ buổi dạy chưa phản hồi; worklog chưa được gửi."); return; }
    try { const saved = await teacherClassOperationsApi.worklog(current.id, worklogNote); setRows((items) => items.map((row) => row.id === saved.id ? saved : row)); } catch (error) { setNotice(error instanceof Error && error.message.includes("400") ? "Chưa thể gửi worklog: cần đủ học liệu và điểm danh trước." : "Không thể gửi worklog trên máy chủ."); return; }
    setNotice(`Đã gửi worklog ${current.className} đến học vụ/payroll.`);
    setWorklogNote("");
    setModal(null);
  };

  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title="Buổi dạy & worklog"
        subtitle="Chuẩn bị đủ học liệu, ghi nhận điểm danh và xác nhận công dạy theo từng buổi được phân công."
      />
      <Paper
        withBorder
        p="lg"
        mb="md"
        className="teacher-module-overview"
        style={{
          background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))",
          borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))",
        }}
      >
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group gap="md">
            <ThemeIcon size={48} radius="md" color="blue">
              <CalendarClock size={25} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">
                Chu kỳ xử lý buổi dạy
              </Text>
              <Text fz={32} fw={800} lh={1.1}>
                {pending} buổi cần theo dõi
              </Text>
              <Group gap="xs" mt={6}>
                <Badge color="orange" variant="light">
                  {rows.length - ready} buổi thiếu học liệu
                </Badge>
                <Text size="xs" c="dimmed">
                  Hoàn tất theo thứ tự học liệu → điểm danh → worklog
                </Text>
              </Group>
            </div>
          </Group>
          <div className="teacher-module-summary">
            <Text size="xs" c="dimmed">
              Tỷ lệ hoàn tất
            </Text>
            <Text fw={750}>{rows.length ? Math.round((confirmed / rows.length) * 100) : 0}%</Text>
            <Progress value={rows.length ? (confirmed / rows.length) * 100 : 0} color="teal" size="sm" mt={6} />
          </div>
        </Group>
      </Paper>
      {notice ? (
        <Alert icon={<CheckCircle2 size={16} />} color="teal" mb="md" withCloseButton onClose={() => setNotice("")}>
          {notice}
        </Alert>
      ) : null}
      <Text size="xs" c={apiReady ? "teal" : "orange"} mb="sm">
        {apiReady ? "Đã đồng bộ dữ liệu buổi dạy với máy chủ." : "Máy chủ buổi dạy chưa phản hồi; các thao tác đang bị khóa."}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <Metric
          icon={<CalendarClock size={18} />}
          label="Buổi trong kỳ"
          value={`${rows.length}`}
          detail="theo lịch phân công"
          color="blue"
        />
        <Metric
          icon={<Upload size={18} />}
          label="Học liệu đầy đủ"
          value={`${ready}/${rows.length}`}
          detail="đã đủ 5 loại"
          color="violet"
        />
        <Metric
          icon={<ClipboardCheck size={18} />}
          label="Điểm danh"
          value={`${totalAttendance}/${totalStudents}`}
          detail="học viên đã ghi nhận"
          color="orange"
        />
        <Metric
          icon={<FileCheck2 size={18} />}
          label="Worklog đã gửi"
          value={`${rows.filter((row) => row.worklog === "Đã gửi").length}/${rows.length}`}
          detail="chờ đối soát payroll"
          color="teal"
        />
      </SimpleGrid>
      <PageToolbar className="toolbar" justify="space-between">
        <Group>
          <UiTextInput
            aria-label="Tìm buổi dạy"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder="Tìm lớp, nội dung buổi dạy..."
          />
          <UiSelect
            aria-label="Lọc trạng thái buổi dạy"
            value={filter}
            onChange={(value) => setFilter(value ?? "all")}
            data={[
              { value: "all", label: "Tất cả trạng thái" },
              ...Object.keys(statusRole).map((value) => ({ value, label: value })),
            ]}
            w={190}
          />
        </Group>
        <UiStatusBadge role={pending ? "warning" : "success"}>{pending} cần xử lý</UiStatusBadge>
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1220}
          emptyTitle="Không có buổi dạy phù hợp."
        />
        <Text size="xs" c="dimmed" mt="sm">
          Thao tác học liệu, điểm danh và xác nhận công dạy được thực hiện ngay trên từng buổi.
        </Text>
      </Paper>
      <UiEditModal
        opened={modal === "materials"}
        onClose={() => setModal(null)}
        title={`Học liệu · ${current?.className ?? ""}`}
        onSave={saveMaterials}
        saveLabel="Lưu học liệu"
      >
        <Stack>
          <UiSelect
            label="Loại học liệu"
            value={materialType}
            onChange={(value) => setMaterialType(value ?? "Bài giảng")}
            data={["Bài giảng", "Bài tập trên lớp", "Bài kiểm tra", "Bài tập về nhà", "Tài liệu tham khảo"]}
          />
          <UiTextInput
            label="Tiêu đề"
            value={materialTitle}
            onChange={(event) => setMaterialTitle(event.currentTarget.value)}
          />
          <Textarea
            label="Mô tả hướng dẫn"
            minRows={3}
            value={materialDescription}
            onChange={(event) => setMaterialDescription(event.currentTarget.value)}
          />
          <label className="mediaFileField">
            <span>Đính kèm tài liệu</span>
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.png,.jpg" onChange={(event) => setMaterialAttachment(event.currentTarget.files?.[0] ?? null)} />
            <small>{materialAttachment ? materialAttachment.name : "Tệp chỉ được giữ trong phiên demo."}</small>
          </label>
          <Text size="xs" c="dimmed">
            Tối thiểu 5 loại học liệu trước khi bắt đầu buổi dạy.
          </Text>
        </Stack>
      </UiEditModal>
      <UiModal
        opened={modal === "details"}
        onClose={() => setModal(null)}
        title={`Chi tiết buổi dạy · ${current?.className ?? ""}`}
        size="lg"
      >
        {current ? (
          <Stack>
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={700}>{current.title}</Text>
                <Text size="sm" c="dimmed">
                  {current.date} · {current.time} · {current.className}
                </Text>
              </div>
              <UiStatusBadge role={statusRole[current.status]}>{current.status}</UiStatusBadge>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              <Detail label="Sĩ số" value={`${current.students} học viên`} />
              <Detail label="Học liệu" value={`${current.materials}/5 loại`} />
              <Detail label="Điểm danh" value={`${current.attendance}/${current.students}`} />
              <Detail label="Worklog" value={current.worklog} />
            </SimpleGrid>
            <Paper className="classInfoCallout" p="md">
              <Text size="sm">
                Hoàn tất theo thứ tự học liệu, điểm danh và xác nhận worklog. Worklog chỉ được gửi sau khi đủ học liệu
                và đã ghi nhận điểm danh.
              </Text>
            </Paper>
            <Group justify="flex-end">
              <UiButton variant="default" onClick={() => setModal(null)}>
                Đóng
              </UiButton>
              <UiButton leftSection={<Upload size={16} />} onClick={() => setModal("materials")}>
                Quản lý học liệu
              </UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
      <UiModal
        opened={modal === "attendance"}
        onClose={() => setModal(null)}
        title={`Điểm danh · ${current?.className ?? ""}`}
      >
        <Stack>
          <Paper className="classInfoCallout" p="md">
            <Group gap="sm">
              <ClipboardCheck size={18} />
              <div>
                <Text fw={700}>
                  {current?.attendance}/{current?.students} học viên đã ghi nhận
                </Text>
                <Text size="sm" c="dimmed">
                  Đối chiếu danh sách lớp trước khi chốt.
                </Text>
              </div>
            </Group>
          </Paper>
          <UiSelect
            label="Trạng thái buổi"
            value="Đã điểm danh"
            onChange={() => undefined}
            data={["Đã điểm danh", "Có học viên vắng", "Cần xác minh"]}
          />
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setModal(null)}>
              Hủy
            </UiButton>
            <UiButton leftSection={<CheckCircle2 size={16} />} onClick={saveAttendance}>
              Ghi nhận điểm danh
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
      <UiModal
        opened={modal === "worklog"}
        onClose={() => setModal(null)}
        title={`Xác nhận công dạy · ${current?.className ?? ""}`}
      >
        <Stack>
          <Paper className="classInfoCallout" p="md">
            <Group gap="sm">
              <FileText size={18} />
              <div>
                <Text fw={700}>
                  {current?.date} · {current?.time}
                </Text>
                <Text size="sm" c="dimmed">
                  {current?.title} · {current?.attendance}/{current?.students} học viên
                </Text>
              </div>
            </Group>
          </Paper>
          <UiTextInput label="Số giờ công" value="1,5 giờ" readOnly />
          <Textarea
            label="Ghi chú gửi học vụ/payroll"
            value={worklogNote}
            onChange={(event) => setWorklogNote(event.currentTarget.value)}
            minRows={3}
            placeholder="Xác nhận nội dung đã hoàn thành, phát sinh hoặc cần đối soát..."
          />
          <Group justify="flex-end">
            <UiButton variant="default" onClick={() => setModal(null)}>
              Hủy
            </UiButton>
            <UiButton leftSection={<Send size={16} />} onClick={saveWorklog} disabled={!worklogNote.trim()}>
              Gửi xác nhận
            </UiButton>
          </Group>
        </Stack>
      </UiModal>
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <Paper className="classInfoCard classInfoCard--info" p="sm" withBorder>
      <Text className="classInfoLabel" size="xs">
        {label}
      </Text>
      <Text className="classInfoValue" fw={700}>
        {value}
      </Text>
    </Paper>
  );
}
