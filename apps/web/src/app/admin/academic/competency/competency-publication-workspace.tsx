"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompetencyProfileReadModel } from "@hnlms/domain-contracts";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { CheckCircle2, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  PageToolbar,
  UiButton,
  UiDataTable,
  UiModal,
  UiRowActions,
  UiSelect,
  UiStatusBadge,
  UiTextInput,
} from "@/components/ui";
import { competencyProfileApi } from "@/lib/competency-profile-api";

type ContextRow = CompetencyProfileReadModel & { skills: CompetencyProfileReadModel[] };

function groupProfiles(rows: CompetencyProfileReadModel[]): ContextRow[] {
  const groups = new Map<string, ContextRow>();
  for (const row of rows) {
    const key = `${row.studentId}:${row.subjectId}:${row.programId}:${row.classId}`;
    const current = groups.get(key);
    if (current) current.skills.push(row);
    else groups.set(key, { ...row, skills: [row] });
  }
  return [...groups.values()].map((row) => ({
    ...row,
    skills: row.skills,
    publicationStatus: row.skills.every((skill) => skill.publicationStatus === "published")
      ? "published"
      : row.skills.some((skill) => skill.publicationStatus === "pending_publication")
        ? "pending_publication"
        : "draft",
  }));
}

export function CompetencyPublicationWorkspace() {
  const [rows, setRows] = useState<CompetencyProfileReadModel[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("pending_publication");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<ContextRow | null>(null);
  const [notice, setNotice] = useState<{ color: "teal" | "yellow"; text: string } | null>(null);

  useEffect(() => {
    let active = true;
    void competencyProfileApi
      .list("academic_affairs")
      .then((profiles) => {
        if (active) setRows(profiles);
      })
      .catch(() => {
        if (active) setNotice({ color: "yellow", text: "Không tải được danh sách hồ sơ chờ công bố." });
      });
    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => groupProfiles(rows), [rows]);
  const data = useMemo(
    () =>
      grouped.filter(
        (row) =>
          (status === "all" || row.publicationStatus === status) &&
          JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      ),
    [grouped, query, status],
  );

  const publish = async (row: ContextRow) => {
    try {
      await competencyProfileApi.approvePublication(
        row.skills.map((skill) => skill.profileId),
        "Học vụ đã kiểm tra và công bố hồ sơ.",
      );
      setRows((current) =>
        current.map((item) =>
          row.skills.some((skill) => skill.profileId === item.profileId)
            ? { ...item, publicationStatus: "published" }
            : item,
        ),
      );
      setNotice({ color: "teal", text: `Đã công bố hồ sơ của ${row.studentName}.` });
      setSelected(null);
    } catch {
      setNotice({ color: "yellow", text: "Không thể công bố hồ sơ. Hãy kiểm tra trạng thái yêu cầu." });
    }
  };

  const columns = useMemo<ColumnDef<ContextRow>[]>(
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
          <Text size="sm">
            {row.original.skills.map((skill) => `${skill.competencyName}: ${skill.current.label}`).join(" · ")}
          </Text>
        ),
      },
      {
        id: "review",
        header: "Đánh giá",
        cell: ({ row }) => (
          <UiStatusBadge
            role={row.original.skills.every((skill) => skill.reviewStatus === "confirmed") ? "success" : "warning"}
          >
            {row.original.skills.every((skill) => skill.reviewStatus === "confirmed") ? "Đã xác nhận" : "Chưa đủ"}
          </UiStatusBadge>
        ),
      },
      {
        accessorKey: "publicationStatus",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiStatusBadge
            role={
              getValue<string>() === "pending_publication"
                ? "warning"
                : getValue<string>() === "published"
                  ? "success"
                  : "neutral"
            }
          >
            {getValue<string>() === "pending_publication"
              ? "Chờ học vụ duyệt"
              : getValue<string>() === "published"
                ? "Đã công bố"
                : "Bản nháp"}
          </UiStatusBadge>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiRowActions
            actions={{
              view: () => setSelected(row.original),
              publish:
                row.original.publicationStatus === "pending_publication" ? () => void publish(row.original) : undefined,
            }}
            labels={{ view: "Xem hồ sơ", publish: "Công bố" }}
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

  return (
    <div className="page">
      <PageHeader
        title="Duyệt công bố hồ sơ năng lực"
        subtitle="Học vụ kiểm tra toàn bộ nhóm năng lực trong cùng một hồ sơ trước khi hiển thị cho học viên và phụ huynh."
      />
      {notice ? (
        <Alert
          color={notice.color}
          icon={notice.color === "teal" ? <CheckCircle2 size={16} /> : undefined}
          mb="md"
          withCloseButton
          onClose={() => setNotice(null)}
        >
          {notice.text}
        </Alert>
      ) : null}
      <PageToolbar>
        <UiTextInput
          aria-label="Tìm hồ sơ chờ công bố"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<Search size={16} />}
          placeholder="Tìm học viên, lớp, môn..."
        />
        <UiSelect
          aria-label="Lọc trạng thái công bố"
          value={status}
          onChange={setStatus}
          w={210}
          data={[
            { value: "pending_publication", label: "Chờ học vụ duyệt" },
            { value: "published", label: "Đã công bố" },
            { value: "draft", label: "Bản nháp" },
            { value: "all", label: "Tất cả trạng thái" },
          ]}
        />
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <UiDataTable table={table} columnCount={columns.length} minWidth={1050} emptyTitle="Không có hồ sơ phù hợp." />
        <Text size="xs" c="dimmed" mt="sm">
          {table.getRowModel().rows.length}/{grouped.length} hồ sơ · mỗi học viên chỉ hiển thị một dòng theo môn, chương
          trình và lớp.
        </Text>
      </Paper>
      <UiModal opened={Boolean(selected)} onClose={() => setSelected(null)} title="Kiểm tra hồ sơ năng lực" size="lg">
        {selected ? (
          <Stack>
            <Text fw={650}>
              {selected.studentName} · {selected.subjectName} · {selected.className}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {selected.skills.map((skill) => (
                <Paper key={skill.profileId} withBorder p="sm">
                  <Text fw={650}>{skill.competencyName}</Text>
                  <Text size="sm">Đầu vào: {skill.baseline.label}</Text>
                  <Text size="sm">Hiện tại: {skill.current.label}</Text>
                  <Text size="sm">Mục tiêu: {skill.target.label}</Text>
                  <Text size="xs" c="dimmed">
                    {skill.teacherFeedback ?? "Chưa có nhận xét riêng."}
                  </Text>
                </Paper>
              ))}
            </SimpleGrid>
            <Group justify="flex-end">
              <UiButton variant="default" onClick={() => setSelected(null)}>
                Đóng
              </UiButton>
              {selected.publicationStatus === "pending_publication" ? (
                <UiButton leftSection={<CheckCircle2 size={16} />} onClick={() => void publish(selected)}>
                  Duyệt và công bố
                </UiButton>
              ) : null}
            </Group>
          </Stack>
        ) : null}
      </UiModal>
    </div>
  );
}
