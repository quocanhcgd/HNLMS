"use client";

import { useMemo, useState } from "react";
import { type ColumnDef, type SortingState, getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Avatar, Badge, Group, Paper, Progress, SegmentedControl, SimpleGrid, Stack, Text, Textarea, ThemeIcon } from "@mantine/core";
import { CalendarClock, CheckCircle2, Clock3, Eye, Plus, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiBadge, UiButton, UiConfirmModal, UiDataTable, UiEditModal, UiModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { useUI } from "@/lib/providers";

type LeadStatus = "Mới" | "Đang tư vấn" | "Chờ thi đầu vào" | "Đề xuất lớp" | "Đã ghi danh" | "Không phù hợp";
type Lead = { id: string; name: string; phone: string; email: string; interest: string; source: string; branch: string; consultant: string; status: LeadStatus; lastContact: string; nextAction: string };
type LeadDraft = Pick<Lead, "name" | "phone" | "email" | "interest" | "source" | "branch" | "consultant" | "status" | "nextAction">;

const initialLeads: Lead[] = [
  { id: "lead-001", name: "Nguyễn Minh Anh", phone: "0909 120 286", email: "minh.anh@example.vn", interest: "IELTS 6.5", source: "Facebook", branch: "Cầu Giấy", consultant: "Lan Anh", status: "Đang tư vấn", lastContact: "Hôm nay, 09:20", nextAction: "Gửi lịch thi đầu vào" },
  { id: "lead-002", name: "Trần Hoàng Nam", phone: "0908 440 154", email: "hoang.nam@example.vn", interest: "Giao tiếp doanh nghiệp", source: "Website", branch: "Cầu Giấy", consultant: "Quốc Huy", status: "Chờ thi đầu vào", lastContact: "Hôm qua, 16:45", nextAction: "Theo dõi kết quả đầu vào" },
  { id: "lead-003", name: "Lê Bảo Ngọc", phone: "0912 440 912", email: "bao.ngoc@example.vn", interest: "TOEIC 700+", source: "Giới thiệu", branch: "Hà Đông", consultant: "Lan Anh", status: "Mới", lastContact: "18/08, 14:10", nextAction: "Gọi lần đầu" },
  { id: "lead-004", name: "Phạm Gia Hân", phone: "0988 330 448", email: "gia.han@example.vn", interest: "Tiếng Anh thiếu niên", source: "Walk-in", branch: "Cầu Giấy", consultant: "Mai Chi", status: "Đề xuất lớp", lastContact: "18/08, 10:30", nextAction: "Xác nhận lớp và học phí" },
  { id: "lead-005", name: "Đỗ Khánh Linh", phone: "0901 220 735", email: "khanh.linh@example.vn", interest: "IELTS Foundation", source: "Facebook", branch: "Online Studio", consultant: "Quốc Huy", status: "Đã ghi danh", lastContact: "17/08, 17:15", nextAction: "Bàn giao hồ sơ học viên" },
];

const statusRole: Record<LeadStatus, "primary" | "success" | "warning" | "info" | "neutral"> = {
  "Mới": "primary", "Đang tư vấn": "info", "Chờ thi đầu vào": "warning", "Đề xuất lớp": "warning", "Đã ghi danh": "success", "Không phù hợp": "neutral",
};
const emptyDraft: LeadDraft = { name: "", phone: "", email: "", interest: "", source: "Website", branch: "Cầu Giấy", consultant: "Lan Anh", status: "Mới", nextAction: "Gọi lần đầu" };
const statuses: LeadStatus[] = ["Mới", "Đang tư vấn", "Chờ thi đầu vào", "Đề xuất lớp", "Đã ghi danh", "Không phù hợp"];

export default function Leads() {
  const { t } = useUI();
  const [leads, setLeads] = useState(initialLeads);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [view, setView] = useState("table");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);
  const [notice, setNotice] = useState("");

  const filteredData = useMemo(() => leads.filter((lead) => {
    const text = `${lead.name} ${lead.phone} ${lead.email} ${lead.interest} ${lead.consultant}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (status === "all" || lead.status === status) && (source === "all" || lead.source === source);
  }), [leads, query, source, status]);
  const activeLeads = leads.filter((lead) => !["Đã ghi danh", "Không phù hợp"].includes(lead.status));
  const enrolledLeads = leads.filter((lead) => lead.status === "Đã ghi danh");
  const assessmentQueue = leads.filter((lead) => lead.status === "Chờ thi đầu vào");
  const conversionRate = leads.length ? Math.round((enrolledLeads.length / leads.length) * 100) : 0;
  const nextLead = activeLeads[0];

  const openCreate = () => { setDraft(emptyDraft); setCreateOpen(true); };
  const openEdit = (lead: Lead) => { setDraft(lead); setEditing(lead); };
  const saveLead = () => {
    if (!draft.name.trim() || !draft.phone.trim() || !draft.interest.trim() || !draft.nextAction.trim()) { setNotice("Vui lòng nhập đủ họ tên, số điện thoại, nhu cầu và bước tiếp theo."); return; }
    if (editing) {
      setLeads((current) => current.map((lead) => lead.id === editing.id ? { ...lead, ...draft, name: draft.name.trim(), phone: draft.phone.trim(), interest: draft.interest.trim(), nextAction: draft.nextAction.trim(), lastContact: "Vừa cập nhật" } : lead));
      setEditing(null); setNotice("Đã cập nhật hồ sơ khách hàng.");
    } else {
      setLeads((current) => [{ ...draft, id: `lead-${Date.now()}`, name: draft.name.trim(), phone: draft.phone.trim(), interest: draft.interest.trim(), nextAction: draft.nextAction.trim(), lastContact: "Chưa liên hệ" }, ...current]);
      setCreateOpen(false); setNotice("Đã tạo khách tiềm năng và đưa vào work queue.");
    }
    setDraft(emptyDraft);
  };
  const removeLead = () => { if (!deleting) return; setLeads((current) => current.filter((lead) => lead.id !== deleting.id)); setDeleting(null); setNotice("Đã xóa khách tiềm năng khỏi danh sách."); };

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    { accessorKey: "name", header: "Khách hàng", cell: ({ row }) => <Group gap="sm" wrap="nowrap"><Avatar size={32} color="primary">{row.original.name.split(" ").at(-1)?.[0]}</Avatar><div><Text size="sm" fw={600}>{row.original.name}</Text><Text size="xs" c="dimmed">{row.original.phone}</Text></div></Group> },
    { accessorKey: "interest", header: "Nhu cầu" },
    { accessorKey: "source", header: "Nguồn", cell: ({ getValue }) => <UiBadge variant="outline" color="gray">{String(getValue())}</UiBadge> },
    { accessorKey: "consultant", header: "Tư vấn viên" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = String(getValue()) as LeadStatus; return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
    { accessorKey: "lastContact", header: "Liên hệ cuối", cell: ({ getValue }) => <Text size="sm" c="dimmed">{String(getValue())}</Text> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions labels={{ view: "Xem", edit: "Sửa", delete: "Xóa" }} actions={{ view: () => setViewing(row.original), edit: () => openEdit(row.original), delete: () => setDeleting(row.original) }} /> },
  ], []);
  const table = useReactTable({ data: filteredData, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  return <div className="page">
    <PageHeader title={t("leadPipeline")} subtitle="Tiếp nhận, phân loại, chăm sóc và chuyển đổi khách hàng theo từng bước." action="Tạo khách tiềm năng" onAction={openCreate} />
    <Paper withBorder p="lg" mb="md" className="leads-overview" style={{ background: "color-mix(in srgb, var(--hn-light-primary) 8%, var(--app-panel))", borderColor: "color-mix(in srgb, var(--hn-light-primary) 32%, var(--app-border))" }}><Group justify="space-between" align="flex-start" wrap="wrap" gap="xl"><Group align="flex-start" gap="md"><ThemeIcon size={48} radius="md" color="primary"><UsersRound size={25} /></ThemeIcon><div><Text size="sm" c="dimmed">Tổng pipeline tuyển sinh</Text><Text fz={32} fw={800} lh={1.1}>{leads.length} khách tiềm năng</Text><Group gap="xs" mt={6}><Badge color="blue" variant="light">{activeLeads.length} đang xử lý</Badge><Text size="xs" c="dimmed">Cập nhật theo work queue hiện tại</Text></Group></div></Group><div className="leads-overview-summary"><Group gap="xl"><div><Text size="xs" c="dimmed">Tỷ lệ ghi danh</Text><Text fw={750}>{conversionRate}%</Text></div><div><Text size="xs" c="dimmed">Chờ thi đầu vào</Text><Text fw={750} c="orange">{assessmentQueue.length}</Text></div><div><Text size="xs" c="dimmed">Bước tiếp theo</Text><Text fw={650}>{nextLead?.nextAction ?? "Chưa có"}</Text></div></Group><Progress value={conversionRate} color="teal" size="sm" mt="md" aria-label="Tỷ lệ ghi danh" /></div></Group></Paper>
    {notice ? <UiStatusBadge role="success" mb="sm">{notice}</UiStatusBadge> : null}
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md"><Metric icon={<UsersRound size={18} />} label="Tổng khách tiềm năng" value={`${leads.length}`} detail="trong pipeline" color="blue" /><Metric icon={<Clock3 size={18} />} label="Đang xử lý" value={`${activeLeads.length}`} detail="cần chăm sóc tiếp" color="orange" /><Metric icon={<CalendarClock size={18} />} label="Chờ thi đầu vào" value={`${assessmentQueue.length}`} detail="cần theo dõi kết quả" color="violet" /><Metric icon={<CheckCircle2 size={18} />} label="Đã ghi danh" value={`${enrolledLeads.length}`} detail={`${conversionRate}% chuyển đổi`} color="teal" /></SimpleGrid>
    <PageToolbar className="toolbar">
      <UiTextInput aria-label="Tìm khách hàng" value={query} onChange={(event) => setQuery(event.currentTarget.value)} style={{ minWidth: 260 }} leftSection={<Search size={16} />} placeholder="Tìm tên, số điện thoại, nhu cầu..." />
      <UiSelect aria-label="Lọc trạng thái" w={190} value={status} onChange={(value) => setStatus(value ?? "all")} data={[{ value: "all", label: t("allStatus") }, ...statuses.map((value) => ({ value, label: value }))]} />
      <UiSelect aria-label="Lọc nguồn" w={160} value={source} onChange={(value) => setSource(value ?? "all")} data={[{ value: "all", label: "Tất cả nguồn" }, ...["Facebook", "Website", "Giới thiệu", "Walk-in"].map((value) => ({ value, label: value }))]} />
      <SegmentedControl value={view} onChange={setView} data={[{ value: "table", label: "Bảng" }, { value: "kanban", label: "Kanban" }]} />
      <UiButton leftSection={<Plus size={16} />} onClick={openCreate}>Tạo mới</UiButton>
    </PageToolbar>
    {view === "table" ? <><UiDataTable table={table} columnCount={columns.length} minWidth={1180} emptyTitle="Không tìm thấy khách hàng phù hợp." /><Text size="xs" c="dimmed" mt="sm">{filteredData.length} / {leads.length} khách hàng · thao tác được thực hiện ngay trên từng dòng.</Text></> : <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">{statuses.map((columnStatus) => { const items = filteredData.filter((lead) => lead.status === columnStatus); return <Paper key={columnStatus} withBorder p="sm"><Group justify="space-between" mb="sm"><Text fw={700}>{columnStatus}</Text><UiBadge>{items.length}</UiBadge></Group><Stack gap="xs">{items.map((lead) => <Paper key={lead.id} withBorder p="sm"><Group justify="space-between" wrap="nowrap"><div><Text size="sm" fw={650}>{lead.name}</Text><Text size="xs" c="dimmed">{lead.interest}</Text><Text size="xs" mt={5}>{lead.nextAction}</Text></div><UiRowActions labels={{ view: "Xem", edit: "Sửa", delete: "Xóa" }} actions={{ view: () => setViewing(lead), edit: () => openEdit(lead), delete: () => setDeleting(lead) }} /></Group></Paper>)}</Stack></Paper>; })}</SimpleGrid>}

    <UiEditModal opened={createOpen || editing !== null} onClose={() => { setCreateOpen(false); setEditing(null); }} title={editing ? `Chỉnh sửa khách hàng · ${editing.name}` : "Tạo khách tiềm năng"} onSave={saveLead} saveLabel={editing ? "Lưu thay đổi" : "Tạo khách hàng"}>
      <Stack><SimpleGrid cols={{ base: 1, sm: 2 }}><UiTextInput label="Họ và tên" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.currentTarget.value })} /><UiTextInput label="Số điện thoại" required value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.currentTarget.value })} /><UiTextInput label="Email" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.currentTarget.value })} /><UiTextInput label="Nhu cầu / chương trình" required value={draft.interest} onChange={(event) => setDraft({ ...draft, interest: event.currentTarget.value })} /><UiSelect label="Nguồn" value={draft.source} onChange={(value) => setDraft({ ...draft, source: value ?? "Website" })} data={["Facebook", "Website", "Giới thiệu", "Walk-in"]} /><UiSelect label="Chi nhánh" value={draft.branch} onChange={(value) => setDraft({ ...draft, branch: value ?? "Cầu Giấy" })} data={["Cầu Giấy", "Hà Đông", "Online Studio"]} /><UiSelect label="Tư vấn viên" value={draft.consultant} onChange={(value) => setDraft({ ...draft, consultant: value ?? "Lan Anh" })} data={["Lan Anh", "Quốc Huy", "Mai Chi"]} /><UiSelect label="Trạng thái" value={draft.status} onChange={(value) => setDraft({ ...draft, status: (value ?? "Mới") as LeadStatus })} data={statuses} /></SimpleGrid><UiTextInput label="Bước tiếp theo" required value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.currentTarget.value })} /><Textarea label="Ghi chú" placeholder="Mục tiêu, lịch học, băn khoăn của khách hàng..." minRows={3} /></Stack>
    </UiEditModal>
    <UiModal opened={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Chi tiết khách hàng · ${viewing.name}` : "Chi tiết khách hàng"}>{viewing ? <Stack><Group><Avatar size="lg" color="primary">{viewing.name.split(" ").at(-1)?.[0]}</Avatar><div><Text fw={700}>{viewing.name}</Text><Text size="sm" c="dimmed">{viewing.phone} · {viewing.email || "Chưa có email"}</Text></div></Group><SimpleGrid cols={2}><Text size="sm"><b>Nhu cầu:</b> {viewing.interest}</Text><Text size="sm"><b>Nguồn:</b> {viewing.source}</Text><Text size="sm"><b>Chi nhánh:</b> {viewing.branch}</Text><Text size="sm"><b>Tư vấn viên:</b> {viewing.consultant}</Text><Text size="sm"><b>Trạng thái:</b> {viewing.status}</Text><Text size="sm"><b>Bước tiếp theo:</b> {viewing.nextAction}</Text></SimpleGrid><Group justify="flex-end"><UiButton variant="default" onClick={() => setViewing(null)}>Đóng</UiButton><UiButton leftSection={<Eye size={15} />} onClick={() => { setViewing(null); openEdit(viewing); }}>Chỉnh sửa hồ sơ</UiButton></Group></Stack> : null}</UiModal>
    <UiConfirmModal opened={deleting !== null} onClose={() => setDeleting(null)} title="Xóa khách tiềm năng" description={deleting ? `Xác nhận xóa hồ sơ ${deleting.name}? Thao tác này chỉ xóa khỏi danh sách demo hiện tại.` : ""} confirmLabel="Xóa hồ sơ" onConfirm={removeLead} />
  </div>;
}

function Metric({ icon, label, value, detail, color }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string }) { return <Paper className="panel" p="md" withBorder><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={21} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>; }
