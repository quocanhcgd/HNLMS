"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { BarChart3, Megaphone, MessageSquare, Pencil, Plus, Target, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiBadge, UiButton, UiConfirmModal, UiDataTable, UiEditModal, UiModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput, type UiStatusRole } from "@/components/ui";

type CampaignStatus = "draft" | "active" | "paused" | "completed";
type Campaign = {
  id: string;
  name: string;
  channel: string;
  source: string;
  status: CampaignStatus;
  budget: number;
  spent: number;
  leads: number;
  conversions: number;
  startDate: string;
  endDate: string;
};

const statusConfig: Record<CampaignStatus, { label: string; role: UiStatusRole }> = {
  draft: { label: "Bản nháp", role: "neutral" },
  active: { label: "Đang chạy", role: "success" },
  paused: { label: "Tạm dừng", role: "warning" },
  completed: { label: "Đã kết thúc", role: "info" },
};

const seedCampaigns: Campaign[] = [
  { id: "cmp-1", name: "Khai giảng IELTS tháng 9", channel: "Facebook", source: "FB-IELTS-09", status: "active", budget: 30000000, spent: 18400000, leads: 86, conversions: 14, startDate: "01/08/2026", endDate: "31/08/2026" },
  { id: "cmp-2", name: "TOEIC 700+ mùa thu", channel: "Google Ads", source: "GG-TOEIC-AUTUMN", status: "active", budget: 22000000, spent: 12600000, leads: 54, conversions: 9, startDate: "05/08/2026", endDate: "15/09/2026" },
  { id: "cmp-3", name: "Ưu đãi học phí phụ huynh", channel: "Email", source: "CRM-PARENT-AUG", status: "paused", budget: 8000000, spent: 6100000, leads: 31, conversions: 6, startDate: "10/08/2026", endDate: "25/08/2026" },
  { id: "cmp-4", name: "Nội dung học viên tiêu biểu", channel: "Organic", source: "SEO-STUDENT-STORY", status: "completed", budget: 0, spent: 0, leads: 42, conversions: 8, startDate: "01/07/2026", endDate: "31/07/2026" },
  { id: "cmp-5", name: "Workshop giao tiếp miễn phí", channel: "Landing page", source: "LP-SPEAKING-WORKSHOP", status: "draft", budget: 12000000, spent: 0, leads: 0, conversions: 0, startDate: "01/09/2026", endDate: "20/09/2026" },
];

const money = (value: number) => value ? `${(value / 1000000).toFixed(1).replace(".", ",")}M` : "-";
const conversionRate = (campaign: Campaign) => campaign.leads ? `${Math.round((campaign.conversions / campaign.leads) * 100)}%` : "-";

export function MarketingDashboard() {
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [viewing, setViewing] = useState<Campaign | null>(null);
  const [confirming, setConfirming] = useState<Campaign | null>(null);
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => campaigns.filter((campaign) => {
    const haystack = `${campaign.name} ${campaign.channel} ${campaign.source}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase()) && (status === "all" || campaign.status === status);
  }), [campaigns, query, status]);

  const active = campaigns.filter((campaign) => campaign.status === "active");
  const totalLeads = campaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
  const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0);
  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0);
  const columns = useMemo<ColumnDef<Campaign>[]>(() => [
    { accessorKey: "name", header: "Chiến dịch", cell: ({ row }) => <Stack gap={2}><Text fw={650} size="sm">{row.original.name}</Text><Text size="xs" c="dimmed">{row.original.source}</Text></Stack> },
    { accessorKey: "channel", header: "Kênh", cell: ({ getValue }) => <UiBadge variant="outline" color="gray">{getValue() as string}</UiBadge> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const item = statusConfig[getValue() as CampaignStatus]; return <UiStatusBadge role={item.role}>{item.label}</UiStatusBadge>; } },
    { id: "budget", header: "Ngân sách / đã chi", accessorFn: (row) => row.budget, cell: ({ row }) => <Text size="sm">{money(row.original.spent)} / {money(row.original.budget)}</Text> },
    { accessorKey: "leads", header: "Lead", cell: ({ row }) => <Text size="sm">{row.original.leads} <Text span size="xs" c="dimmed">({conversionRate(row.original)})</Text></Text> },
    { accessorKey: "conversions", header: "Ghi danh", cell: ({ getValue }) => <Text size="sm" fw={600}>{getValue() as number}</Text> },
    { id: "period", header: "Thời gian", accessorFn: (row) => row.startDate, cell: ({ row }) => <Text size="sm" c="dimmed">{row.original.startDate} - {row.original.endDate}</Text> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ view: () => setViewing(row.original), edit: () => setEditing(row.original), publish: row.original.status === "draft" || row.original.status === "paused" ? () => startCampaign(row.original) : undefined, archive: row.original.status === "active" ? () => setConfirming(row.original) : undefined }} labels={{ view: "Xem hiệu quả", edit: "Chỉnh sửa", publish: "Khởi chạy", archive: "Tạm dừng" }} /> },
  ], []);

  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  function saveCampaign() {
    if (!editing?.name.trim() || !editing.source.trim()) {
      setNotice("Vui lòng nhập tên chiến dịch và mã nguồn lead trước khi lưu.");
      return;
    }
    setCampaigns((current) => current.some((item) => item.id === editing.id) ? current.map((item) => item.id === editing.id ? editing : item) : [...current, editing]);
    setNotice(`Đã lưu chiến dịch ${editing.name}.`);
    setEditing(null);
  }

  function pauseCampaign() {
    if (!confirming) return;
    setCampaigns((current) => current.map((item) => item.id === confirming.id ? { ...item, status: "paused" } : item));
    setNotice(`Đã tạm dừng ${confirming.name}.`);
    setConfirming(null);
  }

  function startCampaign(campaign: Campaign) {
    setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, status: "active" } : item));
    setNotice(`Đã khởi chạy ${campaign.name}.`);
  }

  return <div className="page">
    <PageHeader title="Marketing & tăng trưởng" subtitle="Điều hành chiến dịch, nguồn lead và nội dung công khai theo một quy trình từ thu hút đến bàn giao tuyển sinh." action="Tạo chiến dịch" onAction={() => setEditing({ id: `cmp-${Date.now()}`, name: "", channel: "Facebook", source: "", status: "draft", budget: 0, spent: 0, leads: 0, conversions: 0, startDate: "01/09/2026", endDate: "30/09/2026" })} />
    <Paper withBorder p="md" mb="md" className="panelHighlight"><Group justify="space-between" align="flex-start" wrap="wrap" gap="lg"><Group gap="md"><ThemeIcon size={46} radius="md" color="primary" variant="light"><Megaphone size={23} /></ThemeIcon><div><Text size="sm" c="dimmed">Trung tâm điều hành marketing</Text><Text fz={27} fw={800}>{active.length} chiến dịch đang chạy</Text><Text size="sm" c="dimmed">Lead mới được gắn nguồn trước khi chuyển sang pipeline tuyển sinh.</Text></div></Group><Group gap="xl"><div><Text size="xs" c="dimmed">Lead tháng này</Text><Text fw={750}>{totalLeads}</Text></div><div><Text size="xs" c="dimmed">Tỷ lệ ghi danh</Text><Text fw={750} c="teal">{totalLeads ? Math.round((totalConversions / totalLeads) * 100) : 0}%</Text></div><div><Text size="xs" c="dimmed">Ngân sách</Text><Text fw={750}>{money(totalBudget)}</Text></div></Group></Group></Paper>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md">
      <Metric icon={<Target size={17} />} label="Chiến dịch đang chạy" value={`${active.length}`} detail="có theo dõi ngân sách" color="blue" />
      <Metric icon={<UsersRound size={17} />} label="Lead từ chiến dịch" value={`${totalLeads}`} detail="đã gắn nguồn" color="teal" />
      <Metric icon={<BarChart3 size={17} />} label="Tỷ lệ chuyển đổi" value={`${totalLeads ? Math.round((totalConversions / totalLeads) * 100) : 0}%`} detail={`${totalConversions} hồ sơ ghi danh`} color="violet" />
      <Metric icon={<MessageSquare size={17} />} label="Nội dung chờ duyệt" value="3" detail="cần hoàn tất hôm nay" color="orange" />
    </SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Target size={16} />} placeholder="Tìm chiến dịch, kênh, mã nguồn..." style={{ minWidth: 280 }} /><UiSelect aria-label="Lọc chiến dịch theo trạng thái" value={status} onChange={setStatus} w={190} data={[{ value: "all", label: "Tất cả trạng thái" }, ...Object.entries(statusConfig).map(([value, item]) => ({ value, label: item.label }))]} /><div style={{ flex: 1 }} /><UiButton component="a" href="/admin/marketing/content" variant="light" leftSection={<Pencil size={14} />}>Quản lý nội dung</UiButton><UiButton component="a" href="/admin/marketing/preview" variant="default" leftSection={<Plus size={14} />}>Xem trang công khai</UiButton></PageToolbar>
    {notice ? <Text size="sm" c="teal" mb="sm" role="status">{notice}</Text> : null}
    <Paper className="panel" p="md" withBorder><Group justify="space-between" mb="sm"><div><Text fw={700}>Danh sách chiến dịch</Text><Text size="sm" c="dimmed">Theo dõi ngân sách, nguồn lead và kết quả ghi danh.</Text></div><UiBadge>{filtered.length} chiến dịch</UiBadge></Group><UiDataTable table={table} columnCount={columns.length} minWidth={960} emptyTitle="Không có chiến dịch phù hợp." /></Paper>
    <UiEditModal opened={editing !== null} onClose={() => setEditing(null)} title={editing?.id.startsWith("cmp-") && !campaigns.some((item) => item.id === editing.id) ? "Tạo chiến dịch" : "Chỉnh sửa chiến dịch"} onSave={saveCampaign} saveLabel="Lưu chiến dịch">
      {editing ? <Stack><UiTextInput label="Tên chiến dịch" required value={editing.name} onChange={(event) => setEditing((item) => item ? { ...item, name: event.currentTarget.value } : item)} placeholder="Ví dụ: Khai giảng IELTS tháng 9" /><Group grow><UiSelect label="Kênh" value={editing.channel} onChange={(value) => setEditing((item) => item ? { ...item, channel: value ?? item.channel } : item)} data={["Facebook", "Google Ads", "Email", "Organic", "Landing page"].map((value) => ({ value, label: value }))} /><UiTextInput label="Mã nguồn lead" required value={editing.source} onChange={(event) => setEditing((item) => item ? { ...item, source: event.currentTarget.value } : item)} placeholder="FB-IELTS-09" /></Group><Group grow><UiSelect label="Trạng thái" value={editing.status} onChange={(value) => setEditing((item) => item ? { ...item, status: (value as CampaignStatus) ?? item.status } : item)} data={Object.entries(statusConfig).map(([value, item]) => ({ value, label: item.label }))} /><UiTextInput label="Ngân sách (VNĐ)" type="number" value={editing.budget} onChange={(event) => setEditing((item) => item ? { ...item, budget: Number(event.currentTarget.value) || 0 } : item)} /></Group><Text size="xs" c="dimmed">Lead phát sinh phải dùng mã nguồn này để phòng tuyển sinh đối soát và bàn giao đúng chiến dịch.</Text></Stack> : null}
    </UiEditModal>
    <UiConfirmModal opened={confirming !== null} onClose={() => setConfirming(null)} title="Tạm dừng chiến dịch" description={confirming ? `Tạm dừng ${confirming.name}? Các lead đã thu thập vẫn được giữ nguyên và tiếp tục chuyển sang tuyển sinh.` : ""} confirmLabel="Tạm dừng" destructive onConfirm={pauseCampaign} />
    <UiModal opened={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Hiệu quả · ${viewing.name}` : "Hiệu quả chiến dịch"} size="md">
      {viewing ? <Stack gap="md"><Group justify="space-between"><UiStatusBadge role={statusConfig[viewing.status].role}>{statusConfig[viewing.status].label}</UiStatusBadge><Text size="sm" c="dimmed">Nguồn: {viewing.source}</Text></Group><SimpleGrid cols={3}><div><Text size="xs" c="dimmed">Lead</Text><Text fw={750} fz={24}>{viewing.leads}</Text></div><div><Text size="xs" c="dimmed">Ghi danh</Text><Text fw={750} fz={24} c="teal">{viewing.conversions}</Text></div><div><Text size="xs" c="dimmed">Chuyển đổi</Text><Text fw={750} fz={24}>{conversionRate(viewing)}</Text></div></SimpleGrid><Text size="sm">Đã chi {money(viewing.spent)} trên ngân sách {money(viewing.budget)}. Lead được gắn mã nguồn để tuyển sinh đối soát và tiếp nhận.</Text><Group justify="flex-end"><UiButton variant="default" onClick={() => setViewing(null)}>Đóng</UiButton><UiButton component="a" href="/admin/admission">Mở pipeline tuyển sinh</UiButton></Group></Stack> : null}
    </UiModal>
  </div>;
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) {
  return <Paper withBorder p="md"><Group gap="sm"><ThemeIcon color={color} variant="light" size={32}>{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fw={750} fz={22}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>;
}
