"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { CheckCircle2, ClipboardList, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiEditModal, UiModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { academicRegistryApi, getAcademicRegistry, getAcademicRegistryOptions, type AcademicRegistryOptions } from "@/lib/academic-registry-api";

type RegistrySection = "students" | "assignments" | "contents" | "library";
type Status = "Đang học" | "Cần theo dõi" | "Chờ phân công" | "Đã phân công" | "Chờ duyệt" | "Đã công bố" | "Hạn chế";
type RegistryRow = {
  id: string;
  primary: string;
  detail: string;
  program: string;
  branch: string;
  owner: string;
  schedule: string;
  updatedAt: string;
  status: Status;
  downloadAllowed?: boolean;
  classId?: string;
  employeeId?: string;
  weeklyHours?: number;
};

type RegistryConfig = {
  title: string;
  subtitle: string;
  createLabel: string;
  searchPlaceholder: string;
  primaryHeader: string;
  programHeader: string;
  ownerHeader: string;
  rows: RegistryRow[];
};

const configs: Record<RegistrySection, RegistryConfig> = {
  students: {
    title: "Quản lý học viên",
    subtitle: "Theo dõi hồ sơ, ghi danh, lớp đang học và cảnh báo học vụ trong phạm vi cơ sở.",
    createLabel: "Thêm học viên",
    searchPlaceholder: "Tìm học viên, lớp hoặc chương trình...",
    primaryHeader: "Học viên",
    programHeader: "Lớp / chương trình",
    ownerHeader: "Phụ trách",
    rows: [
      { id: "student-1", primary: "Nguyễn Minh Anh", detail: "HV-260801 · Đã hoàn tất đầu vào", program: "IF-2609 · IELTS Foundation", branch: "Cầu Giấy", owner: "Học vụ · Thu Hà", schedule: "18:00 T2/T4/T6", updatedAt: "26/08/2026", status: "Đang học" },
      { id: "student-2", primary: "Trần Gia Huy", detail: "HV-260802 · Cần bổ sung hồ sơ", program: "MATH-2609 · Toán nền tảng", branch: "Cầu Giấy", owner: "Học vụ · Thu Hà", schedule: "17:30 T3/T5", updatedAt: "25/08/2026", status: "Cần theo dõi" },
      { id: "student-3", primary: "Lê Bảo Ngọc", detail: "HV-260803 · Đã ghi danh", program: "TOEIC-2609 · TOEIC 700+", branch: "Cầu Giấy", owner: "Học vụ · Minh Quân", schedule: "19:45 T2/T5", updatedAt: "24/08/2026", status: "Đang học" },
    ],
  },
  assignments: {
    title: "Phân công giảng dạy",
    subtitle: "Điều phối giáo viên, trợ giảng và tải dạy theo lớp, lịch rảnh và chuyên môn.",
    createLabel: "Tạo phân công",
    searchPlaceholder: "Tìm lớp, giáo viên hoặc ca học...",
    primaryHeader: "Lớp học",
    programHeader: "Chương trình",
    ownerHeader: "Nhân sự giảng dạy",
    rows: [
      { id: "assignment-1", primary: "IF-2609", detail: "Lớp IELTS Foundation · 11/12 học viên", program: "Ngoại ngữ · IELTS Foundation", branch: "Cầu Giấy", owner: "GV Lan Anh · TA Minh Tuấn", schedule: "T2/T4/T6 · 18:00-19:30", updatedAt: "26/08/2026", status: "Đã phân công" },
      { id: "assignment-2", primary: "MATH-2609", detail: "Lớp Toán nền tảng · 14/16 học viên", program: "Toán · Nền tảng THCS", branch: "Cầu Giấy", owner: "Chờ xác nhận giáo viên", schedule: "T3/T5 · 17:30-19:00", updatedAt: "25/08/2026", status: "Chờ phân công" },
      { id: "assignment-3", primary: "TOEIC-2609", detail: "Lớp TOEIC 700+ · 9/16 học viên", program: "Ngoại ngữ · TOEIC 700+", branch: "Cầu Giấy", owner: "GV Minh Tuấn · TA Hương Giang", schedule: "T2/T5 · 19:45-21:15", updatedAt: "24/08/2026", status: "Đã phân công" },
    ],
  },
  contents: {
    title: "Nội dung học tập",
    subtitle: "Kiểm duyệt học liệu theo môn, lớp và phạm vi công bố trước khi học viên truy cập.",
    createLabel: "Tạo học liệu",
    searchPlaceholder: "Tìm học liệu, lớp hoặc người soạn...",
    primaryHeader: "Học liệu",
    programHeader: "Môn / chương trình",
    ownerHeader: "Người soạn",
    rows: [
      { id: "content-1", primary: "Unit 1 · Listening foundations", detail: "Video + bài đọc · Buổi 01", program: "Tiếng Anh · IELTS Foundation", branch: "Cầu Giấy", owner: "Lan Anh", schedule: "Áp dụng IF-2609", updatedAt: "26/08/2026", status: "Đã công bố", downloadAllowed: false },
      { id: "content-2", primary: "Hàm số bậc nhất", detail: "Slide + bài luyện tập · Buổi 02", program: "Toán · Nền tảng THCS", branch: "Cầu Giấy", owner: "Nguyễn Huy", schedule: "Áp dụng MATH-2609", updatedAt: "25/08/2026", status: "Chờ duyệt", downloadAllowed: false },
      { id: "content-3", primary: "Chiến lược Part 3 TOEIC", detail: "Tài liệu đọc trực tuyến · Buổi 03", program: "Tiếng Anh · TOEIC 700+", branch: "Cầu Giấy", owner: "Minh Tuấn", schedule: "Áp dụng TOEIC-2609", updatedAt: "24/08/2026", status: "Đã công bố", downloadAllowed: false },
    ],
  },
  library: {
    title: "Thư viện quản trị",
    subtitle: "Quản lý tài nguyên dùng chung, quyền xem trực tuyến và phạm vi khai thác theo chương trình.",
    createLabel: "Thêm tài nguyên",
    searchPlaceholder: "Tìm tài nguyên, môn học hoặc người quản lý...",
    primaryHeader: "Tài nguyên",
    programHeader: "Phạm vi học tập",
    ownerHeader: "Quản lý",
    rows: [
      { id: "library-1", primary: "Cambridge practice collection", detail: "PDF đọc trực tuyến · 12 tài liệu", program: "Ngoại ngữ · IELTS / TOEIC", branch: "Toàn tổ chức", owner: "Hội đồng học thuật", schedule: "Học viên được ghi danh", updatedAt: "26/08/2026", status: "Đã công bố", downloadAllowed: false },
      { id: "library-2", primary: "Ngân hàng bài tập Toán 9", detail: "Bài tập có thể giao về nhà · 48 câu", program: "Toán · THCS", branch: "Cầu Giấy", owner: "Nguyễn Huy", schedule: "Lớp MATH-2609", updatedAt: "25/08/2026", status: "Hạn chế", downloadAllowed: false },
      { id: "library-3", primary: "Kỹ năng ghi chú học thuật", detail: "Video nội bộ · 18 phút", program: "Kỹ năng học tập · Đa ngành", branch: "Toàn tổ chức", owner: "Bộ phận học vụ", schedule: "Chờ phê duyệt xuất bản", updatedAt: "24/08/2026", status: "Chờ duyệt", downloadAllowed: false },
    ],
  },
};

const statusRole: Record<Status, "success" | "warning" | "info" | "neutral"> = {
  "Đang học": "success",
  "Cần theo dõi": "warning",
  "Chờ phân công": "warning",
  "Đã phân công": "success",
  "Chờ duyệt": "warning",
  "Đã công bố": "success",
  "Hạn chế": "info",
};

const blankRow: RegistryRow = { id: "", primary: "", detail: "", program: "", branch: "Cầu Giấy", owner: "", schedule: "", updatedAt: "", status: "Chờ duyệt" };
const demoOptions: AcademicRegistryOptions = {
  courses: [
    { id: "course-if-2609", code: "IF-2609", name: "IELTS Foundation" },
    { id: "course-math-2609", code: "MATH-2609", name: "Toán nền tảng" },
    { id: "course-toeic-2609", code: "TOEIC-2609", name: "TOEIC 700+" },
  ],
  classes: [
    { id: "class-if-2609", code: "IF-2609", name: "IELTS Foundation", branchId: "b1", status: "open" },
    { id: "class-math-2609", code: "MATH-2609", name: "Toán nền tảng", branchId: "b1", status: "open" },
    { id: "class-toeic-2609", code: "TOEIC-2609", name: "TOEIC 700+", branchId: "b1", status: "open" },
  ],
  employees: [
    { id: "employee-lan-anh", employeeCode: "GV-001", jobTitle: "Lan Anh · Giảng viên IELTS", branchId: "b1", status: "active" },
    { id: "employee-minh-tuan", employeeCode: "GV-002", jobTitle: "Minh Tuấn · Trợ giảng TOEIC", branchId: "b1", status: "active" },
  ],
  branches: [{ id: "b1", name: "Cầu Giấy" }],
};

function errorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    schedule_conflict: "Lịch bị trùng giáo viên, phòng hoặc phiên học trực tuyến.",
    teacher_workload_exceeded: "Tải dạy của giáo viên vượt quá giới hạn 40 giờ/tuần.",
    branch_scope_denied: "Bản ghi nằm ngoài phạm vi chi nhánh được phân quyền.",
    employee_not_found: "Không tìm thấy nhân viên đang hoạt động.",
    class_not_found: "Không tìm thấy lớp học hợp lệ.",
    capacity_exceeded: "Lớp đã đủ sức chứa, không thể ghi danh thêm học viên.",
    invalid_weekly_hours: "Số giờ dạy mỗi tuần phải lớn hơn 0.",
    student_code_already_exists: "Mã học viên đã tồn tại.",
    student_details_invalid: "Vui lòng nhập đủ mã và họ tên học viên.",
  };
  return messages[code] ?? "Không thể lưu thay đổi. Vui lòng kiểm tra lại dữ liệu.";
}

export function OperationsRegistryWorkspace({ section }: { section: RegistrySection }) {
  const config = configs[section];
  const [rows, setRows] = useState(config.rows);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<RegistryRow | null>(null);
  const [viewing, setViewing] = useState<RegistryRow | null>(null);
  const [notice, setNotice] = useState("");
  const [options, setOptions] = useState<AcademicRegistryOptions>(demoOptions);
  useEffect(() => {
    if (section !== "students" && section !== "assignments") return;
    const apiSection = section === "students" ? "students" : "assignments";
    void Promise.all([getAcademicRegistry(apiSection), getAcademicRegistryOptions()]).then(([registry, optionResult]) => {
      setOptions(optionResult.data);
      const branchNames = new Map(optionResult.data.branches.map((branch) => [branch.id, branch.name]));
      const classNames = new Map(optionResult.data.classes.map((academicClass) => [academicClass.id, `${academicClass.code} · ${academicClass.name}`]));
      const mapped = registry.data.map((item) => {
        const branchId = item.branchId === undefined ? "" : String(item.branchId);
        const classId = item.classId === undefined ? undefined : String(item.classId);
        return section === "students"
          ? { id: item.id, primary: String(item.name), detail: String(item.code), program: String(item.className), branch: branchNames.get(branchId) ?? branchId, owner: "Học vụ cơ sở", schedule: "Theo lớp", updatedAt: "29/08/2026", status: "Đang học" as Status, classId }
          : { id: item.id, primary: String(item.className), detail: String(item.role ?? "teacher"), program: String(item.subject), branch: branchNames.get(branchId) ?? branchId, owner: String(item.teacher), schedule: classNames.get(classId ?? "") ?? "Theo kế hoạch lớp", updatedAt: "29/08/2026", status: "Đã phân công" as Status, classId, employeeId: item.employeeId === undefined ? undefined : String(item.employeeId), weeklyHours: Number(item.sessions ?? 0) };
      });
      setRows(mapped);
    }).catch(() => setNotice("Không tải được dữ liệu đào tạo theo phạm vi cơ sở."));
  }, [section]);
  const visibleRows = useMemo(() => rows.filter((row) => (status === "all" || row.status === status) && JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [query, rows, status]);
  const columns = useMemo<ColumnDef<RegistryRow>[]>(() => [
    { accessorKey: "primary", header: config.primaryHeader, cell: ({ row }) => <div><Text fw={650}>{row.original.primary}</Text><Text size="xs" c="dimmed">{row.original.detail}</Text></div> },
    { accessorKey: "program", header: config.programHeader },
    { accessorKey: "branch", header: "Cơ sở" },
    { accessorKey: "owner", header: config.ownerHeader },
    { accessorKey: "schedule", header: "Lịch / phạm vi" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<Status>(); return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ view: () => setViewing(row.original), edit: () => setEditing(row.original), archive: () => { const removeLocal = () => { setRows((current) => current.filter((item) => item.id !== row.original.id)); setNotice(`Đã lưu trữ ${row.original.primary}.`); }; if (section === "students" || section === "assignments") void academicRegistryApi.archive(section, row.original.id).then(removeLocal).catch((error) => setNotice(errorMessage(error))); else removeLocal(); } }} labels={{ archive: "Lưu trữ" }} /> },
  ], [config.primaryHeader, config.programHeader, config.ownerHeader, section]);
  const table = useReactTable({ data: visibleRows, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  const save = () => {
    if (!editing || (isAssignment ? (!editing.classId || !editing.employeeId) : !editing.primary.trim())) return;
    const updated = { ...editing, id: editing.id || `${section}-${Date.now()}`, updatedAt: "26/08/2026" };
    const saveLocal = (result?: Record<string, unknown>) => { const saved = { ...updated, ...(result?.id ? { id: String(result.id) } : {}) }; setRows((current) => current.some((item) => item.id === updated.id) ? current.map((item) => item.id === updated.id ? saved : item) : [saved, ...current]); setEditing(null); setNotice(`Đã lưu ${saved.primary}.`); };
    const isCreating = !editing.id;
    if (section === "students" && isCreating && updated.classId) {
      void academicRegistryApi.create("students", { fullName: updated.primary, studentCode: updated.detail || `HV-${Date.now()}`, classId: updated.classId }).then((result) => saveLocal(result)).catch((error) => setNotice(errorMessage(error)));
    } else if (section === "assignments" && isCreating && updated.classId && updated.employeeId) {
      void academicRegistryApi.create("assignments", { classId: updated.classId, employeeId: updated.employeeId, role: updated.detail || "teacher", weeklyHours: updated.weeklyHours ?? 0 }).then((result) => saveLocal(result)).catch((error) => setNotice(errorMessage(error)));
    } else if ((section === "students" || section === "assignments") && editing.id) {
      const payload = section === "students" ? { fullName: updated.primary, status: updated.status === "Đang học" ? "active" : "paused" } : { weeklyHours: updated.weeklyHours, role: updated.detail, status: updated.status === "Đã phân công" ? "active" : "ended" };
      const apiSection = section === "students" ? "students" : "assignments";
      void academicRegistryApi.update(apiSection, updated.id, payload).then((result) => saveLocal(result)).catch((error) => setNotice(errorMessage(error)));
    } else saveLocal();
  };
  const isStudent = section === "students";
  const isAssignment = section === "assignments";
  const classOptions = options.classes.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }));
  const employeeOptions = options.employees.map((item) => ({ value: item.id, label: `${item.employeeCode} · ${item.jobTitle}` }));
  const activeCount = rows.filter((row) => row.status === "Đang học" || row.status === "Đã phân công" || row.status === "Đã công bố").length;
  const pendingCount = rows.filter((row) => row.status === "Chờ duyệt" || row.status === "Chờ phân công").length;
  const branchCount = new Set(rows.map((row) => row.branch).filter(Boolean)).size;
  return <div className="page"><PageHeader title={config.title} subtitle={config.subtitle} action={config.createLabel} onAction={() => setEditing({ ...blankRow, status: isAssignment ? "Chờ phân công" : isStudent ? "Đang học" : "Chờ duyệt" })} />
    <Paper withBorder p="lg" mb="md" className="panelHighlight" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap"><Group gap="md"><ThemeIcon size={46} radius="md" color="primary"><ClipboardList size={23} /></ThemeIcon><div><Text size="sm" c="dimmed">Trung tâm học vụ</Text><Text fz={27} fw={800}>{activeCount} bản ghi đang hiệu lực</Text><Text size="sm" c="dimmed" mt={4}>Dữ liệu được gom theo một bảng chính để dễ theo dõi và xử lý.</Text></div></Group><UiStatusBadge role="success" variant="dot">Đồng bộ nghiệp vụ</UiStatusBadge></Group></Paper>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md"><RegistryMetric icon={<ClipboardList size={18} />} label="Tổng bản ghi" value={`${rows.length}`} detail={config.title} color="blue" /><RegistryMetric icon={<CheckCircle2 size={18} />} label="Đang hiệu lực" value={`${activeCount}`} detail="đã sẵn sàng sử dụng" color="teal" /><RegistryMetric icon={<UsersRound size={18} />} label="Phạm vi cơ sở" value={`${branchCount}`} detail="chi nhánh có dữ liệu" color="violet" /><RegistryMetric icon={<ClipboardList size={18} />} label="Chờ xử lý" value={`${pendingCount}`} detail="cần phê duyệt / phân công" color="orange" /></SimpleGrid>
    <PageToolbar className="toolbar" justify="space-between"><Group><UiTextInput aria-label="Tìm kiếm" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder={config.searchPlaceholder} /><UiSelect aria-label="Lọc trạng thái" value={status} onChange={setStatus} data={[{ value: "all", label: "Tất cả trạng thái" }, ...Array.from(new Set(rows.map((row) => row.status)))]} w={190} /></Group><Text size="sm" c="dimmed">{visibleRows.length}/{rows.length} bản ghi</Text></PageToolbar>
    {notice ? <Text size="sm" c="teal" mb="sm">{notice}</Text> : null}
    <Paper className="panel" p="md" withBorder><UiDataTable table={table} columnCount={columns.length} minWidth={1120} emptyTitle="Không tìm thấy bản ghi phù hợp." /><Text size="xs" c="dimmed" mt="sm">Mỗi bản ghi được quản lý tại một bảng chính; mọi chỉnh sửa mở trong modal và được ghi nhận theo phạm vi cơ sở.</Text></Paper>
    <UiEditModal opened={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? `Chỉnh sửa ${isAssignment ? "phân công" : config.primaryHeader.toLowerCase()}` : config.createLabel} onSave={save} saveLabel="Lưu thay đổi"><Stack>
      {!isAssignment ? <UiTextInput label={config.primaryHeader} required value={editing?.primary ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, primary: event.currentTarget.value } : current)} /> : null}
      {isStudent ? <><UiTextInput label="Mã học viên" required value={editing?.detail ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, detail: event.currentTarget.value } : current)} /><UiSelect label="Lớp học" required value={editing?.classId ?? null} onChange={(value) => setEditing((current) => current && value ? { ...current, classId: value, program: classOptions.find((item) => item.value === value)?.label ?? current.program } : current)} data={classOptions} searchable /></> : null}
      {isAssignment ? <><UiSelect label="Lớp học" required value={editing?.classId ?? null} onChange={(value) => setEditing((current) => current && value ? { ...current, classId: value, primary: classOptions.find((item) => item.value === value)?.label ?? current.primary } : current)} data={classOptions} searchable /><UiSelect label="Giáo viên / nhân viên" required value={editing?.employeeId ?? null} onChange={(value) => setEditing((current) => current && value ? { ...current, employeeId: value, owner: employeeOptions.find((item) => item.value === value)?.label ?? current.owner } : current)} data={employeeOptions} searchable /><UiTextInput label="Vai trò" value={editing?.detail ?? "teacher"} onChange={(event) => setEditing((current) => current ? { ...current, detail: event.currentTarget.value } : current)} /><UiTextInput label="Số giờ/tuần" type="number" value={String(editing?.weeklyHours ?? 0)} onChange={(event) => setEditing((current) => current ? { ...current, weeklyHours: Number(event.currentTarget.value) } : current)} /></> : null}
      {!isStudent && !isAssignment ? <><UiTextInput label="Mô tả" value={editing?.detail ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, detail: event.currentTarget.value } : current)} /><UiTextInput label={config.programHeader} value={editing?.program ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, program: event.currentTarget.value } : current)} /><UiTextInput label={config.ownerHeader} value={editing?.owner ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, owner: event.currentTarget.value } : current)} /><UiTextInput label="Lịch / phạm vi" value={editing?.schedule ?? ""} onChange={(event) => setEditing((current) => current ? { ...current, schedule: event.currentTarget.value } : current)} /></> : null}
      <UiSelect label="Trạng thái" value={editing?.status ?? "Chờ duyệt"} onChange={(value) => setEditing((current) => current && value ? { ...current, status: value as Status } : current)} data={Object.keys(statusRole)} />
    </Stack></UiEditModal>
    <UiModal opened={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `${section === "contents" ? "Xem học liệu" : section === "library" ? "Xem tài nguyên" : `Xem ${config.primaryHeader.toLowerCase()}`} · ${viewing.primary}` : "Xem chi tiết"} size="lg">
      {viewing ? <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <div><Text fw={750} fz={20}>{viewing.primary}</Text><Text size="sm" c="dimmed">{viewing.detail}</Text></div>
          <UiStatusBadge role={statusRole[viewing.status]}>{viewing.status}</UiStatusBadge>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <div><Text size="xs" c="dimmed">{config.programHeader}</Text><Text size="sm">{viewing.program || "Chưa cập nhật"}</Text></div>
          <div><Text size="xs" c="dimmed">Cơ sở</Text><Text size="sm">{viewing.branch || "Toàn tổ chức"}</Text></div>
          <div><Text size="xs" c="dimmed">{config.ownerHeader}</Text><Text size="sm">{viewing.owner || "Chưa phân công"}</Text></div>
          <div><Text size="xs" c="dimmed">Lịch / phạm vi</Text><Text size="sm">{viewing.schedule || "Chưa cập nhật"}</Text></div>
        </SimpleGrid>
        {section === "contents" || section === "library" ? <AccessPolicyPanel downloadAllowed={viewing.downloadAllowed === true} /> : null}
        <Group justify="flex-end"><UiButton variant="default" onClick={() => setViewing(null)}>Đóng</UiButton></Group>
      </Stack> : null}
    </UiModal>
  </div>;
}

function AccessPolicyPanel({ downloadAllowed }: { downloadAllowed: boolean }) {
  return <Paper withBorder p="md" className="panelHighlight">
    <Text fw={650}>Quyền xem và tải xuống</Text>
    <Text size="sm" mt="sm"><strong>Được xem trực tuyến:</strong> chỉ với học liệu đã công bố; học viên đã ghi danh trong lớp/chương trình; giáo viên và trợ giảng được phân công; phụ huynh chỉ khi có ủy quyền học tập tương ứng.</Text>
    <Text size="sm" c="dimmed" mt={6}>Nhân sự quản lý học liệu (Quản trị vận hành, Quản lý đào tạo, Kiểm duyệt học liệu) được xem theo phạm vi tổ chức/chi nhánh được cấp.</Text>
    <Group gap="xs" mt="sm"><Text size="sm"><strong>Tải xuống:</strong> chỉ được cấp khi chính sách của chính tài nguyên bật và người dùng vẫn đúng phạm vi.</Text><UiStatusBadge role={downloadAllowed ? "success" : "neutral"}>{downloadAllowed ? "Được cấp" : "Chưa cấp"}</UiStatusBadge></Group>
    {!downloadAllowed ? <Text size="xs" c="dimmed" mt={4}>Bản ghi này hiện chỉ hỗ trợ xem trực tuyến; không phát sinh quyền tải file gốc.</Text> : null}
  </Paper>;
}

function RegistryMetric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>;
}
