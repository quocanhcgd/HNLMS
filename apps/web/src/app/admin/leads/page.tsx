"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Avatar, Group, SegmentedControl, Text } from "@mantine/core";
import { ListFilter, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiBadge, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { useUI } from "@/lib/providers";

type Lead = {
  name: string;
  interest: string;
  source: string;
  consultant: string;
  status: string;
  lastContact: string;
  phoneSuffix: string;
};

const leads: Lead[] = [
  {
    name: "Nguyễn Minh Anh",
    interest: "IELTS 6.5",
    source: "Facebook",
    consultant: "Lan Anh",
    status: "Đang tư vấn",
    lastContact: "Hôm nay, 09:20",
    phoneSuffix: "286",
  },
  {
    name: "Trần Hoàng Nam",
    interest: "Giao tiếp doanh nghiệp",
    source: "Website",
    consultant: "Quốc Huy",
    status: "Chờ thi đầu vào",
    lastContact: "Hôm qua, 16:45",
    phoneSuffix: "154",
  },
  {
    name: "Lê Bảo Ngọc",
    interest: "TOEIC 700+",
    source: "Giới thiệu",
    consultant: "Lan Anh",
    status: "Mới",
    lastContact: "18/08, 14:10",
    phoneSuffix: "912",
  },
  {
    name: "Phạm Gia Hân",
    interest: "Tiếng Anh thiếu niên",
    source: "Walk-in",
    consultant: "Mai Chi",
    status: "Đề xuất lớp",
    lastContact: "18/08, 10:30",
    phoneSuffix: "448",
  },
  {
    name: "Đỗ Khánh Linh",
    interest: "IELTS Foundation",
    source: "Facebook",
    consultant: "Quốc Huy",
    status: "Đã ghi danh",
    lastContact: "17/08, 17:15",
    phoneSuffix: "735",
  },
];

const statusRoles: Record<string, "primary" | "success" | "warning" | "info" | "neutral"> = {
  "Đang tư vấn": "info",
  "Chờ thi đầu vào": "warning",
  Mới: "primary",
  "Đề xuất lớp": "warning",
  "Đã ghi danh": "success",
};

export default function Leads() {
  const { t } = useUI();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Khách hàng",
        cell: ({ row }) => (
          <Group gap="sm" wrap="nowrap">
            <Avatar size={32} color="primary">
              {row.original.name.split(" ").at(-1)?.[0]}
            </Avatar>
            <div>
              <Text size="sm" fw={600}>
                {row.original.name}
              </Text>
              <Text size="xs" c="dimmed">
                09xx xxx {row.original.phoneSuffix}
              </Text>
            </div>
          </Group>
        ),
      },
      { accessorKey: "interest", header: "Nhu cầu" },
      {
        accessorKey: "source",
        header: "Nguồn",
        cell: ({ getValue }) => (
          <UiBadge variant="outline" color="gray">
            {String(getValue())}
          </UiBadge>
        ),
      },
      { accessorKey: "consultant", header: "Tư vấn viên" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => (
          <UiStatusBadge role={statusRoles[String(getValue())] ?? "neutral"}>{String(getValue())}</UiStatusBadge>
        ),
      },
      {
        accessorKey: "lastContact",
        header: "Liên hệ cuối",
        cell: ({ getValue }) => (
          <Text size="sm" c="dimmed">
            {String(getValue())}
          </Text>
        ),
      },
    ],
    [],
  );

  const filteredData = useMemo(
    () => (status && status !== "all" ? leads.filter((lead) => lead.status === status) : leads),
    [status],
  );
  const table = useReactTable({
    data: filteredData,
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
      <PageHeader title={t("leadPipeline")} subtitle={t("leadSub")} action={t("newConsultation")} />
      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm theo tên, nhu cầu, nguồn..."
        />
        <UiSelect
          aria-label="Lọc trạng thái"
          w={190}
          value={status}
          onChange={setStatus}
          data={[
            { value: "all", label: t("allStatus") },
            "Mới",
            "Đang tư vấn",
            "Chờ thi đầu vào",
            "Đề xuất lớp",
            "Đã ghi danh",
          ]}
        />
        <UiButton variant="default" leftSection={<ListFilter size={16} />}>
          Bộ lọc
        </UiButton>
        <div style={{ flex: 1 }} />
        <SegmentedControl data={["Bảng", "Kanban"]} />
      </PageToolbar>
      <UiDataTable table={table} columnCount={columns.length} emptyTitle="Không tìm thấy khách hàng phù hợp." />
      <Text size="xs" c="dimmed" mt="sm">
        TanStack Table · {table.getRowModel().rows.length} / {leads.length} bản ghi · hỗ trợ tìm kiếm và sắp xếp theo
        cột
      </Text>
    </div>
  );
}
