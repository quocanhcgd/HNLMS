"use client";
import { Group, Paper, Stack, Text, SimpleGrid, Textarea } from "@mantine/core";
import { useMemo, useState } from "react";
import { CalendarClock, ClipboardCheck, FileText, Search, Video } from "lucide-react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";
import { SessionTab } from "./session-tab";
import { AssignmentTab } from "./assignment-tab";
import { AttendanceTab } from "./attendance-tab";
import { ScoreTab } from "./score-tab";

const students = [
  { student: "Nguyễn Minh Anh", attendance: "12/14", progress: "68%", score: "8.5/10", homework: "Trễ 1 bài" },
  { student: "Trần Gia Huy", attendance: "14/14", progress: "54%", score: "7.2/10", homework: "Đủ bài" },
  { student: "Lê Phương Linh", attendance: "13/14", progress: "76%", score: "9.0/10", homework: "Đủ bài" },
];
function Kpis({ items }: { items: Array<[string, string, "success" | "info" | "warning"]> }) { return <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>{items.map(([value, label, role]) => <Paper className={`classInfoCard classInfoCard--${role}`} p="md" key={label}><Text className="classInfoLabel">{label}</Text><Text className="classInfoValue" fw={700} fz="xl">{value}</Text><UiStatusBadge role={role}>Cập nhật</UiStatusBadge></Paper>)}</SimpleGrid>; }
function DataTableView({ data, columns, empty, minWidth = 760 }: { data: any[]; columns: any[]; empty: string; minWidth?: number }) { const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() }); return <UiDataTable table={table} columnCount={columns.length} minWidth={minWidth} emptyTitle={empty} />; }
export function DetailTabContent({ activeKey }: { activeKey: string }) {
  if (activeKey === "students") return <Stack><Kpis items={[["18", "Học viên", "success"], ["14/18", "Đã tham dự", "info"], ["2", "Cần hỗ trợ", "warning"]]} /><DataTableView data={students} columns={[{ accessorKey: "student", header: "Học viên" }, { accessorKey: "attendance", header: "Điểm danh" }, { accessorKey: "progress", header: "Tiến độ" }, { accessorKey: "score", header: "Điểm gần nhất" }, { accessorKey: "homework", header: "Bài tập" }]} empty="Chưa có học viên." /></Stack>;
  if (activeKey === "sessions") return <SessionTab />;
  if (activeKey === "assignments") return <AssignmentTab />;
  /* legacy assignments UI */
  if (activeKey === "assignments-legacy") return <Stack><Kpis items={[["14", "Chờ chấm trên lớp", "warning"], ["12", "Bài về nhà đã nộp", "info"], ["1", "Bài kiểm tra sắp mở", "success"]]} /><DataTableView data={[{title:"Listening warm-up",type:"Bài tập trên lớp",due:"Trong buổi",submitted:"16/18",graded:"14/18"},{title:"Writing Task 1",type:"Bài tập về nhà",due:"26/08",submitted:"12/18",graded:"0/12"},{title:"Mini test Unit 5",type:"Bài kiểm tra",due:"28/08",submitted:"0/18",graded:"-"}]} columns={[{accessorKey:"title",header:"Bài"},{accessorKey:"type",header:"Loại"},{accessorKey:"due",header:"Hạn"},{accessorKey:"submitted",header:"Đã nộp"},{accessorKey:"graded",header:"Đã chấm"}]} empty="Chưa có bài tập." /></Stack>;
  if (activeKey === "materials") return <MaterialsTab />;
  if (activeKey === "attendance") return <AttendanceTab />;
  if (activeKey === "attendance-legacy") return <Stack><Kpis items={[["14/16", "Buổi gần nhất", "info"], ["87,5%", "Tỷ lệ tham dự", "success"], ["2", "Cần xác minh", "warning"]]} /><DataTableView data={students.map(x=>({student:x.student,rate:x.attendance,latest:x.student === "Trần Gia Huy" ? "Có mặt" : "Cần ghi",note:x.homework === "Trễ 1 bài" ? "Vắng 2 buổi" : ""}))} columns={[{accessorKey:"student",header:"Học viên"},{accessorKey:"rate",header:"Tỷ lệ"},{accessorKey:"latest",header:"Buổi gần nhất"},{accessorKey:"note",header:"Ghi chú"}]} empty="Chưa có dữ liệu điểm danh." /></Stack>;
  if (activeKey === "scores") return <ScoreTab />;
  if (activeKey === "scores-legacy") return <Stack><Kpis items={[["8,2", "Điểm trung bình", "info"], ["14", "Đã chấm trên lớp", "success"], ["12", "Bài về nhà chờ chấm", "warning"]]} /><DataTableView data={students.map(x=>({student:x.student,inClass:x.score,test:"8.1",homework:x.homework === "Đủ bài" ? "Chờ chấm" : "-"}))} columns={[{accessorKey:"student",header:"Học viên"},{accessorKey:"inClass",header:"Trên lớp"},{accessorKey:"test",header:"Kiểm tra"},{accessorKey:"homework",header:"Bài về nhà"}]} empty="Chưa có điểm." /></Stack>;
  if (activeKey === "feedback") return <FeedbackTab />;
  if (activeKey === "notifications") return <NotificationsTab />;
  return <Paper className="classInfoCallout" p="lg"><Text fw={700}>Chức năng lớp học</Text><Text size="sm" c="dimmed" mt="xs">Chọn một tab để tiếp tục xử lý.</Text></Paper>;
}


function MaterialsTab() {
  const [query, setQuery] = useState(""); const [type, setType] = useState<string | null>("all"); const [modal, setModal] = useState<"add" | "edit" | "preview" | null>(null); const [selected, setSelected] = useState<any>(null); const [notice, setNotice] = useState("");
  const [items, setItems] = useState([{ id: "m1", title: "IELTS Listening · Warm-up", type: "Bài giảng", session: "Buổi 5", status: "Đã công bố", file: "lesson-unit-5.pdf" }, { id: "m2", title: "Listening vocabulary pack", type: "Tài liệu tham khảo", session: "Buổi 5", status: "Đã công bố", file: "vocabulary-pack.pdf" }, { id: "m3", title: "Unit 5 worksheet", type: "Bài tập", session: "Buổi 5", status: "Chưa công bố", file: "worksheet-unit-5.pdf" }]);
  const filtered = useMemo(() => items.filter((item) => (type === "all" || !type || item.type === type) && JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query, type]);
  const columns = [{ accessorKey: "title", header: "Học liệu", cell: ({ row }: any) => <button className="tableLinkButton" type="button" onClick={() => { setSelected(row.original); setModal("preview"); }}><Text fw={600}>{row.original.title}</Text><Text size="xs" c="dimmed">{row.original.session} · Mở preview</Text></button> }, { accessorKey: "type", header: "Loại" }, { accessorKey: "session", header: "Buổi học" }, { accessorKey: "file", header: "Tệp" }, { accessorKey: "status", header: "Trạng thái", cell: ({ getValue, row }: any) => <Group gap="xs"><UiStatusBadge role={getValue() === "Đã công bố" ? "success" : "warning"}>{getValue()}</UiStatusBadge>{getValue() !== "Đã công bố" ? <UiButton size="compact-xs" onClick={() => { setItems((current) => current.map((item) => item.id === row.original.id ? { ...item, status: "Đã công bố" } : item)); setNotice("Đã công bố tài liệu cho học viên."); }}>Công bố</UiButton> : null}</Group> }, { accessorKey: "action", header: "Thao tác", cell: ({ row }: any) => <Group gap="xs"><UiButton size="compact-xs" variant="default" onClick={() => { setSelected(row.original); setModal("preview"); }}>Xem lại</UiButton><UiButton size="compact-xs" onClick={() => { setSelected(row.original); setModal("edit"); }}>Chỉnh sửa</UiButton></Group> }];
  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });
  const save = () => { if (modal === "edit") setItems((current) => current.map((item) => item.id === selected?.id ? { ...item, title: `${item.title} · Đã cập nhật` } : item)); else setItems((current) => [...current, { id: `m${current.length + 1}`, title: "Tài liệu mới", type: "Tài liệu tham khảo", session: "Buổi 5", status: "Bản nháp", file: "Chưa đính kèm" }]); setNotice(modal === "edit" ? "Đã lưu thay đổi tài liệu." : "Đã thêm tài liệu cho lớp."); setModal(null); };
  return <Stack gap="md"><Group justify="space-between"><Group><UiStatusBadge role="info">{items.length} tài liệu lớp</UiStatusBadge><UiStatusBadge role="success">{items.filter((item) => item.status === "Đã công bố").length} học viên xem được</UiStatusBadge></Group><UiButton onClick={() => setModal("add")}>Thêm tài liệu</UiButton></Group>{notice ? <UiStatusBadge role="success">{notice}</UiStatusBadge> : null}<Group className="toolbar"><UiTextInput aria-label="Tìm tài liệu" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm tài liệu, tên tệp..." /><UiSelect aria-label="Lọc loại tài liệu" w={190} value={type} onChange={setType} data={[{ value: "all", label: "Tất cả loại" }, "Bài giảng", "Tài liệu tham khảo", "Bài tập"]} /></Group><Paper className="panel" p="md" withBorder><UiDataTable table={table} columnCount={columns.length} minWidth={1000} emptyTitle="Không có tài liệu phù hợp." /></Paper><UiModal opened={modal !== null} onClose={() => setModal(null)} title={modal === "preview" ? "Xem tài liệu trong hệ thống" : modal === "edit" ? "Chỉnh sửa tài liệu" : "Thêm tài liệu cho lớp"}><Stack>{modal === "preview" ? <Paper className="panelHighlight" p="lg"><Text fw={700}>{selected?.title}</Text><Text size="sm" c="dimmed" mt="xs">{selected?.file} · {selected?.status}</Text><Text mt="md">Preview viewer: học viên mở nội dung trực tiếp trong hệ thống theo quyền lớp.</Text></Paper> : <><UiTextInput label="Tên tài liệu" defaultValue={selected?.title ?? "Tài liệu mới"} /><UiSelect label="Loại" defaultValue={selected?.type ?? "Tài liệu tham khảo"} data={["Bài giảng", "Tài liệu tham khảo", "Bài tập"]} /><UiTextInput label="Buổi học" defaultValue={selected?.session ?? "Buổi 5"} /><Group justify="flex-end"><UiButton variant="default" onClick={() => setModal(null)}>Hủy</UiButton><UiButton onClick={save}>{modal === "edit" ? "Lưu thay đổi" : "Thêm tài liệu"}</UiButton></Group></>}</Stack></UiModal></Stack>;
}

function FeedbackTab() { const [session, setSession] = useState<string | null>("Buổi 5 · Listening clinic"); const [category, setCategory] = useState<string | null>("Tiến độ học tập"); const [priority, setPriority] = useState<string | null>("Bình thường"); const [note, setNote] = useState("Học viên phản hồi về tốc độ nghe và thời lượng thực hành speaking."); const [status, setStatus] = useState<"Nháp" | "Đã gửi học vụ">("Nháp"); return <Stack gap="md"><Group><UiStatusBadge role={status === "Nháp" ? "warning" : "success"}>{status}</UiStatusBadge><UiStatusBadge role="info">Phạm vi lớp IF-2609</UiStatusBadge></Group><Paper className="panel" p="lg" withBorder><Text fw={700}>Ghi nhận phản hồi buổi học</Text><Text size="sm" c="dimmed" mt="xs">Phản hồi được gửi cho học vụ để theo dõi, không tự thay đổi điểm hay trạng thái học viên.</Text><Stack mt="md"><UiSelect label="Buổi học" value={session} onChange={setSession} data={["Buổi 5 · Listening clinic", "Buổi 4 · Listening warm-up", "Buổi 3 · Grammar in context"]}/><Group grow><UiSelect label="Phân loại" value={category} onChange={setCategory} data={["Tiến độ học tập", "Điểm danh", "Hành vi lớp học", "Sự cố kỹ thuật", "Đề xuất hỗ trợ"]}/><UiSelect label="Mức độ ưu tiên" value={priority} onChange={setPriority} data={["Thấp", "Bình thường", "Cao", "Khẩn cấp"]}/></Group><Textarea label="Nội dung phản hồi" value={note} onChange={(event) => setNote(event.currentTarget.value)} minRows={6} /><Group justify="flex-end"><UiButton variant="default" onClick={() => setStatus("Nháp")}>Lưu nháp</UiButton><UiButton onClick={() => setStatus("Đã gửi học vụ")}>Gửi học vụ</UiButton></Group></Stack></Paper><Paper className="classInfoCallout" p="md"><Text fw={700}>Quy trình sau khi gửi</Text><Text size="sm" c="dimmed" mt="xs">Giáo viên ghi nhận → học vụ tiếp nhận → phân công xử lý → phản hồi lại giáo viên/lớp. Mọi thay đổi nhạy cảm vẫn phải đi qua module sở hữu.</Text></Paper></Stack>; }

function NotificationsTab() {
  type NoticeItem = { id: string; title: string; content: string; audience: string; sentAt: string; status: "Đã gửi" | "Nháp"; schedule: string };
  const [items, setItems] = useState<NoticeItem[]>([
    { id: "n1", title: "Nhắc chuẩn bị Listening clinic", content: "Buổi 5 sẽ bắt đầu lúc 18:00, vui lòng chuẩn bị đầy đủ.", audience: "Học viên lớp", sentAt: "Hôm nay · 09:00", status: "Đã gửi", schedule: "Gửi ngay" },
    { id: "n2", title: "Thông báo bài tập về nhà Unit 5", content: "Nộp Writing Task 1 trước 21:00 ngày 26/08.", audience: "Học viên & phụ huynh được ủy quyền", sentAt: "Dự kiến 19:40", status: "Nháp", schedule: "Hẹn giờ gửi" },
  ]);
  const [modal, setModal] = useState<"create" | "preview" | null>(null);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>("all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<string | null>("Học viên lớp");
  const [schedule, setSchedule] = useState<string | null>("Gửi ngay");
  const [selected, setSelected] = useState<NoticeItem | null>(null);

  const sent = items.filter((x) => x.status === "Đã gửi").length;
  const drafts = items.filter((x) => x.status === "Nháp").length;

  const filtered = useMemo(() => items.filter((x) => (filter === "all" || !filter || x.status === filter) && JSON.stringify(x).toLowerCase().includes(query.toLowerCase())), [items, query, filter]);

  const openCreate = () => { setTitle(""); setContent(""); setAudience("Học viên lớp"); setSchedule("Gửi ngay"); setModal("create"); };

  const send = () => {
    if (!title.trim()) { setNotice("Vui lòng nhập tiêu đề thông báo."); return; }
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setItems((current) => [...current, { id: `n${current.length + 1}`, title: title.trim(), content: content.trim(), audience: audience ?? "Học viên lớp", sentAt: schedule === "Lưu nháp" ? "Chưa gửi" : `Vừa gửi \u00b7 ${timeStr}`, status: schedule === "Lưu nháp" ? "Nháp" : "Đã gửi", schedule: schedule ?? "Gửi ngay" }]);
    setNotice(schedule === "Lưu nháp" ? "Đã lưu nháp thông báo." : "Đã gửi thông báo trong phạm vi lớp.");
    setModal(null);
  };

  const toggleSend = (item: NoticeItem) => {
    if (item.status === "Đã gửi") return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setItems((current) => current.map((x) => x.id === item.id ? { ...x, status: "Đã gửi" as const, sentAt: `Vừa gửi \u00b7 ${timeStr}` } : x));
    setNotice(`Đã gửi thông báo "${item.title}".`);
  };

  const removeItem = (item: NoticeItem) => {
    setItems((current) => current.filter((x) => x.id !== item.id));
    setNotice(`Đã xóa thông báo "${item.title}".`);
  };

  const columns = [
    { accessorKey: "title", header: "Thông báo", cell: ({ row }: any) => <button className="tableLinkButton" type="button" onClick={() => { setSelected(row.original); setModal("preview"); }}><Text fw={600}>{row.original.title}</Text><Text size="xs" c="dimmed">{row.original.audience}</Text></button> },
    { accessorKey: "sentAt", header: "Gửi lúc" },
    { accessorKey: "status", header: "Trạng thái", cell: ({ getValue }: any) => <UiStatusBadge role={getValue() === "Đã gửi" ? "success" : "warning"}>{getValue()}</UiStatusBadge> },
    { accessorKey: "actions", header: "Thao tác", cell: ({ row }: any) => <Group gap="xs">{row.original.status === "Nháp" ? <UiButton size="compact-xs" onClick={() => toggleSend(row.original)}>Gửi ngay</UiButton> : null}<UiButton size="compact-xs" variant="default" onClick={() => { setSelected(row.original); setModal("preview"); }}>Xem lại</UiButton>{row.original.status === "Nháp" ? <UiButton size="compact-xs" variant="default" color="red" onClick={() => removeItem(row.original)}>Xóa</UiButton> : null}</Group> },
  ];

  const table = useReactTable({ data: filtered, columns, getCoreRowModel: getCoreRowModel() });

  return <Stack gap="md">
    <Group justify="space-between">
      <Group><UiStatusBadge role="success">{sent} đã gửi</UiStatusBadge><UiStatusBadge role="warning">{drafts} nháp</UiStatusBadge></Group>
      <UiButton onClick={openCreate}>Tạo thông báo</UiButton>
    </Group>
    {notice ? <UiStatusBadge role="success">{notice}</UiStatusBadge> : null}
    <Group className="toolbar">
      <UiTextInput aria-label="Tìm thông báo" value={query} onChange={(e) => setQuery(e.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm tiêu đề, nội dung..." />
      <UiSelect aria-label="Lọc trạng thái thông báo" w={180} value={filter} onChange={setFilter} data={[{ value: "all", label: "Tất cả trạng thái" }, "Đã gửi", "Nháp"]} />
    </Group>
    <Paper className="panel" p="md" withBorder><UiDataTable table={table} columnCount={columns.length} minWidth={860} emptyTitle="Chưa có thông báo." /></Paper>
    <Paper className="classInfoCallout" p="md"><Text fw={700}>Phạm vi gửi</Text><Text size="sm" c="dimmed">Giáo viên chỉ gửi cho học viên của lớp, phụ huynh có ủy quyền và học vụ liên quan; không gửi được ngoài scope lớp.</Text></Paper>
    <UiModal opened={modal === "create"} onClose={() => setModal(null)} title="Tạo thông báo cho lớp">
      <Stack>
        <UiTextInput label="Tiêu đề" value={title} onChange={(e) => setTitle(e.currentTarget.value)} placeholder="Nhập tiêu đề thông báo..." />
        <Textarea label="Nội dung" minRows={4} value={content} onChange={(e) => setContent(e.currentTarget.value)} placeholder="Nhập nội dung thông báo dành cho học viên lớp..." />
        <UiSelect label="Người nhận" value={audience} onChange={setAudience} data={["Học viên lớp", "Học viên & phụ huynh được ủy quyền", "Học vụ lớp"]} />
        <UiSelect label="Thời điểm gửi" value={schedule} onChange={setSchedule} data={["Gửi ngay", "Lưu nháp", "Hẹn giờ gửi"]} />
        <Group justify="flex-end">
          <UiButton variant="default" onClick={() => setModal(null)}>Hủy</UiButton>
          <UiButton onClick={send}>{schedule === "Lưu nháp" ? "Lưu nháp" : "Gửi thông báo"}</UiButton>
        </Group>
      </Stack>
    </UiModal>
    <UiModal opened={modal === "preview"} onClose={() => setModal(null)} title="Chi tiết thông báo">
      {selected ? <Stack>
        <Group><UiStatusBadge role={selected.status === "Đã gửi" ? "success" : "warning"}>{selected.status}</UiStatusBadge><UiStatusBadge role="info">{selected.audience}</UiStatusBadge></Group>
        <Text fw={700} fz="lg">{selected.title}</Text>
        <Text size="sm" c="dimmed">Gửi lúc: {selected.sentAt} · Lịch: {selected.schedule}</Text>
        <Paper className="panel" p="md" withBorder><Text size="sm">{selected.content || "Không có nội dung."}</Text></Paper>
        {selected.status === "Nháp" ? <Group justify="flex-end"><UiButton onClick={() => { toggleSend(selected); setModal(null); }}>Gửi ngay</UiButton><UiButton variant="default" color="red" onClick={() => { removeItem(selected); setModal(null); }}>Xóa nháp</UiButton></Group> : null}
      </Stack> : null}
    </UiModal>
  </Stack>;
}