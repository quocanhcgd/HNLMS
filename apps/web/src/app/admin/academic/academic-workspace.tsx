"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { BookOpen, CalendarClock, CheckCircle2, GraduationCap, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiDataTable, UiEditModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { academicRegistryApi, getAcademicRegistry, getAcademicRegistryOptions, type AcademicRegistryOptions } from "@/lib/academic-registry-api";
import { readDemoSession, type DemoSession } from "@/lib/demo-auth";

type AcademicSection = "programs" | "classes";
type ProgramStatus = "Đã công bố" | "Bản nháp" | "Đang rà soát";
type ClassStatus = "Mở tuyển sinh" | "Sắp khai giảng" | "Đủ chỗ" | "Đang học";

type ProgramRow = {
  id: string;
  department: string;
  subject: string;
  code: string;
  name: string;
  level: string;
  moduleCount: number;
  competencyCount: number;
  blueprintVersion: number;
  version: number;
  owner: string;
  status: ProgramStatus;
  updatedAt: string;
};
type ProgramForm = Omit<ProgramRow, "id" | "blueprintVersion" | "version" | "owner" | "updatedAt"> & { id?: string };

type ClassRow = {
  id?: string;
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
type ClassForm = { id?: string; courseId: string; branchId: string; code: string; name: string; modality: "onsite" | "online" | "hybrid"; capacity: string; weekday: string; startsAt: string; endsAt: string };

const programs: ProgramRow[] = [
  {
    id: "program-teen-b1",
    department: "Ngoại ngữ",
    subject: "Tiếng Anh",
    code: "TEEN-B1",
    name: "Teen B1",
    level: "A1 → B1",
    moduleCount: 8,
    competencyCount: 4,
    blueprintVersion: 1,
    version: 1,
    owner: "Lan Anh",
    status: "Đã công bố",
    updatedAt: "20/08/2026",
  },
  {
    id: "program-math-foundation",
    department: "Khoa học tự nhiên",
    subject: "Toán",
    code: "MATH-FOUNDATION",
    name: "Nền tảng THCS",
    level: "Cơ bản → Khá",
    moduleCount: 6,
    competencyCount: 3,
    blueprintVersion: 1,
    version: 1,
    owner: "Nguyễn Huy",
    status: "Đã công bố",
    updatedAt: "21/08/2026",
  },
  {
    id: "program-lit-grade-10",
    department: "Khoa học xã hội",
    subject: "Ngữ văn",
    code: "LIT-GRADE-10",
    name: "Luyện thi 10",
    level: "Trung bình → Giỏi",
    moduleCount: 7,
    competencyCount: 3,
    blueprintVersion: 1,
    version: 1,
    owner: "Lê Chi",
    status: "Đã công bố",
    updatedAt: "22/08/2026",
  },
];

const demoClasses: ClassRow[] = [
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
  const [session, setSession] = useState<DemoSession | null>(null);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [status, setStatus] = useState<string | null>("all");
  // Defer the role-scoped filter until mount so SSR and the first client render stay identical.
  const [branch, setBranch] = useState<string | null>("all");
  const [classRows, setClassRows] = useState<ClassRow[]>(demoClasses);
  const [classEditing, setClassEditing] = useState<ClassForm | null>(null);
  const [programRows, setProgramRows] = useState<ProgramRow[]>(programs);
  const [programEditing, setProgramEditing] = useState<ProgramForm | null>(null);
  const [notice, setNotice] = useState("");
  const [options, setOptions] = useState<AcademicRegistryOptions>({ courses: programs.map((item) => ({ id: `course-${item.code}`, code: item.code, name: item.name })), classes: [], employees: [], branches: [{ id: "b1", name: "Cầu Giấy" }, { id: "b2", name: "Hai Bà Trưng" }] });
  useEffect(() => { setSession(readDemoSession()); }, []);
  const branchOptions = session?.role === "branch_manager" ? options.branches.filter((item) => item.id === (session.branchId ?? "b1")) : options.branches;
  useEffect(() => {
    if (session?.role === "branch_manager") setBranch("Cầu Giấy");
  }, [session?.role]);
  useEffect(() => {
    if (section !== "classes") return;
    void getAcademicRegistry("classes").then(({ data }) => setClassRows(data.map((item) => ({
      id: String(item.id),
      program: String(item.subject ?? ""),
      code: String(item.code),
      branch: item.branchId === "b1" ? "Cầu Giấy" : "Hai Bà Trưng",
      modality: item.modality === "online" ? "Trực tuyến" : item.modality === "hybrid" ? "Kết hợp" : "Trực tiếp",
      capacity: Number(item.capacity ?? 0),
      enrolled: Number(item.learners ?? 0),
      teacher: "Theo phân công",
      schedule: String(item.schedule ?? "Theo lịch lớp"),
      startDate: "Theo kế hoạch",
      status: item.status === "in_progress" ? "Đang học" : item.status === "full" ? "Đủ chỗ" : item.status === "open" ? "Mở tuyển sinh" : "Sắp khai giảng",
    })))).catch((error) => setNotice(`Không tải được danh sách lớp: ${error instanceof Error ? error.message : "lỗi không xác định"}.`));
  }, [section]);
  useEffect(() => {
    if (section !== "programs") return;
    void getAcademicRegistry("programs").then(({ data }) => setProgramRows(data.map((item) => ({
      id: String(item.id), department: String(item.department ?? "Đào tạo"), subject: String(item.subject ?? "Chưa phân loại"), code: String(item.code), name: String(item.name), level: String(item.level ?? "Theo cấu hình"), moduleCount: Number(item.moduleCount ?? 0), competencyCount: Number(item.competencyCount ?? 0), blueprintVersion: Number(item.blueprintVersion ?? 1), version: Number(item.version ?? 1), owner: String(item.owner ?? "Hội đồng học thuật"), status: item.status === "published" ? "Đã công bố" : item.status === "in_review" ? "Đang rà soát" : "Bản nháp", updatedAt: "29/08/2026",
    })))).catch((error) => setNotice(`Không tải được danh sách chương trình: ${error instanceof Error ? error.message : "lỗi không xác định"}.`));
  }, [section]);
  useEffect(() => {
    if (section !== "classes") return;
    void getAcademicRegistryOptions().then((result) => setOptions(result.data)).catch((error) => setNotice(`Không tải được danh mục dùng để mở lớp: ${error instanceof Error ? error.message : "lỗi không xác định"}.`));
  }, [section]);

  const saveClass = () => {
    if (!classEditing || !classEditing.code.trim() || !classEditing.name.trim() || !classEditing.courseId || !classEditing.branchId) return;
    const branchId = session?.role === "branch_manager" ? (session.branchId ?? "b1") : classEditing.branchId;
    const input = { code: classEditing.code.trim(), name: classEditing.name.trim(), capacity: Number(classEditing.capacity), modality: classEditing.modality, branchId, courseId: classEditing.courseId, ...(classEditing.startsAt && classEditing.endsAt ? { schedule: { weekday: Number(classEditing.weekday), startsAt: classEditing.startsAt, endsAt: classEditing.endsAt } } : {}) };
    const local = { id: classEditing.id ?? `class-${Date.now()}`, program: options.courses.find((item) => item.id === classEditing.courseId)?.name ?? "", code: input.code, branch: options.branches.find((item) => item.id === branchId)?.name ?? "", modality: input.modality === "online" ? "Trực tuyến" : input.modality === "hybrid" ? "Kết hợp" : "Trực tiếp", capacity: input.capacity, enrolled: 0, teacher: "Theo phân công", schedule: input.schedule ? `T${input.schedule.weekday} · ${input.schedule.startsAt}-${input.schedule.endsAt}` : "Theo lịch lớp", startDate: "Theo kế hoạch", status: "Mở tuyển sinh" as ClassStatus };
    const done = (result?: { id?: string }) => { const saved = { ...local, id: result?.id ?? local.id }; setClassRows((current) => current.some((row) => row.id === saved.id) ? current.map((row) => row.id === saved.id ? saved : row) : [saved, ...current]); setClassEditing(null); setNotice(`Đã lưu lớp ${saved.code}.`); };
    const request = classEditing.id ? academicRegistryApi.update("classes", classEditing.id, input) : academicRegistryApi.create("classes", input);
    void request.then(done).catch((error) => setNotice(`Không thể lưu lớp: ${error instanceof Error ? error.message : "lỗi không xác định"}.`));
  };

  const saveProgram = () => {
    if (!programEditing || !programEditing.code.trim() || !programEditing.name.trim()) { setNotice("Vui lòng nhập mã và tên chương trình."); return; }
    const input = { code: programEditing.code.trim(), name: programEditing.name.trim(), subject: programEditing.subject.trim(), department: programEditing.department.trim(), level: programEditing.level.trim(), moduleCount: Number(programEditing.moduleCount), competencyCount: Number(programEditing.competencyCount), status: programEditing.status === "Đã công bố" ? "published" : programEditing.status === "Đang rà soát" ? "in_review" : "draft" };
    const local = { ...programEditing, ...input, id: programEditing.id ?? `program-${Date.now()}`, blueprintVersion: 1, version: 1, owner: "Hội đồng học thuật", updatedAt: "29/08/2026" } as ProgramRow;
    const done = (result?: { id?: string }) => { const saved = { ...local, id: result?.id ?? local.id }; setProgramRows((current) => current.some((row) => row.id === saved.id) ? current.map((row) => row.id === saved.id ? saved : row) : [saved, ...current]); setProgramEditing(null); setNotice(`Đã lưu chương trình ${saved.name}.`); };
    const request = programEditing.id ? academicRegistryApi.update("programs", programEditing.id, input) : academicRegistryApi.create("programs", input);
    void request.then(done).catch((error) => setNotice(`Không thể lưu chương trình: ${error instanceof Error ? error.message : "lỗi không xác định"}.`));
  };

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
      { accessorKey: "subject", header: "Môn" },
      { accessorKey: "department", header: "Khối" },
      { accessorKey: "moduleCount", header: "Học phần", cell: ({ getValue }) => `${getValue<number>()} học phần` },
      { accessorKey: "competencyCount", header: "Nhóm năng lực", cell: ({ getValue }) => `${getValue<number>()} nhóm` },
      { accessorKey: "blueprintVersion", header: "Blueprint", cell: ({ getValue }) => `v${getValue<number>()}` },
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
      { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ edit: () => setProgramEditing(row.original), archive: () => { void academicRegistryApi.archive("programs", row.original.id).then(() => { setProgramRows((current) => current.filter((item) => item.id !== row.original.id)); setNotice(`Đã lưu trữ chương trình ${row.original.name}.`); }).catch((error) => setNotice(`Không thể lưu trữ chương trình: ${error instanceof Error ? error.message : "lỗi không xác định"}.`)); } }} labels={{ archive: "Ngừng sử dụng" }} /> },
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
      { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ edit: () => setClassEditing({ id: row.original.id, courseId: options.courses.find((item) => item.name === row.original.program)?.id ?? options.courses[0]?.id ?? "", branchId: options.branches.find((item) => item.name === row.original.branch)?.id ?? options.branches[0]?.id ?? "", code: row.original.code, name: row.original.program, modality: row.original.modality === "Trực tuyến" ? "online" : row.original.modality === "Kết hợp" ? "hybrid" : "onsite", capacity: String(row.original.capacity), weekday: "2", startsAt: "18:00", endsAt: "19:30" }), archive: () => { if (!row.original.id) return; void academicRegistryApi.archive("classes", row.original.id).then(() => { setClassRows((current) => current.filter((item) => item.id !== row.original.id)); setNotice(`Đã hủy lớp ${row.original.code}.`); }).catch((error) => setNotice(`Không thể hủy lớp: ${error instanceof Error ? error.message : "lỗi không xác định"}.`)); } }} labels={{ archive: "Hủy lớp" }} /> },
    ],
    [],
  );

  const isPrograms = section === "programs";
  const data = isPrograms ? programRows : classRows;
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
  const publishedPrograms = programRows.filter((item) => item.status === "Đã công bố").length;
  const activeClasses = classRows.filter((item) => item.status === "Đang học").length;
  const totalLearners = classRows.reduce((sum, item) => sum + item.enrolled, 0);
  const capacityRate = classRows.reduce((sum, item) => sum + item.capacity, 0)
    ? Math.round((totalLearners / classRows.reduce((sum, item) => sum + item.capacity, 0)) * 100)
    : 0;

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
      <PageHeader title={title} subtitle={subtitle} action={isPrograms ? "Tạo chương trình" : "Mở lớp mới"} onAction={isPrograms ? () => setProgramEditing({ department: "Đào tạo", subject: "", code: "", name: "", level: "Theo cấu hình", moduleCount: 0, competencyCount: 0, status: "Bản nháp" }) : () => setClassEditing({ courseId: options.courses[0]?.id ?? "", branchId: session?.branchId ?? options.branches[0]?.id ?? "", code: "", name: "", modality: "onsite", capacity: "20", weekday: "2", startsAt: "18:00", endsAt: "19:30" })} />
      <Paper withBorder p="lg" mb="md" className="panelHighlight" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group align="flex-start" gap="md"><ThemeIcon size={48} radius="md" color="primary"><BookOpen size={25} /></ThemeIcon><div><Text size="sm" c="dimmed">Trung tâm đào tạo</Text><Text fz={28} fw={800} lh={1.15}>{isPrograms ? `${publishedPrograms}/${programRows.length} chương trình đã công bố` : `${activeClasses} lớp đang học`}</Text><Text size="sm" c="dimmed" mt={6}>{isPrograms ? "Phiên bản chương trình và blueprint được kiểm soát trước khi mở lớp." : `${totalLearners} học viên · tỷ lệ lấp đầy ${capacityRate}%`}</Text></div></Group>
          <UiStatusBadge role="success" variant="dot">Đồng bộ học vụ</UiStatusBadge>
        </Group>
      </Paper>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <AcademicMetric icon={<BookOpen size={18} />} label="Chương trình" value={`${programRows.length}`} detail={`${publishedPrograms} đã công bố`} color="blue" />
        <AcademicMetric icon={<GraduationCap size={18} />} label="Lớp học" value={`${classRows.length}`} detail={`${activeClasses} đang học`} color="teal" />
        <AcademicMetric icon={<UsersRound size={18} />} label="Học viên" value={`${totalLearners}`} detail="đang được xếp lớp" color="violet" />
        <AcademicMetric icon={<CheckCircle2 size={18} />} label={isPrograms ? "Blueprint" : "Sức chứa"} value={isPrograms ? `${programRows.filter((item) => item.blueprintVersion > 0).length}` : `${capacityRate}%`} detail={isPrograms ? "đã có phiên bản" : "tỷ lệ lấp đầy"} color="orange" />
      </SimpleGrid>
      {notice ? <Text size="sm" c="teal" mb="sm">{notice}</Text> : null}
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
            data={session?.role === "branch_manager" ? [{ value: "Cầu Giấy", label: "Cầu Giấy" }] : [{ value: "all", label: "Tất cả chi nhánh" }, "Cầu Giấy", "Hai Bà Trưng", "Online"]}
          />
        ) : null}
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <Group justify="space-between" mb="sm"><div><Text fw={700}>{isPrograms ? "Danh mục chương trình" : "Danh sách lớp học"}</Text><Text size="sm" c="dimmed">{filteredData.length}/{data.length} bản ghi trong phạm vi đang lọc</Text></div><UiStatusBadge role="info">Cập nhật theo học vụ</UiStatusBadge></Group>
        <UiDataTable table={table} columnCount={columns.length} minWidth={isPrograms ? 1120 : 1160} emptyTitle={isPrograms ? "Không tìm thấy chương trình phù hợp." : "Không tìm thấy lớp học phù hợp."} />
        <Text size="xs" c="dimmed" mt="sm">Mọi chỉnh sửa mở trong modal và được ghi nhận theo phạm vi tổ chức/chi nhánh.</Text>
      </Paper>
      <UiEditModal opened={classEditing !== null} onClose={() => setClassEditing(null)} title={classEditing?.id ? "Chỉnh sửa lớp học" : "Mở lớp mới"} onSave={saveClass} saveLabel="Lưu lớp"><Stack>
        <UiSelect label="Khóa học" required value={classEditing?.courseId ?? null} onChange={(value) => setClassEditing((current) => current && value ? { ...current, courseId: value } : current)} data={options.courses.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))} searchable />
        <UiSelect label="Chi nhánh" required value={classEditing?.branchId ?? null} onChange={(value) => setClassEditing((current) => current && value ? { ...current, branchId: value } : current)} data={branchOptions.map((item) => ({ value: item.id, label: item.name }))} searchable disabled={session?.role === "branch_manager"} />
        <Group grow><UiTextInput label="Mã lớp" required value={classEditing?.code ?? ""} onChange={(event) => setClassEditing((current) => current ? { ...current, code: event.currentTarget.value } : current)} /><UiTextInput label="Tên lớp" required value={classEditing?.name ?? ""} onChange={(event) => setClassEditing((current) => current ? { ...current, name: event.currentTarget.value } : current)} /></Group>
        <Group grow><UiSelect label="Hình thức" value={classEditing?.modality ?? "onsite"} onChange={(value) => setClassEditing((current) => current && value ? { ...current, modality: value as ClassForm["modality"] } : current)} data={[{ value: "onsite", label: "Trực tiếp" }, { value: "online", label: "Trực tuyến" }, { value: "hybrid", label: "Kết hợp" }]} /><UiTextInput label="Sức chứa" type="number" value={classEditing?.capacity ?? "20"} onChange={(event) => setClassEditing((current) => current ? { ...current, capacity: event.currentTarget.value } : current)} /></Group>
        <Group grow><UiSelect label="Thứ" value={classEditing?.weekday ?? "2"} onChange={(value) => setClassEditing((current) => current && value ? { ...current, weekday: value } : current)} data={[1, 2, 3, 4, 5, 6, 7].map((item) => ({ value: String(item), label: `Thứ ${item}` }))} /><UiTextInput label="Bắt đầu" placeholder="18:00" value={classEditing?.startsAt ?? ""} onChange={(event) => setClassEditing((current) => current ? { ...current, startsAt: event.currentTarget.value } : current)} /><UiTextInput label="Kết thúc" placeholder="19:30" value={classEditing?.endsAt ?? ""} onChange={(event) => setClassEditing((current) => current ? { ...current, endsAt: event.currentTarget.value } : current)} /></Group>
      </Stack></UiEditModal>
      <UiEditModal opened={programEditing !== null} onClose={() => setProgramEditing(null)} title={programEditing?.id ? "Chỉnh sửa chương trình" : "Tạo chương trình"} onSave={saveProgram} saveLabel="Lưu chương trình"><Stack>
        <Group grow><UiTextInput label="Mã chương trình" required value={programEditing?.code ?? ""} onChange={(event) => setProgramEditing((current) => current ? { ...current, code: event.currentTarget.value } : current)} /><UiTextInput label="Tên chương trình" required value={programEditing?.name ?? ""} onChange={(event) => setProgramEditing((current) => current ? { ...current, name: event.currentTarget.value } : current)} /></Group>
        <Group grow><UiTextInput label="Khối / bộ môn" required value={programEditing?.department ?? ""} onChange={(event) => setProgramEditing((current) => current ? { ...current, department: event.currentTarget.value } : current)} /><UiTextInput label="Môn học" required value={programEditing?.subject ?? ""} onChange={(event) => setProgramEditing((current) => current ? { ...current, subject: event.currentTarget.value } : current)} /></Group>
        <UiTextInput label="Cấp độ / đối tượng" value={programEditing?.level ?? ""} onChange={(event) => setProgramEditing((current) => current ? { ...current, level: event.currentTarget.value } : current)} />
        <Group grow><UiTextInput label="Số học phần" type="number" value={String(programEditing?.moduleCount ?? 0)} onChange={(event) => setProgramEditing((current) => current ? { ...current, moduleCount: Number(event.currentTarget.value) } : current)} /><UiTextInput label="Nhóm năng lực" type="number" value={String(programEditing?.competencyCount ?? 0)} onChange={(event) => setProgramEditing((current) => current ? { ...current, competencyCount: Number(event.currentTarget.value) } : current)} /></Group>
        <UiSelect label="Trạng thái" value={programEditing?.status ?? "Bản nháp"} onChange={(value) => setProgramEditing((current) => current && value ? { ...current, status: value as ProgramStatus } : current)} data={["Bản nháp", "Đang rà soát", "Đã công bố"]} />
      </Stack></UiEditModal>
    </div>
  );
}

function AcademicMetric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>;
}
