"use client";

import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Group, Paper, Progress, SimpleGrid, Stack, Text, ThemeIcon } from "@mantine/core";
import { BarChart3, CheckCircle2, Clock3, Eye, GitBranch, Search, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { readDemoSession, type DemoSession } from "@/lib/demo-auth";
import { PageToolbar, UiBadge, UiConfirmModal, UiDataTable, UiEditModal, UiModal, UiRowActions, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ManagerStatus = "Mới" | "Đang tư vấn" | "Chờ thi đầu vào" | "Đề xuất lớp" | "Đã ghi danh" | "Không phù hợp";
type Lead = { id: string; name: string; phone: string; program: string; source: string; branch: string; owner: string; status: ManagerStatus; nextAction: string; dueAt: string };
type Assignment = { lead: Lead; owner: string; branch: string };
type StatusUpdate = { lead: Lead; status: ManagerStatus; nextAction: string; dueAt: string };
type HandoffAction = { lead: Lead; action: "approve" | "reject" };

const statuses: ManagerStatus[] = ["Mới", "Đang tư vấn", "Chờ thi đầu vào", "Đề xuất lớp", "Đã ghi danh", "Không phù hợp"];
const statusRole: Record<ManagerStatus, "primary" | "success" | "warning" | "info" | "neutral"> = { "Mới": "primary", "Đang tư vấn": "info", "Chờ thi đầu vào": "warning", "Đề xuất lớp": "warning", "Đã ghi danh": "success", "Không phù hợp": "neutral" };
const consultants = ["Lan Anh", "Quốc Huy", "Mai Chi"];
const branches = ["Cầu Giấy", "Hà Đông", "Online Studio"];
const seedLeads: Lead[] = [
  { id: "mgr-001", name: "Nguyễn Minh Anh", phone: "0909 120 286", program: "IELTS 6.5 trong 6 tháng", source: "Facebook", branch: "Cầu Giấy", owner: "Lan Anh", status: "Đang tư vấn", nextAction: "Gửi lịch thi đầu vào", dueAt: "Hôm nay" },
  { id: "mgr-002", name: "Trần Hoàng Nam", phone: "0908 440 154", program: "Giao tiếp doanh nghiệp", source: "Website", branch: "Cầu Giấy", owner: "Quốc Huy", status: "Chờ thi đầu vào", nextAction: "Theo dõi kết quả", dueAt: "Hôm nay" },
  { id: "mgr-003", name: "Lê Bảo Ngọc", phone: "0912 440 912", program: "TOEIC 700+", source: "Giới thiệu", branch: "Hà Đông", owner: "Chưa phân công", status: "Mới", nextAction: "Phân công tư vấn viên", dueAt: "Quá hạn 1 ngày" },
  { id: "mgr-004", name: "Phạm Gia Hân", phone: "0988 330 448", program: "Tiếng Anh thiếu niên", source: "Walk-in", branch: "Cầu Giấy", owner: "Mai Chi", status: "Đề xuất lớp", nextAction: "Duyệt bàn giao học vụ", dueAt: "Ngày mai" },
  { id: "mgr-005", name: "Đỗ Khánh Linh", phone: "0901 220 735", program: "IELTS Foundation", source: "Facebook", branch: "Online Studio", owner: "Quốc Huy", status: "Đã ghi danh", nextAction: "Đã bàn giao học vụ", dueAt: "Đã hoàn tất" },
];

const isDue = (lead: Lead) => lead.dueAt.startsWith("Quá hạn");

export default function AdmissionManagerWorkspace() {
  const [session, setSession] = useState<DemoSession | null>(null);
  const branchManager = session?.role === "branch_manager";
  const branchOptions = branchManager ? ["Cầu Giấy"] : branches;
  const [leads, setLeads] = useState(seedLeads);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [branch, setBranch] = useState("all");
  const [owner, setOwner] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [viewing, setViewing] = useState<Lead | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<StatusUpdate | null>(null);
  const [handoff, setHandoff] = useState<HandoffAction | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { const current = readDemoSession(); setSession(current); setBranch(current?.role === "branch_manager" ? "Cầu Giấy" : "all"); }, []);

  const filtered = useMemo(() => leads.filter((lead) => {
    if (!session) return false;
    const text = `${lead.name} ${lead.phone} ${lead.program} ${lead.owner}`.toLowerCase();
    const statusMatch = status === "active" ? !["Đã ghi danh", "Không phù hợp"].includes(lead.status) : status === "all" || lead.status === status;
    return text.includes(query.trim().toLowerCase()) && statusMatch && (branch === "all" || lead.branch === branch) && (owner === "all" || lead.owner === owner);
  }), [branch, leads, owner, query, session, status]);
  const active = leads.filter((lead) => !["Đã ghi danh", "Không phù hợp"].includes(lead.status));
  const unassigned = leads.filter((lead) => lead.owner === "Chưa phân công").length;
  const overdue = leads.filter(isDue).length;
  const ready = leads.filter((lead) => lead.status === "Đề xuất lớp").length;
  const enrolled = leads.filter((lead) => lead.status === "Đã ghi danh").length;
  const conversion = leads.length ? Math.round((enrolled / leads.length) * 100) : 0;

  const assignLead = () => {
    if (!assignment?.owner) { setError("Chọn tư vấn viên trước khi phân công."); return; }
    const targetBranch = branchManager ? "Cầu Giấy" : assignment.branch;
    setLeads((current) => current.map((lead) => lead.id === assignment.lead.id ? { ...lead, owner: assignment.owner, branch: targetBranch, status: lead.status === "Mới" ? "Đang tư vấn" : lead.status, nextAction: "Theo dõi cuộc tư vấn" } : lead));
    setAssignment(null);
    setNotice(`Đã phân công ${assignment.lead.name} cho ${assignment.owner}.`);
    setError("");
  };
  const approveHandoff = () => {
    if (!handoff) return;
    if (handoff.action === "approve") {
      setLeads((current) => current.map((lead) => lead.id === handoff.lead.id ? { ...lead, status: "Đã ghi danh", nextAction: "Đã bàn giao học vụ", dueAt: "Đã hoàn tất" } : lead));
      setNotice(`Đã duyệt bàn giao hồ sơ ${handoff.lead.name} sang học vụ và tài chính.`);
    } else {
      setLeads((current) => current.map((lead) => lead.id === handoff.lead.id ? { ...lead, status: "Đang tư vấn", nextAction: "Bổ sung hồ sơ trước khi bàn giao", dueAt: "Trong 1 ngày" } : lead));
      setNotice(`Đã trả hồ sơ ${handoff.lead.name} về tư vấn để bổ sung thông tin.`);
    }
    setHandoff(null);
  };
  const saveStatusUpdate = () => {
    if (!statusUpdate?.nextAction.trim()) {
      setError("Nhập bước tiếp theo trước khi lưu.");
      return;
    }
    setLeads((current) => current.map((lead) => lead.id === statusUpdate.lead.id ? {
      ...lead,
      status: statusUpdate.status,
      nextAction: statusUpdate.status === "Đã ghi danh" || statusUpdate.status === "Không phù hợp" ? "Đã hoàn tất" : statusUpdate.nextAction.trim(),
      dueAt: statusUpdate.status === "Đã ghi danh" || statusUpdate.status === "Không phù hợp" ? "Đã hoàn tất" : statusUpdate.dueAt.trim() || "Chưa đặt hạn",
    } : lead));
    setNotice(`Đã cập nhật bước xử lý cho ${statusUpdate.lead.name}.`);
    setStatusUpdate(null);
    setError("");
  };

  const columns = useMemo<ColumnDef<Lead>[]>(() => [
    { accessorKey: "name", header: "Khách hàng", cell: ({ row }) => <div><Text fw={650}>{row.original.name}</Text><Text size="xs" c="dimmed">{row.original.phone}</Text></div> },
    { accessorKey: "program", header: "Chương trình" },
    { accessorKey: "branch", header: "Cơ sở" },
    { accessorKey: "owner", header: "Tư vấn viên", cell: ({ getValue }) => <Text size="sm" c={getValue<string>() === "Chưa phân công" ? "orange" : undefined}>{String(getValue())}</Text> },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }) => { const value = getValue<ManagerStatus>(); return <UiStatusBadge role={statusRole[value]}>{value}</UiStatusBadge>; } },
    { accessorKey: "dueAt", header: "SLA / bước tiếp theo", cell: ({ row }) => <div><Text size="sm" c={isDue(row.original) ? "red" : undefined}>{row.original.dueAt}</Text><Text size="xs" c="dimmed">{row.original.nextAction}</Text></div> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <UiRowActions actions={{ view: () => setViewing(row.original), edit: () => setAssignment({ lead: row.original, owner: row.original.owner === "Chưa phân công" ? "" : row.original.owner, branch: row.original.branch }), publish: row.original.status === "Đề xuất lớp" ? () => setHandoff({ lead: row.original, action: "approve" }) : undefined, archive: row.original.status === "Đề xuất lớp" ? () => setHandoff({ lead: row.original, action: "reject" }) : undefined, void: () => setStatusUpdate({ lead: row.original, status: row.original.status, nextAction: row.original.nextAction, dueAt: row.original.dueAt }) }} labels={{ view: "Xem hồ sơ", edit: "Phân công", publish: "Duyệt bàn giao", archive: "Trả về tư vấn", void: "Cập nhật bước" }} /> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });

  return <div className="page">
    <PageHeader title="Điều hành tuyển sinh" subtitle={branchManager ? "Phân công lead, kiểm soát SLA và duyệt bàn giao trong phạm vi cơ sở được phân quyền." : "Phân công lead, kiểm soát SLA, duyệt bàn giao và theo dõi hiệu quả tuyển sinh toàn tổ chức."} action="Phân công nhanh" onAction={() => { const next = leads.find((lead) => (branchManager ? lead.branch === "Cầu Giấy" : true) && lead.owner === "Chưa phân công"); if (next) setAssignment({ lead: next, owner: "", branch: next.branch }); else setNotice("Không còn lead chưa phân công."); }} />
    {error ? <UiStatusBadge role="danger" mb="sm">{error}</UiStatusBadge> : null}{notice ? <UiStatusBadge role="success" mb="sm">{notice}</UiStatusBadge> : null}
    <Paper className="panel" p="md" mb="md" withBorder><Group gap="sm" mb="xs"><ThemeIcon size={32} radius="md" color="blue" variant="light"><Eye size={17} /></ThemeIcon><div><Text fw={700}>{branchManager ? "Tuyển sinh trong phạm vi cơ sở" : "Vai trò Quản lý tuyển sinh"}</Text><Text size="sm" c="dimmed">{branchManager ? "Điều phối lead của cơ sở và bàn giao hồ sơ đủ điều kiện sang học vụ." : "Chịu trách nhiệm điều phối toàn bộ pipeline, không thay thế công việc tư vấn chi tiết."}</Text></div></Group><SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xs"><Text size="sm"><b>1.</b> Tiếp nhận và phân công lead</Text><Text size="sm"><b>2.</b> Theo dõi SLA và bước tiếp theo</Text><Text size="sm"><b>3.</b> Can thiệp hồ sơ quá hạn</Text><Text size="sm"><b>4.</b> Duyệt hoặc trả hồ sơ bàn giao</Text></SimpleGrid></Paper>
    <Paper withBorder p="lg" mb="md" className="panelHighlight"><Group justify="space-between" align="flex-start" wrap="wrap"><Group gap="md"><ThemeIcon size={46} radius="md" color="teal"><BarChart3 size={23} /></ThemeIcon><div><Text size="sm" c="dimmed">Tổng quan điều hành</Text><Text fz={28} fw={800}>{active.length} hồ sơ đang trong pipeline</Text><Text size="sm" c="dimmed">Theo dõi trách nhiệm từ tiếp nhận lead đến bàn giao học vụ.</Text></div></Group><div style={{ minWidth: 220 }}><Group justify="space-between"><Text size="xs" c="dimmed">Tỷ lệ ghi danh</Text><Text size="sm" fw={700}>{conversion}%</Text></Group><Progress value={conversion} color="teal" size="sm" mt={6} /></div></Group></Paper>
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="md"><Metric icon={<UsersRound size={18} />} label="Đang xử lý" value={`${active.length}`} detail="hồ sơ active" color="blue" href="#lead-queue" /><Metric icon={<GitBranch size={18} />} label="Chưa phân công" value={`${unassigned}`} detail="cần điều phối" color="orange" href="#lead-queue" /><Metric icon={<Clock3 size={18} />} label="Quá hạn SLA" value={`${overdue}`} detail="cần can thiệp" color="red" href="#lead-queue" /><Metric icon={<CheckCircle2 size={18} />} label="Chờ duyệt bàn giao" value={`${ready}`} detail="sang học vụ" color="teal" href="#lead-queue" /></SimpleGrid>
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm hồ sơ tuyển sinh" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm tên, số điện thoại, chương trình..." /><UiSelect aria-label="Lọc trạng thái tuyển sinh" value={status} onChange={(value) => setStatus(value ?? "active")} data={[{ value: "active", label: "Đang xử lý" }, { value: "all", label: "Tất cả trạng thái" }, ...statuses.map((value) => ({ value, label: value }))]} w={190} />{branchManager ? <UiSelect aria-label="Lọc cơ sở tuyển sinh" value={branch} onChange={(value) => setBranch(value ?? "Cầu Giấy")} data={[{ value: "Cầu Giấy", label: "Cầu Giấy" }]} w={170} /> : <UiSelect aria-label="Lọc cơ sở tuyển sinh" value={branch} onChange={(value) => setBranch(value ?? "all")} data={[{ value: "all", label: "Tất cả cơ sở" }, ...branches.map((value) => ({ value, label: value }))]} w={170} />}<UiSelect aria-label="Lọc tư vấn viên" value={owner} onChange={(value) => setOwner(value ?? "all")} data={[{ value: "all", label: "Tất cả tư vấn viên" }, { value: "Chưa phân công", label: "Chưa phân công" }, ...consultants.map((value) => ({ value, label: value }))]} w={185} /></PageToolbar>
    <Paper id="lead-queue" className="panel" p="md" withBorder><Group justify="space-between" mb="sm"><div><Text fw={700}>{branchManager ? "Work queue tuyển sinh cơ sở" : "Work queue tuyển sinh toàn tổ chức"}</Text><Text size="sm" c="dimmed">Mọi hồ sơ phải có người phụ trách, hạn xử lý và bước tiếp theo.</Text></div><UiBadge>{filtered.length} hồ sơ</UiBadge></Group><UiDataTable table={table} columnCount={columns.length} minWidth={1180} emptyTitle="Không có hồ sơ phù hợp." /></Paper>
    <UiEditModal opened={assignment !== null} onClose={() => setAssignment(null)} title={assignment ? `Phân công · ${assignment.lead.name}` : "Phân công lead"} onSave={assignLead} saveLabel="Lưu phân công"><Stack><UiTextInput label="Khách hàng" value={assignment?.lead.name ?? ""} readOnly /><UiSelect label="Tư vấn viên phụ trách" required value={assignment?.owner ?? ""} onChange={(value) => setAssignment((current) => current ? { ...current, owner: value ?? "" } : current)} data={consultants} /><UiSelect label="Cơ sở xử lý" value={assignment?.branch ?? ""} onChange={(value) => setAssignment((current) => current ? { ...current, branch: value ?? current.branch } : current)} data={branchOptions} disabled={branchManager} /><Text size="xs" c="dimmed">{branchManager ? "Lead được giữ trong cơ sở Cầu Giấy theo phạm vi phân quyền." : "Lead mới sẽ chuyển sang trạng thái Đang tư vấn sau khi phân công."}</Text></Stack></UiEditModal>
    <UiModal opened={viewing !== null} onClose={() => setViewing(null)} title={viewing ? `Hồ sơ tuyển sinh · ${viewing.name}` : "Hồ sơ tuyển sinh"} size="md"><Stack gap="sm">{viewing ? <><Group justify="space-between"><div><Text fw={700}>{viewing.name}</Text><Text size="sm" c="dimmed">{viewing.phone} · Nguồn {viewing.source}</Text></div><UiStatusBadge role={statusRole[viewing.status]}>{viewing.status}</UiStatusBadge></Group><Text size="sm"><b>Chương trình:</b> {viewing.program}</Text><Text size="sm"><b>Cơ sở:</b> {viewing.branch}</Text><Text size="sm"><b>Tư vấn viên:</b> {viewing.owner}</Text><Paper withBorder p="sm"><Text size="xs" c="dimmed">Bước tiếp theo</Text><Text size="sm" fw={600}>{viewing.nextAction}</Text><Text size="xs" c={isDue(viewing) ? "red" : "dimmed"}>{viewing.dueAt}</Text></Paper><Text size="xs" c="dimmed">Quản lý tuyển sinh xem và điều phối hồ sơ; nội dung tư vấn chi tiết được lưu tại không gian của tư vấn viên.</Text></> : null}</Stack></UiModal>
    <UiEditModal opened={statusUpdate !== null} onClose={() => setStatusUpdate(null)} title={statusUpdate ? `Cập nhật bước · ${statusUpdate.lead.name}` : "Cập nhật bước"} onSave={saveStatusUpdate} saveLabel="Lưu cập nhật"><Stack><UiSelect label="Trạng thái pipeline" required value={statusUpdate?.status ?? ""} onChange={(value) => setStatusUpdate((current) => current ? { ...current, status: (value as ManagerStatus) ?? current.status } : current)} data={statuses} /><UiTextInput label="Bước tiếp theo" required value={statusUpdate?.nextAction ?? ""} onChange={(event) => { const value = event.currentTarget.value; setStatusUpdate((current) => current ? { ...current, nextAction: value } : current); }} placeholder="Ví dụ: Gọi lại xác nhận lịch thi" /><UiTextInput label="Hạn xử lý / SLA" value={statusUpdate?.dueAt ?? ""} onChange={(event) => { const value = event.currentTarget.value; setStatusUpdate((current) => current ? { ...current, dueAt: value } : current); }} placeholder="Ví dụ: Trong hôm nay, Quá hạn 1 ngày" /><Text size="xs" c="dimmed">Hồ sơ đã ghi danh hoặc không phù hợp sẽ tự đóng bước xử lý.</Text></Stack></UiEditModal>
    <UiConfirmModal opened={handoff !== null} onClose={() => setHandoff(null)} title={handoff?.action === "reject" ? "Trả hồ sơ về tư vấn" : "Duyệt bàn giao hồ sơ"} description={handoff ? `${handoff.lead.name} · ${handoff.lead.program}. ${handoff.action === "reject" ? "Hồ sơ sẽ quay lại trạng thái Đang tư vấn để bổ sung thông tin." : "Xác nhận hồ sơ đã đủ thông tin để chuyển sang học vụ và tài chính?"}` : ""} confirmLabel={handoff?.action === "reject" ? "Trả về tư vấn" : "Duyệt bàn giao"} destructive={handoff?.action === "reject"} onConfirm={approveHandoff} />
  </div>;
}

function Metric({ icon, label, value, detail, color, href }: { icon: React.ReactNode; label: string; value: string; detail: string; color: string; href: string }) { return <Paper component="a" href={href} className="panel" p="md" withBorder style={{ color: "inherit", textDecoration: "none" }}><Group gap="sm" wrap="nowrap"><ThemeIcon color={color} variant="light" size={36} radius="md">{icon}</ThemeIcon><div><Text size="xs" c="dimmed">{label}</Text><Text fz={22} fw={750}>{value}</Text><Text size="xs" c="dimmed">{detail}</Text></div></Group></Paper>; }
