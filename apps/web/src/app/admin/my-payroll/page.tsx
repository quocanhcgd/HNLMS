"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Badge, Divider, Group, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { ArrowUpRight, CalendarDays, CheckCircle2, CircleDollarSign, Download, FileText, Search, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { consultantSelfServiceApi, type CommissionRow, type PayrollSummary } from "@/lib/consultant-self-service-api";
import { readDemoSession } from "@/lib/demo-auth";

type Row = CommissionRow;
const periods = [{ value: "2026-08", label: "Tháng 08/2026", status: "Đã công bố" }, { value: "2026-07", label: "Tháng 07/2026", status: "Đã công bố" }];
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`;

export default function MyPayrollPage() {
  const [branchManager, setBranchManager] = useState(false);
  const [salesRole, setSalesRole] = useState(false);
  useEffect(() => { const role = readDemoSession()?.role; setBranchManager(role === "branch_manager"); setSalesRole(role === "consultant" || role === "admission_manager"); }, []);
  const [period, setPeriod] = useState(periods[0].value);
  const [query, setQuery] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const current = periods.find((item) => item.value === period) ?? periods[0];
  const rows = summary?.commissions ?? [];
  const data = useMemo(() => rows.filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const commission = rows.reduce((sum, row) => sum + row.commission, 0);
  const filteredCommission = data.reduce((sum, row) => sum + row.commission, 0);
  const base = summary?.base ?? 0;
  const bonus = summary?.bonus ?? 0;
  const deduction = summary?.deduction ?? 0;
  const gross = base + commission + bonus;
  const net = gross - deduction;
  const commissionShare = gross ? Math.round((commission / gross) * 100) : 0;

  const load = async (nextPeriod: string) => {
    setLoading(true); setError("");
    try { setSummary(await consultantSelfServiceApi.payroll(nextPeriod)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu lương."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(period); }, [period]);

  const columns = useMemo<ColumnDef<Row>[]>(() => [
    { accessorKey: "date", header: "Ngày", cell: ({ row }) => <div><Text fw={650}>{row.original.date}</Text><Text size="xs" c="dimmed">{salesRole ? `CRM · ${row.original.source}` : "Khoản thu nhập đã công bố"}</Text></div> },
    { accessorKey: "lead", header: "Khách hàng tiềm năng" },
    { accessorKey: "conversion", header: "Kết quả chuyển đổi" },
    { accessorKey: "commission", header: "Hoa hồng", cell: ({ getValue }) => <Text fw={700} c="teal">{money(getValue<number>())}</Text> },
    { accessorKey: "status", header: "Đối soát", cell: ({ getValue }) => <UiStatusBadge role={getValue<Row["status"]>() === "Đã đối soát" ? "success" : "warning"}>{getValue<string>()}</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiButton size="compact-xs" variant="default" onClick={() => setSelected(row.original)} leftSection={<FileText size={14} />}>Chi tiết</UiButton> },
  ], []);
  const table = useReactTable({ data, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  return <div className="page">
    <PageHeader title="Thu nhập & lương" subtitle={branchManager || !salesRole ? "Theo dõi phiếu lương cá nhân, phụ cấp và các khoản điều chỉnh đã được công bố." : "Theo dõi lương cá nhân, hoa hồng CRM và các khoản thưởng theo kết quả tuyển sinh."} />
    <Paper withBorder p="lg" mb="md" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}>
      <Group justify="space-between" align="flex-start" wrap="wrap">
        <Group align="flex-start" gap="md"><ThemeIcon size={48} radius="md" color="teal"><WalletCards size={25} /></ThemeIcon><div><Text size="sm" c="dimmed">Thực nhận kỳ {current.label}</Text><Text fz={34} fw={800} lh={1.1}>{money(net)}</Text><Group gap="xs" mt={6}><Badge color="teal" variant="light" leftSection={<ShieldCheck size={12} />}>{current.status}</Badge><Text size="xs" c="dimmed">Cập nhật theo dữ liệu payroll</Text></Group></div></Group>
        <Group><UiSelect aria-label="Kỳ lương" value={period} onChange={(value) => setPeriod(value ?? periods[0].value)} leftSection={<CalendarDays size={16} />} data={periods.map((item) => ({ value: item.value, label: item.label }))} w={185} /><UiButton variant="default" leftSection={<Download size={16} />} onClick={() => setNotice(`Đã chuẩn bị phiếu lương ${current.label}.`)}>Tải phiếu lương</UiButton></Group>
      </Group>
      <Group gap="xs" mt="lg"><Text size="xs" c="dimmed">Tổng thu nhập {money(gross)}</Text><Text size="xs" c="dimmed">·</Text><Text size="xs" c="dimmed">Khấu trừ {money(deduction)}</Text></Group>
      <Progress value={gross ? (net / gross) * 100 : 0} color="teal" size="sm" mt={5} />
    </Paper>
    {error ? <Alert color="red" mb="md">{error}</Alert> : null}
    {notice ? <Alert icon={<CheckCircle2 size={16} />} color="teal" mb="md">{notice}</Alert> : null}
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
      <Metric icon={<CircleDollarSign size={18} />} label="Lương cơ bản" value={money(base)} detail="Theo hợp đồng" color="blue" />
      <Metric icon={<ArrowUpRight size={18} />} label={branchManager || !salesRole ? "Phụ cấp/khác" : "Hoa hồng CRM"} value={money(commission)} detail={branchManager || !salesRole ? `${rows.length} khoản đã công bố` : `${rows.length} kết quả chuyển đổi`} color="teal" />
      <Metric icon={<Sparkles size={18} />} label="Thưởng tuyển sinh" value={money(bonus)} detail="Theo chính sách hiện hành" color="orange" />
      <Metric icon={<ShieldCheck size={18} />} label="Tỷ lệ thực nhận" value={`${gross ? Math.round((net / gross) * 100) : 0}%`} detail="Sau khấu trừ kỳ này" color="violet" />
    </SimpleGrid>
    <SimpleGrid cols={{ base: 1, md: 5 }} spacing="md" mb="md">
      <Paper className="panel payroll-breakdown" p="lg" withBorder><Group justify="space-between" mb="md"><div><Text fw={750}>Phân bổ thu nhập</Text><Text size="sm" c="dimmed">Cơ cấu các khoản hình thành thực nhận</Text></div><WalletCards size={21} /></Group><Stack gap="md"><Breakdown label="Lương cơ bản" value={base} total={gross} color="blue" /><Breakdown label={branchManager ? "Phụ cấp và điều chỉnh" : "Hoa hồng CRM"} value={commission} total={gross} color="teal" /><Breakdown label="Thưởng tuyển sinh" value={bonus} total={gross} color="orange" /><Divider /><Group justify="space-between"><Text fw={700}>Khấu trừ</Text><Text fw={700} c="red">-{money(deduction)}</Text></Group></Stack></Paper>
      <Paper className="panel payroll-audit" p="lg" withBorder><Text fw={750}>{branchManager ? "Xác nhận phiếu lương" : "Đối soát hoa hồng"}</Text><Text size="sm" c="dimmed" mb="lg">{branchManager ? "Các khoản đã được payroll công bố cho cá nhân" : "Trạng thái kết quả CRM trong kỳ"}</Text><Group align="center" gap="lg"><div className="payroll-ring"><Text fz={28} fw={800} ta="center">{branchManager ? `${gross ? Math.round((base / gross) * 100) : 0}%` : `${commissionShare}%`}</Text><Text size="xs" c="dimmed" ta="center">{branchManager ? "lương cố định" : "thu nhập từ CRM"}</Text></div><Stack gap={8}>{branchManager ? <><Legend color="teal" label="Đã công bố" value={money(gross)} /><Legend color="orange" label="Khấu trừ" value={money(deduction)} /></> : <><Legend color="teal" label="Đã đối soát" value={money(rows.filter((row) => row.status === "Đã đối soát").reduce((sum, row) => sum + row.commission, 0))} /><Legend color="orange" label="Chờ đối soát" value={money(rows.filter((row) => row.status === "Chờ đối soát").reduce((sum, row) => sum + row.commission, 0))} /></>}</Stack></Group><Text size="xs" c="dimmed" mt="lg">{branchManager ? "Phiếu lương chỉ hiển thị dữ liệu cá nhân trong phạm vi kỳ đã công bố." : "Hoa hồng chỉ tính vào thu nhập sau khi tuyển sinh xác nhận và payroll hoàn tất đối soát."}</Text></Paper>
    </SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput aria-label={branchManager || !salesRole ? "Tìm khoản thu nhập" : "Tìm giao dịch hoa hồng"} value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder={branchManager || !salesRole ? "Tìm khoản thu nhập..." : "Tìm khách hàng, kết quả..."} /><Text size="sm" c="dimmed">{filteredCommission ? money(filteredCommission) : "0đ"} đang hiển thị</Text></PageToolbar>
    <Paper className="panel" p="md" withBorder><UiDataTable table={table} columnCount={columns.length} minWidth={1050} emptyTitle={loading ? "Đang tải dữ liệu lương..." : branchManager ? "Chưa có khoản phụ cấp hoặc điều chỉnh trong kỳ." : "Không có khoản hoa hồng phù hợp."} /><Text size="xs" c="dimmed" mt="sm">{branchManager ? "Các khoản phụ cấp và điều chỉnh được payroll công bố trong phiếu lương cá nhân." : "Danh sách giao dịch CRM là căn cứ chi tiết cho phần hoa hồng của kỳ lương."}</Text></Paper>
    <UiModal opened={selected !== null} onClose={() => setSelected(null)} title={branchManager ? "Chi tiết khoản thu nhập" : "Chi tiết hoa hồng CRM"} size="md">{selected ? <Stack><Text fw={700}>{selected.lead}</Text><Text size="sm" c="dimmed">{selected.date} · {selected.source}</Text><Text size="sm">Kết quả: {selected.conversion}</Text><Text fw={700} c="teal">{money(selected.commission)}</Text><Group justify="flex-end"><UiButton variant="default" onClick={() => setSelected(null)}>Đóng</UiButton></Group></Stack> : null}</UiModal>
  </div>;
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) { return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>; }
function Breakdown({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total ? Math.round((value / total) * 100) : 0; return <div><Group justify="space-between" mb={5}><Text size="sm">{label}</Text><Text size="sm" fw={700}>{money(value)} <Text span size="xs" c="dimmed">({percent}%)</Text></Text></Group><Progress value={percent} color={color} size="sm" /></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <Group gap="xs"><span style={{ width: 9, height: 9, borderRadius: 99, background: `var(--mantine-color-${color}-6)`, display: "inline-block" }} /><Text size="sm">{label}</Text><Text size="sm" fw={700}>{value}</Text></Group>; }
