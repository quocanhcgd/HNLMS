"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Bookmark, BookmarkCheck, Download, Eye, FileText, Image, Link2, PlayCircle, Search, Volume2, X } from "lucide-react";
import { Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { PageHeader } from "@/components/app-shell";
import { PageToolbar, UiButton, UiDataTable, UiModal, UiSelect, UiStatusBadge, UiTextInput } from "@/components/ui";

type ResourceKind = "document" | "video" | "audio" | "image" | "slide" | "link";
type AccessScope = "Toàn trung tâm" | "Theo chương trình" | "Theo lớp";
type LibraryResource = { id: string; title: string; kind: ResourceKind; subject: string; topic: string; program: string; className: string; scope: AccessScope; version: string; publishedAt: string; duration: string; saved: boolean; description: string; downloadAllowed: boolean };
const kindLabel: Record<ResourceKind, string> = { document: "Tài liệu", video: "Video", audio: "Audio", image: "Hình ảnh", slide: "Slide", link: "Liên kết" };
const resources: LibraryResource[] = [
  { id: "lib-1", title: "IELTS Grammar Pack", kind: "document", subject: "Tiếng Anh", topic: "Ngữ pháp", program: "IELTS Foundation", className: "IF-2609", scope: "Theo chương trình", version: "v3", publishedAt: "25/08/2026", duration: "20 phút", saved: true, description: "Tài liệu tổng hợp ngữ pháp dùng cho Unit 1-5.", downloadAllowed: false },
  { id: "lib-2", title: "Speaking warm-up video", kind: "video", subject: "Tiếng Anh", topic: "Nói", program: "Teen B1", className: "EN-2609", scope: "Theo lớp", version: "v1", publishedAt: "24/08/2026", duration: "12 phút", saved: false, description: "Video khởi động luyện độ trôi chảy trước buổi Speaking.", downloadAllowed: false },
  { id: "lib-3", title: "Listening practice audio", kind: "audio", subject: "Tiếng Anh", topic: "Nghe", program: "IELTS Foundation", className: "IF-2609", scope: "Theo lớp", version: "v2", publishedAt: "23/08/2026", duration: "18 phút", saved: true, description: "Audio luyện nghe lấy ý chính và thông tin chi tiết.", downloadAllowed: false },
  { id: "lib-4", title: "Chuyên đề đại số cơ bản", kind: "slide", subject: "Toán", topic: "Đại số", program: "Toán nâng cao", className: "MATH-2609", scope: "Theo chương trình", version: "v4", publishedAt: "22/08/2026", duration: "25 phút", saved: false, description: "Slide ôn tập phương trình và biến đổi đại số.", downloadAllowed: false },
  { id: "lib-5", title: "Đọc hiểu văn bản nghị luận", kind: "document", subject: "Ngữ văn", topic: "Đọc hiểu", program: "Luyện thi 10", className: "LIT-2609", scope: "Toàn trung tâm", version: "v1", publishedAt: "20/08/2026", duration: "30 phút", saved: false, description: "Bộ câu hỏi đọc hiểu kèm hướng dẫn tự kiểm tra.", downloadAllowed: false },
];

const iconFor = (kind: ResourceKind) => kind === "video" ? PlayCircle : kind === "audio" ? Volume2 : kind === "image" ? Image : kind === "link" ? Link2 : FileText;

export function StudentLibraryWorkspace() {
  const [items, setItems] = useState(resources);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string | null>("all");
  const [topic, setTopic] = useState<string | null>("all");
  const [kind, setKind] = useState<string | null>("all");
  const [scope, setScope] = useState<string | null>("all");
  const [saved, setSaved] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selected, setSelected] = useState<LibraryResource | null>(null);
  const [viewerOpened, setViewerOpened] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState("");
  const filtered = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()) && (subject === "all" || !subject || item.subject === subject) && (topic === "all" || !topic || item.topic === topic) && (kind === "all" || !kind || item.kind === kind) && (scope === "all" || !scope || item.scope === scope) && (saved === "all" || !saved || (saved === "saved" ? item.saved : !item.saved))), [items, kind, query, saved, scope, subject, topic]);
  const toggleSaved = (item: LibraryResource) => { const next = !item.saved; setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, saved: next } : candidate)); setSelected((current) => current?.id === item.id ? { ...current, saved: next } : current); };
  const columns = useMemo<ColumnDef<LibraryResource>[]>(() => [
    { accessorKey: "title", header: "Học liệu", cell: ({ row }) => { const Icon = iconFor(row.original.kind); return <Group gap="xs" wrap="nowrap"><Icon size={18} /><div><Text fw={600}>{row.original.title}</Text><Text size="xs" c="dimmed">{kindLabel[row.original.kind]} · {row.original.version}</Text></div></Group>; } },
    { accessorKey: "subject", header: "Môn" },
    { accessorKey: "topic", header: "Chủ đề" },
    { accessorKey: "program", header: "Chương trình", cell: ({ row }) => <div><Text size="sm">{row.original.program}</Text><Text size="xs" c="dimmed">{row.original.className}</Text></div> },
    { accessorKey: "scope", header: "Phạm vi" },
    { accessorKey: "publishedAt", header: "Công bố" },
    { id: "saved", header: "Đã lưu", enableSorting: false, cell: ({ row }) => row.original.saved ? <UiStatusBadge role="success">Đã lưu</UiStatusBadge> : <UiStatusBadge role="neutral">Chưa lưu</UiStatusBadge> },
    { id: "actions", header: "Thao tác", enableSorting: false, cell: ({ row }) => <Group gap="xs" wrap="nowrap"><UiButton size="compact-xs" variant="default" leftSection={<Eye size={14} />} onClick={() => { setSelected(row.original); setViewerOpened(true); }}>Xem</UiButton><UiButton size="compact-xs" leftSection={row.original.saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />} onClick={() => toggleSaved(row.original)}>{row.original.saved ? "Bỏ lưu" : "Lưu"}</UiButton></Group> },
  ], []);
  const table = useReactTable({ data: filtered, columns, state: { sorting, globalFilter: query }, onSortingChange: setSorting, onGlobalFilterChange: setQuery, getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(), getSortedRowModel: getSortedRowModel() });
  return <div className="page">
    <PageHeader title="Thư viện học tập" subtitle="Tìm, lọc, lưu và mở học liệu đã được công bố theo môn, chương trình, lớp và phạm vi quyền truy cập." />
    <PageToolbar className="toolbar"><UiTextInput aria-label="Tìm học liệu" value={query} onChange={(event) => setQuery(event.currentTarget.value)} leftSection={<Search size={16} />} placeholder="Tìm tiêu đề, chủ đề, lớp..." style={{ minWidth: 280 }} /><UiSelect aria-label="Lọc môn học" w={150} value={subject} onChange={setSubject} data={[{ value: "all", label: "Tất cả môn" }, "Tiếng Anh", "Toán", "Ngữ văn"]} /><UiSelect aria-label="Lọc danh mục" w={160} value={topic} onChange={setTopic} data={[{ value: "all", label: "Tất cả danh mục" }, "Ngữ pháp", "Nói", "Nghe", "Đại số", "Đọc hiểu"]} /><UiSelect aria-label="Lọc loại học liệu" w={160} value={kind} onChange={setKind} data={[{ value: "all", label: "Tất cả loại" }, ...Object.entries(kindLabel).map(([value, label]) => ({ value, label }))]} /><UiSelect aria-label="Lọc phạm vi" w={170} value={scope} onChange={setScope} data={[{ value: "all", label: "Tất cả phạm vi" }, "Toàn trung tâm", "Theo chương trình", "Theo lớp"]} /><UiSelect aria-label="Lọc học liệu đã lưu" w={140} value={saved} onChange={setSaved} data={[{ value: "all", label: "Tất cả" }, { value: "saved", label: "Đã lưu" }, { value: "unsaved", label: "Chưa lưu" }]} /></PageToolbar>
    <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" mb="md"><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Học liệu được cấp quyền</Text><Text fz={24} fw={700}>{filtered.length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Đã lưu</Text><Text fz={24} fw={700}>{filtered.filter((item) => item.saved).length}</Text></Paper><Paper className="panel" p="md" withBorder><Text size="sm" c="dimmed">Môn học</Text><Text fz={24} fw={700}>{new Set(filtered.map((item) => item.subject)).size}</Text></Paper></SimpleGrid>
    <UiDataTable table={table} columnCount={columns.length} minWidth={1240} emptyTitle="Không tìm thấy học liệu được cấp quyền." />
    <Text size="xs" c="dimmed" mt="sm">Chỉ hiển thị phiên bản đã công bố và còn quyền truy cập. Học liệu bị thu hồi hoặc bản nháp không xuất hiện ở cổng học viên.</Text>
    <UiModal opened={Boolean(viewerOpened && selected)} onClose={() => { setViewerOpened(false); setSelected(null); setDownloadNotice(""); }} title={selected ? selected.title : "Học liệu"}>{selected ? <Stack gap="sm"><Group justify="space-between"><Text>{kindLabel[selected.kind]} · {selected.duration}</Text><UiStatusBadge role="success">Đã công bố · {selected.version}</UiStatusBadge></Group><Text size="sm">{selected.subject} · {selected.topic} · {selected.program} · {selected.className}</Text><Paper className="panelHighlight" p="md"><Text fw={600}>{selected.description}</Text><Text size="sm" c="dimmed" mt="xs">Nội dung được mở theo quyền của học viên và phiên bản đã công bố.</Text><Text size="xs" c="dimmed" mt="xs">Tải xuống chỉ khả dụng khi chính sách của tài nguyên cho phép.</Text></Paper>{downloadNotice ? <UiStatusBadge role="info">{downloadNotice}</UiStatusBadge> : null}<Group justify="flex-end">{selected.downloadAllowed ? <UiButton variant="default" leftSection={<Download size={14} />} onClick={() => setDownloadNotice("Đã tạo yêu cầu tải bản được cấp quyền.")}>Tải xuống</UiButton> : null}<UiButton variant="default" leftSection={<X size={14} />} onClick={() => setViewerOpened(false)}>Đóng trình xem</UiButton><UiButton onClick={() => toggleSaved(selected)}>{selected.saved ? "Bỏ lưu" : "Lưu học liệu"}</UiButton></Group></Stack> : null}</UiModal>
  </div>;
}
