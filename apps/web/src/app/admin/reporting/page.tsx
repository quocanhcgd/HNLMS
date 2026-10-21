"use client";

import { PageHeader } from "@/components/app-shell";
import { Group, Paper, SimpleGrid, Text, ThemeIcon } from "@mantine/core";
import { BarChart3, CheckCircle2, Download, Search } from "lucide-react";
import { PageToolbar, UiButton, UiDataTable, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { getReportingMetrics, type BranchMetric } from "@/lib/reporting-api";
import { readDemoSession, type DemoSession } from "@/lib/demo-auth";

type Row = {
  branchId: string;
  branch: string;
  learners: string;
  classes: string;
  revenue: string;
  expenses: string;
  payroll: string;
  status: "Tươi mới" | "Cần làm mới";
};

const money = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + "đ";

const toRow = (item: BranchMetric): Row => ({
  ...item,
  branch: item.branchName,
  learners: item.learners.toLocaleString("vi-VN"),
  classes: item.activeClasses.toLocaleString("vi-VN"),
  revenue: money(item.revenue),
  expenses: money(item.expenses),
  payroll: money(item.payroll),
  status: Date.now() - new Date(item.updatedAt).getTime() < 86400000 ? "Tươi mới" : "Cần làm mới",
});

export default function ReportingPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortingState>([]);
  const [branch, setBranch] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    setSession(readDemoSession());
  }, []);

  const organizationWide = session?.role === "organization_admin" || session?.role === "executive" || session?.role === "finance_officer";

  useEffect(() => {
    void getReportingMetrics()
      .then((result) => setRows(result.data.map(toRow)))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không tải được báo cáo vận hành."))
      .finally(() => setLoading(false));
  }, []);

  const availableBranches = useMemo(() => rows.map((item) => ({ value: item.branchId, label: item.branch })), [rows]);
  const data = useMemo(
    () => rows.filter((row) => (branch === "all" || row.branchId === branch) && JSON.stringify(row).toLowerCase().includes(q.toLowerCase())),
    [rows, branch, q],
  );
  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      { accessorKey: "branch", header: "Chi nhánh", cell: ({ row }) => <div><Text fw={600}>{row.original.branch}</Text><Text size="xs" c="dimmed">Báo cáo tổng hợp</Text></div> },
      { accessorKey: "learners", header: "Học viên" },
      { accessorKey: "classes", header: "Lớp hoạt động" },
      { accessorKey: "revenue", header: "Doanh thu" },
      { accessorKey: "expenses", header: "Chi phí" },
      { accessorKey: "payroll", header: "Payroll" },
      { accessorKey: "status", header: "Dữ liệu", cell: ({ getValue }) => <UiStatusBadge role={getValue<string>() === "Tươi mới" ? "success" : "warning"}>{getValue<string>()}</UiStatusBadge> },
    ],
    [],
  );
  const table = useReactTable({
    data,
    columns,
    state: { sorting: sort, globalFilter: q },
    onSortingChange: setSort,
    onGlobalFilterChange: setQ,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  const totals = data.reduce(
    (acc, item) => ({
      learners: acc.learners + Number(item.learners.replace(/\./g, "")),
      revenue: acc.revenue + Number(item.revenue.replace(/\D/g, "")),
      payroll: acc.payroll + Number(item.payroll.replace(/\D/g, "")),
    }),
    { learners: 0, revenue: 0, payroll: 0 },
  );
  const freshCount = data.filter((item) => item.status === "Tươi mới").length;

  return (
    <div className="page">
      <PageHeader title="Báo cáo vận hành" subtitle="Số liệu được giới hạn theo phạm vi cơ sở của tài khoản." />
      <Paper withBorder p="lg" mb="md" className="panelHighlight" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap"><Group gap="md"><ThemeIcon size={46} radius="md" color="primary"><BarChart3 size={23} /></ThemeIcon><div><Text size="sm" c="dimmed">Trung tâm báo cáo</Text><Text fz={27} fw={800}>{freshCount}/{data.length} chi nhánh có dữ liệu mới</Text><Text size="sm" c="dimmed" mt={4}>Các chỉ số được tổng hợp theo phạm vi và thời điểm cập nhật thực tế.</Text></div></Group><UiStatusBadge role={freshCount === data.length ? "success" : "warning"} variant="dot">{freshCount === data.length ? "Dữ liệu mới" : "Cần làm mới"}</UiStatusBadge></Group></Paper>
      <PageToolbar className="toolbar">
        <UiTextInput value={q} onChange={(event) => setQ(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm chi nhánh..." />
        <UiSelect aria-label="Lọc chi nhánh báo cáo" w={190} value={branch} onChange={(value) => setBranch(value ?? "all")} data={organizationWide ? [{ value: "all", label: "Tất cả chi nhánh" }, ...availableBranches] : availableBranches} />
        <UiButton leftSection={<Download size={16} />} onClick={() => setNotice("Báo cáo đã được chuẩn bị theo phạm vi đang lọc.")}>Xuất báo cáo</UiButton>
      </PageToolbar>
      {error ? <Text c="red" mb="sm">{error}</Text> : null}
      {notice ? <Text c="teal" mb="sm">{notice}</Text> : null}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
        <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Tổng học viên</Text><Text size="xl" fw={700}>{loading ? "…" : totals.learners.toLocaleString("vi-VN")}</Text></Paper>
        <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Doanh thu</Text><Text size="xl" fw={700}>{loading ? "…" : money(totals.revenue)}</Text></Paper>
        <Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Payroll</Text><Text size="xl" fw={700}>{loading ? "…" : money(totals.payroll)}</Text></Paper>
        <Paper className="panel" p="md" withBorder><Group gap="sm"><ThemeIcon color="teal" variant="light" size={34}><CheckCircle2 size={17} /></ThemeIcon><div><Text size="sm" c="dimmed">Dữ liệu mới</Text><Text size="xl" fw={700}>{freshCount}</Text></div></Group></Paper>
      </SimpleGrid>
      <Paper className="panel" p="md" withBorder>
        <Group mb="md"><BarChart3 size={22} /><Text fw={700}>Tổng hợp theo chi nhánh</Text></Group>
        <UiDataTable table={table} columnCount={columns.length} minWidth={1100} emptyTitle={loading ? "Đang tải dữ liệu báo cáo…" : "Không có dữ liệu báo cáo."} />
      </Paper>
    </div>
  );
}
