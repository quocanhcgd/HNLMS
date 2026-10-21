"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Badge, Group, Paper, Progress, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { BarChart3, CheckCircle2, ClipboardCheck, LifeBuoy, Save, Search, Send } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { listStaffCompetencyProfiles } from "@/lib/competency-profiles";
import { competencyProfileApi } from "@/lib/competency-profile-api";

type ProfileRow = Omit<CompetencyProfileReadModel, "reviewStatus" | "publicationStatus" | "confidence"> & {
  skills: CompetencyProfileReadModel[];
  reviewStatus: CompetencyProfileReadModel["reviewStatus"];
  publicationStatus: CompetencyProfileReadModel["publicationStatus"];
  confidence: number;
};
const reviewLabels = { pending_review: "Chờ rà soát", confirmed: "Đã xác nhận", needs_support: "Cần hỗ trợ" } as const;
const reviewRoles = { pending_review: "warning", confirmed: "success", needs_support: "danger" } as const;

function groupProfiles(rows: CompetencyProfileReadModel[]): ProfileRow[] {
  const groups = new Map<string, ProfileRow>();
  for (const row of rows) {
    const key = `${row.studentId}:${row.subjectId}:${row.programId}:${row.classId}`;
    const current = groups.get(key);
    if (current) {
      current.skills.push(row);
      continue;
    }
    groups.set(key, {
      ...row,
      skills: [row],
      reviewStatus: row.reviewStatus,
      publicationStatus: row.publicationStatus,
      confidence: row.confidence,
    });
  }
  return [...groups.values()].map((profile) => {
    const statuses = profile.skills.map((skill) => skill.reviewStatus);
    const reviewStatus = statuses.includes("needs_support")
      ? "needs_support"
      : statuses.every((status) => status === "confirmed")
        ? "confirmed"
        : "pending_review";
    const publicationStatus = profile.skills.every((skill) => skill.publicationStatus === "published")
      ? "published"
      : profile.skills.some((skill) => skill.publicationStatus === "pending_publication")
        ? "pending_publication"
        : "draft";
    return {
      ...profile,
      reviewStatus,
      publicationStatus,
      confidence: Math.round(profile.skills.reduce((sum, skill) => sum + skill.confidence, 0) / profile.skills.length),
    };
  });
}

export function TeacherEnglishWorkspace() {
  const [allRows, setAllRows] = useState(() => listStaffCompetencyProfiles());
  useEffect(() => {
    let active = true;
    void competencyProfileApi
      .list()
      .then((profiles) => {
        if (active && profiles.length) setAllRows(profiles);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  const rows = useMemo(() => groupProfiles(allRows), [allRows]);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [subject, setSubject] = useState<string | null>("all");
  const [program, setProgram] = useState<string | null>("all");
  const [classId, setClassId] = useState<string | null>(() => searchParams.get("classId") ?? "all");
  const [source, setSource] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<ProfileRow | null>(null);
  const [note, setNote] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({});
  const [publicationRequests, setPublicationRequests] = useState<Set<string>>(() => new Set());
  const [notice, setNotice] = useState<{ color: "teal" | "yellow" | "blue"; text: string } | null>(null);
  const data = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === "all" || row.reviewStatus === status) &&
          (subject === "all" || row.subjectId === subject) &&
          (program === "all" || row.programId === program) &&
          (classId === "all" || row.classId === classId) &&
          (source === "all" || row.skills.some((skill) => skill.evidence.sourceType === source)) &&
          (!fromDate || row.skills.some((skill) => skill.evidence.assessedAt.slice(0, 10) >= fromDate)) &&
          (!toDate || row.skills.some((skill) => skill.evidence.assessedAt.slice(0, 10) <= toDate)) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [classId, fromDate, program, query, rows, source, status, subject, toDate],
  );
  const openReview = (row: ProfileRow) => {
    setSelected(row);
    setNote(row.teacherFeedback ?? "");
    setSkillLevels(Object.fromEntries(row.skills.map((skill) => [skill.profileId, skill.current.label])));
    setNotice(null);
  };
  const selectedKey = selected
    ? `${selected.studentId}:${selected.subjectId}:${selected.programId}:${selected.classId}`
    : "";
  const updateSelectedSkills = (reviewStatus?: CompetencyProfileReadModel["reviewStatus"]) => {
    if (!selected) return;
    setAllRows((current) =>
      current.map((skill) => {
        if (!selected.skills.some((item) => item.profileId === skill.profileId)) return skill;
        return {
          ...skill,
          current: { ...skill.current, label: skillLevels[skill.profileId] || skill.current.label },
          teacherFeedback: note.trim() || skill.teacherFeedback,
          ...(reviewStatus ? { reviewStatus } : {}),
        };
      }),
    );
  };
  const persistReview = async (action: string) => {
    if (!selected) return true;
    try {
      await competencyProfileApi.review({
        action,
        profileIds: selected.skills.map((skill) => skill.profileId),
        updates: selected.skills.map((skill) => ({
          profileId: skill.profileId,
          current: skillLevels[skill.profileId] || skill.current.label,
          teacherFeedback: note.trim() || undefined,
        })),
        teacherFeedback: note.trim() || undefined,
      });
      return true;
    } catch {
      return false;
    }
  };
  const saveDraft = async () => {
    const persisted = await persistReview("save_draft");
    updateSelectedSkills();
    setNotice({
      color: persisted ? "teal" : "yellow",
      text: persisted
        ? `Đã lưu bản nháp rà soát cho ${selected?.studentName}.`
        : "Đã cập nhật bản nháp cục bộ; API chưa phản hồi.",
    });
  };
  const confirmReview = async () => {
    if (!selected || selected.skills.some((skill) => !(skillLevels[skill.profileId] || skill.current.label).trim())) {
      setNotice({ color: "yellow", text: "Cần nhập mức đánh giá cho tất cả nhóm năng lực trước khi xác nhận." });
      return;
    }
    const persisted = await persistReview("confirm_review");
    updateSelectedSkills("confirmed");
    setNotice({
      color: persisted ? "teal" : "yellow",
      text: persisted
        ? `Đã xác nhận đánh giá cho ${selected.studentName}.`
        : "Đã cập nhật xác nhận cục bộ; API chưa phản hồi.",
    });
    setSelected(null);
  };
  const markNeedsSupport = async () => {
    const persisted = await persistReview("request_support");
    updateSelectedSkills("needs_support");
    setNotice({
      color: persisted ? "yellow" : "yellow",
      text: persisted
        ? `Đã tạo yêu cầu hỗ trợ cho ${selected?.studentName}; hồ sơ chưa được công bố.`
        : "Đã tạo yêu cầu hỗ trợ cục bộ; API chưa phản hồi.",
    });
    setSelected(null);
  };
  const requestPublication = async () => {
    if (!selected || selected.skills.some((skill) => skill.reviewStatus !== "confirmed")) {
      setNotice({ color: "yellow", text: "Chỉ gửi đề xuất công bố sau khi đã xác nhận đủ các nhóm năng lực." });
      return;
    }
    if (selected.publicationStatus === "published") {
      setNotice({ color: "yellow", text: "Hồ sơ này đã được công bố; không cần gửi lại đề xuất." });
      return;
    }
    const persisted = await persistReview("request_publication");
    setPublicationRequests((current) => new Set(current).add(selectedKey));
    setNotice({
      color: persisted ? "blue" : "yellow",
      text: persisted
        ? `Đã gửi đề xuất công bố hồ sơ ${selected.studentName} cho học vụ.`
        : "Đã ghi nhận đề xuất cục bộ; API chưa phản hồi.",
    });
    setSelected(null);
  };
  const columns = useMemo<ColumnDef<ProfileRow>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Học viên",
        cell: ({ row }) => (
          <div>
            <Text fw={650}>{row.original.studentName}</Text>
            <Text size="xs" c="dimmed">
              {row.original.className} · {row.original.subjectName}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: "programName",
        header: "Chương trình",
        cell: ({ row }) => (
          <div>
            <Text size="sm">{row.original.programName}</Text>
            <Text size="xs" c="dimmed">
              {row.original.skills.length} nhóm năng lực
            </Text>
          </div>
        ),
      },
      {
        id: "skills",
        header: "Năng lực",
        enableSorting: false,
        cell: ({ row }) => (
          <Group gap={5} wrap="wrap">
            {row.original.skills.map((skill) => (
              <Badge key={skill.profileId} variant="light" color="blue">
                {skill.competencyName}: {skill.current.label}
              </Badge>
            ))}
          </Group>
        ),
      },
      { id: "baseline", accessorFn: (row) => row.baseline.label, header: "Đầu vào" },
      { id: "target", accessorFn: (row) => row.target.label, header: "Mục tiêu" },
      {
        id: "evidence",
        header: "Minh chứng gần nhất",
        cell: ({ row }) => (
          <div>
            <Text size="sm">{row.original.evidence.sourceLabel}</Text>
            <Text size="xs" c="dimmed">
              {row.original.evidence.summary}
            </Text>
          </div>
        ),
      },
      {
        id: "confidence",
        header: "Tin cậy",
        cell: ({ row }) => (
          <UiStatusBadge role={row.original.confidence < 60 ? "warning" : "info"}>
            {Math.round(
              row.original.skills.reduce((sum, skill) => sum + skill.confidence, 0) / row.original.skills.length,
            )}
            %
          </UiStatusBadge>
        ),
      },
      {
        accessorKey: "reviewStatus",
        header: "Trạng thái",
        cell: ({ row }) => (
          <UiStatusBadge role={reviewRoles[row.original.reviewStatus]}>
            {reviewLabels[row.original.reviewStatus]}
          </UiStatusBadge>
        ),
      },
      {
        id: "publicationStatus",
        header: "Công bố",
        cell: ({ row }) => (
          <UiStatusBadge role={row.original.publicationStatus === "published" ? "success" : "warning"}>
            {publicationRequests.has(
              `${row.original.studentId}:${row.original.subjectId}:${row.original.programId}:${row.original.classId}`,
            )
              ? "Chờ học vụ duyệt"
              : row.original.publicationStatus === "published"
                ? "Đã công bố"
                : row.original.publicationStatus === "pending_publication"
                  ? "Chờ học vụ duyệt"
                  : "Chưa công bố"}
          </UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiButton
            variant="subtle"
            leftSection={<ClipboardCheck size={15} />}
            onClick={() => openReview(row.original)}
          >
            Rà soát
          </UiButton>
        ),
      },
    ],
    [publicationRequests],
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
  const pending = rows.filter((row) => row.reviewStatus === "pending_review").length;
  const confirmed = rows.filter((row) => row.reviewStatus === "confirmed").length;
  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title="Hồ sơ năng lực"
        subtitle="Mỗi học viên có một hồ sơ theo môn, chương trình và lớp; các nhóm năng lực được tổng hợp trong cùng một dòng."
      />
      {notice ? (
        <Alert
          icon={notice.color === "teal" ? <CheckCircle2 size={16} /> : <LifeBuoy size={16} />}
          color={notice.color}
          mb="md"
          withCloseButton
          onClose={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      ) : null}
      <Paper withBorder p="lg" mb="md" className="teacher-module-overview">
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
          <Group gap="md">
            <ThemeIcon size={46} radius="md" color="violet">
              <BarChart3 size={23} />
            </ThemeIcon>
            <div>
              <Text size="sm" c="dimmed">
                Rà soát theo hồ sơ
              </Text>
              <Text fz={30} fw={800}>
                {rows.length} hồ sơ học viên
              </Text>
              <Group gap="xs" mt={5}>
                <Badge color="orange" variant="light">
                  {pending} chờ rà soát
                </Badge>
                <Text size="xs" c="dimmed">
                  Năng lực theo môn được gộp trong hồ sơ
                </Text>
              </Group>
            </div>
          </Group>
          <div className="teacher-module-summary">
            <Text size="xs" c="dimmed">
              Tỷ lệ đã xác nhận
            </Text>
            <Text fw={750}>{rows.length ? Math.round((confirmed / rows.length) * 100) : 0}%</Text>
            <Progress value={rows.length ? (confirmed / rows.length) * 100 : 0} color="teal" size="sm" mt={6} />
          </div>
        </Group>
      </Paper>
      <PageToolbar className="toolbar">
        <UiTextInput
          aria-label="Tìm hồ sơ năng lực"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, môn, năng lực..."
        />
        <UiTextInput
          type="date"
          aria-label="Từ ngày đánh giá"
          value={fromDate}
          onChange={(event) => setFromDate(event.currentTarget.value)}
        />
        <UiTextInput
          type="date"
          aria-label="Đến ngày đánh giá"
          value={toDate}
          onChange={(event) => setToDate(event.currentTarget.value)}
        />
        <UiSelect
          aria-label="Lọc môn"
          w={150}
          value={subject}
          onChange={setSubject}
          data={[
            { value: "all", label: "Tất cả môn" },
            { value: "english", label: "Tiếng Anh" },
            { value: "math", label: "Toán" },
            { value: "literature", label: "Ngữ văn" },
          ]}
        />
        <UiSelect
          aria-label="Lọc chương trình"
          w={180}
          value={program}
          onChange={setProgram}
          data={[
            { value: "all", label: "Tất cả chương trình" },
            { value: "teen-b1", label: "Teen B1" },
            { value: "math-foundation", label: "Nền tảng THCS" },
            { value: "literature-grade-10", label: "Luyện thi 10" },
          ]}
        />
        <UiSelect
          aria-label="Lọc lớp"
          w={145}
          value={classId}
          onChange={setClassId}
          data={[
            { value: "all", label: "Tất cả lớp" },
            { value: "en-2609", label: "EN-2609" },
            { value: "math-2608", label: "MATH-2608" },
            { value: "lit-2609", label: "LIT-2609" },
          ]}
        />
        <UiSelect
          aria-label="Lọc nguồn"
          w={155}
          value={source}
          onChange={setSource}
          data={[
            { value: "all", label: "Tất cả nguồn" },
            { value: "entrance", label: "Thi đầu vào" },
            { value: "mock", label: "Thi thử" },
            { value: "classwork", label: "Trên lớp" },
            { value: "practice", label: "Bài kiểm tra" },
            { value: "teacher_review", label: "Giáo viên" },
          ]}
        />
        <UiSelect
          aria-label="Lọc trạng thái"
          w={165}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "pending_review", label: "Chờ rà soát" },
            { value: "confirmed", label: "Đã xác nhận" },
            { value: "needs_support", label: "Cần hỗ trợ" },
          ]}
        />
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={1250}
          emptyTitle="Không tìm thấy hồ sơ năng lực phù hợp."
        />
        <Text size="xs" c="dimmed" mt="sm">
          {table.getRowModel().rows.length}/{rows.length} hồ sơ · một học sinh không còn bị lặp theo từng kỹ năng.
        </Text>
      </Paper>
      <UiModal opened={Boolean(selected)} onClose={() => setSelected(null)} title="Rà soát năng lực" size="lg">
        {selected ? (
          <Stack>
            <div>
              <Text fw={650}>
                {selected.subjectName} · {selected.programName} · {selected.className}
              </Text>
              <Text size="sm" c="dimmed">
                Các nhóm năng lực trong hồ sơ
              </Text>
            </div>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {selected.skills.map((skill) => (
                <Paper key={skill.profileId} className="classInfoCard classInfoCard--info" p="sm" withBorder>
                  <Text fw={650}>{skill.competencyName}</Text>
                  <UiSelect
                    mt="xs"
                    label="Mức hiện tại"
                    value={skillLevels[skill.profileId] ?? skill.current.label}
                    onChange={(value) => setSkillLevels((current) => ({ ...current, [skill.profileId]: value ?? "" }))}
                    data={["Chưa đánh giá", "A1", "A2", "A2+", "B1", "B2", "Đạt", "Khá", "Giỏi"]}
                  />
                  <Text size="sm">
                    Đầu vào {skill.baseline.label} · Hiện tại {skill.current.label} · Mục tiêu {skill.target.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {skill.evidence.sourceLabel} · {skill.evidence.summary}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
            <Textarea
              label="Nhận xét tổng hợp"
              minRows={5}
              value={note}
              onChange={(event) => setNote(event.currentTarget.value)}
              placeholder="Nhận xét theo các nhóm năng lực..."
            />
            <Group justify="flex-end">
              <UiButton variant="default" onClick={() => setSelected(null)}>
                Đóng
              </UiButton>
              <UiButton variant="default" leftSection={<Save size={16} />} onClick={saveDraft}>
                Lưu bản nháp
              </UiButton>
              <UiButton variant="light" color="yellow" leftSection={<LifeBuoy size={16} />} onClick={markNeedsSupport}>
                Đề xuất hỗ trợ
              </UiButton>
              <UiButton leftSection={<CheckCircle2 size={16} />} onClick={confirmReview}>
                Xác nhận đánh giá
              </UiButton>
              <UiButton
                variant="default"
                leftSection={<Send size={16} />}
                onClick={requestPublication}
                disabled={
                  selected.skills.some((skill) => skill.reviewStatus !== "confirmed") ||
                  publicationRequests.has(selectedKey)
                }
              >
                Gửi đề xuất công bố
              </UiButton>
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
