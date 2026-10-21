"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { getCoreRowModel, getFilteredRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { Alert, Group, Paper, SimpleGrid, Stack, Text, Textarea } from "@mantine/core";
import { BookOpenCheck, ExternalLink, Link2, Plus, Search, Send, Upload, Video } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  PageToolbar,
  UiButton,
  UiDataTable,
  UiEditModal,
  UiModal,
  UiRowActions,
  UiSelect,
  UiStatusBadge,
  UiTextInput,
} from "@/components/ui";

type ContentStatus = "draft" | "in_review" | "published";
type TeacherContent = {
  id: string;
  title: string;
  type: string;
  scope: string;
  version: number;
  duration: string;
  updatedAt: string;
  status: ContentStatus;
  body: string;
  sourceKind: "none" | "file" | "youtube" | "link";
  source?: string;
  fileName?: string;
  mimeType?: string;
};
const statusLabel: Record<ContentStatus, string> = {
  draft: "Bản nháp",
  in_review: "Đang duyệt",
  published: "Đã công bố",
};
const statusRole: Record<ContentStatus, "neutral" | "warning" | "success"> = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
};
const initialContents: TeacherContent[] = [
  {
    id: "content-1",
    title: "IELTS Listening · Warm-up",
    type: "Bài giảng",
    scope: "Lớp IF-2609",
    version: 3,
    duration: "35 phút",
    updatedAt: "22/08/2026",
    status: "published",
    body: "Mục tiêu bài học, hoạt động nghe và tài nguyên đính kèm.",
    sourceKind: "youtube",
    source: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    id: "content-2",
    title: "Grammar for Writing Task 1",
    type: "Tài liệu",
    scope: "Khóa IELTS Foundation",
    version: 1,
    duration: "20 phút",
    updatedAt: "21/08/2026",
    status: "in_review",
    body: "Ôn cấu trúc câu và thực hành mô tả biểu đồ.",
    sourceKind: "file",
    source: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "grammar-task-1.pdf",
    mimeType: "application/pdf",
  },
  {
    id: "content-3",
    title: "Speaking practice prompts",
    type: "Bài tập",
    scope: "Lớp IA-2610",
    version: 2,
    duration: "15 phút",
    updatedAt: "20/08/2026",
    status: "draft",
    body: "Bộ câu hỏi luyện nói theo cặp và tiêu chí tự đánh giá.",
    sourceKind: "link",
    source: "https://docs.google.com/document/d/example",
  },
];

export function TeacherContentWorkspace() {
  const [contents, setContents] = useState(initialContents);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<TeacherContent | null>(null);
  const [notice, setNotice] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceKind, setSourceKind] = useState<TeacherContent["sourceKind"]>("none");
  const [sourceUrl, setSourceUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<TeacherContent | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const openEditor = (item?: TeacherContent) => {
    setEditing(
      item ?? {
        id: "new",
        title: "",
        type: "Bài giảng",
        scope: "Lớp được phân công",
        version: 1,
        duration: "30 phút",
        updatedAt: "28/08/2026",
        status: "draft",
        body: "",
        sourceKind: "none",
      },
    );
    setTitle(item?.title ?? "");
    setBody(item?.body ?? "");
    setSourceKind(item?.sourceKind ?? "none");
    setSourceUrl(item?.sourceKind === "youtube" || item?.sourceKind === "link" ? item.source ?? "" : "");
    setFile(null);
  };
  const youtubeEmbed = (value?: string) => {
    if (!value) return "";
    try {
      const url = new URL(value);
      const hostname = url.hostname.replace(/^www\./, "");
      if (hostname !== "youtube.com" && hostname !== "youtu.be" && hostname !== "m.youtube.com") return "";
      const segments = url.pathname.split("/").filter(Boolean);
      const id = hostname === "youtu.be" ? segments[0] : url.searchParams.get("v") ?? (segments[0] === "embed" || segments[0] === "shorts" ? segments[1] : "");
      return id && /^[A-Za-z0-9_-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : "";
    } catch {
      return "";
    }
  };
  const closePreview = () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl); setPreviewUrl(""); setPreview(null); };
  const openPreview = (item: TeacherContent) => { closePreview(); setPreview(item); if (item.sourceKind === "file" && item.source) setPreviewUrl(item.source); };
  const saveContent = (nextStatus: ContentStatus = "draft") => {
    if (!editing || !title.trim()) return;
    if (sourceKind === "youtube" && !youtubeEmbed(sourceUrl.trim())) { setNotice("Vui lòng nhập URL YouTube hợp lệ."); return; }
    if (sourceKind === "link" && !/^https?:\/\//i.test(sourceUrl.trim())) { setNotice("URL học liệu phải bắt đầu bằng http:// hoặc https://."); return; }
    if (sourceKind === "file" && !file && editing.id === "new") { setNotice("Vui lòng chọn tệp cần đính kèm."); return; }
    const record = {
      ...editing,
      title: title.trim(),
      body: body.trim() || "Chưa có mô tả nội dung.",
      status: nextStatus,
      updatedAt: "28/08/2026",
      sourceKind,
      source: sourceKind === "youtube" || sourceKind === "link" ? sourceUrl.trim() : editing.source,
      ...(file ? { fileName: file.name, mimeType: file.type, source: URL.createObjectURL(file) } : {}),
    };
    setContents((items) =>
      editing.id === "new"
        ? [{ ...record, id: `content-${Date.now()}` }, ...items]
        : items.map((item) => (item.id === editing.id ? { ...item, ...record } : item)),
    );
    setNotice(
      nextStatus === "in_review" ? `Đã gửi duyệt học liệu “${record.title}”.` : `Đã lưu bản nháp “${record.title}”.`,
    );
    setEditing(null);
  };
  const publish = (item: TeacherContent) => {
    setContents((items) =>
      items.map((row) => (row.id === item.id ? { ...row, status: "published", updatedAt: "28/08/2026" } : row)),
    );
    setNotice(`Đã công bố “${item.title}” cho ${item.scope}.`);
  };
  const filtered = useMemo(
    () =>
      contents.filter(
        (item) =>
          (status === "all" || !status || item.status === status) &&
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase()),
      ),
    [contents, query, status],
  );
  const columns = useMemo<ColumnDef<TeacherContent>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Học liệu",
        cell: ({ row }) => (
          <div>
            <Text fw={600}>{row.original.title}</Text>
            <Text size="xs" c="dimmed">
              {row.original.type} · v{row.original.version}
            </Text>
          </div>
        ),
      },
      { accessorKey: "scope", header: "Phạm vi" },
      { accessorKey: "duration", header: "Thời lượng" },
      { accessorKey: "updatedAt", header: "Cập nhật" },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const value = getValue<ContentStatus>();
          return <UiStatusBadge role={statusRole[value]}>{statusLabel[value]}</UiStatusBadge>;
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        enableSorting: false,
        cell: ({ row }) => (
          <UiRowActions
            labels={{ view: "Xem", edit: "Chỉnh sửa", publish: "Gửi duyệt", archive: "Công bố" }}
            actions={{
              view: () => openPreview(row.original),
              edit: () => openEditor(row.original),
              publish:
                row.original.status === "draft"
                  ? () => {
                      setContents((items) =>
                        items.map((item) =>
                          item.id === row.original.id
                            ? { ...item, status: "in_review", updatedAt: "28/08/2026" }
                            : item,
                        ),
                      );
                      setNotice(`Đã gửi duyệt “${row.original.title}”.`);
                    }
                  : undefined,
              archive: row.original.status === "in_review" ? () => publish(row.original) : undefined,
            }}
          />
        ),
      },
    ],
    [],
  );
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  return (
    <div className="page teacherWorkspace">
      <PageHeader
        title="Soạn học liệu"
        subtitle="Tạo, chỉnh sửa, gửi duyệt và công bố học liệu theo lớp hoặc chương trình được phân công."
        action="Tạo học liệu"
        onAction={() => openEditor()}
      />
      {notice ? (
        <Alert icon={<BookOpenCheck size={16} />} color="teal" mb="md" withCloseButton onClose={() => setNotice("")}>
          {notice}
        </Alert>
      ) : null}
      <PageToolbar className="toolbar" justify="space-between">
        <Group>
          <UiTextInput
            aria-label="Tìm học liệu"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            leftSection={<Search size={16} />}
            placeholder="Tìm học liệu, lớp, loại nội dung..."
          />
          <UiSelect
            aria-label="Lọc trạng thái học liệu"
            w={180}
            value={status}
            onChange={setStatus}
            data={[
              { value: "all", label: "Tất cả trạng thái" },
              { value: "draft", label: "Bản nháp" },
              { value: "in_review", label: "Đang duyệt" },
              { value: "published", label: "Đã công bố" },
            ]}
          />
        </Group>
        <UiButton leftSection={<Plus size={16} />} onClick={() => openEditor()}>
          Tạo học liệu
        </UiButton>
      </PageToolbar>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="md">
        <Summary label="Tổng học liệu" value={`${contents.length}`} detail="trong phạm vi phân công" />
        <Summary
          label="Bản nháp"
          value={`${contents.filter((item) => item.status === "draft").length}`}
          detail="có thể tiếp tục soạn"
        />
        <Summary
          label="Đã công bố"
          value={`${contents.filter((item) => item.status === "published").length}`}
          detail="đang hiển thị cho lớp"
        />
      </SimpleGrid>
      <Paper className="panel" p="md" withBorder>
        <UiDataTable table={table} columnCount={columns.length} minWidth={1080} emptyTitle="Không tìm thấy học liệu." />
        <Text size="xs" c="dimmed" mt="sm">
          Mỗi học liệu là một bản ghi; mọi thao tác chỉnh sửa, gửi duyệt và công bố nằm ngay trên dòng tương ứng.
        </Text>
      </Paper>
      <UiEditModal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id === "new" ? "Tạo học liệu" : "Chỉnh sửa học liệu"}
        onSave={() => saveContent("draft")}
        saveLabel="Lưu bản nháp"
      >
        <Stack>
          <UiTextInput
            label="Tiêu đề"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            placeholder="Ví dụ: Reading · Unit 6"
          />
          <UiSelect
            label="Loại học liệu"
            data={["Bài giảng", "Bài tập", "Tài liệu", "Bài kiểm tra"]}
            value={editing?.type ?? "Bài giảng"}
            onChange={(value) => setEditing((current) => current ? { ...current, type: value ?? current.type } : current)}
          />
          <UiTextInput label="Phạm vi" defaultValue={editing?.scope} readOnly />
          <Textarea
            label="Nội dung / hướng dẫn"
            minRows={7}
            value={body}
            onChange={(event) => setBody(event.currentTarget.value)}
            placeholder="Mục tiêu, hoạt động và tiêu chí hoàn thành..."
          />
          <UiSelect
            label="Nguồn nội dung"
            value={sourceKind}
            onChange={(value) => { setSourceKind((value as TeacherContent["sourceKind"]) || "none"); setSourceUrl(""); setFile(null); }}
            data={[{ value: "none", label: "Chưa gắn nguồn" }, { value: "file", label: "Tải tệp lên" }, { value: "youtube", label: "Video YouTube" }, { value: "link", label: "Liên kết ngoài" }]}
          />
          {sourceKind === "file" ? <label className="mediaFileField"><span><Upload size={15} /> Tệp học liệu</span><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp3,.mp4,.webm,.png,.jpg,.jpeg" onChange={(event) => setFile(event.currentTarget.files?.[0] ?? null)} /><small>{file ? `${file.name} · ${Math.ceil(file.size / 1024)} KB` : "PDF, DOCX, PPTX, MP4, WEBM, MP3 hoặc ảnh"}</small></label> : null}
          {sourceKind === "youtube" ? <UiTextInput label="URL YouTube" leftSection={<Video size={15} />} placeholder="https://www.youtube.com/watch?v=..." value={sourceUrl} onChange={(event) => setSourceUrl(event.currentTarget.value)} /> : null}
          {sourceKind === "link" ? <UiTextInput label="URL học liệu" leftSection={<Link2 size={15} />} placeholder="https://..." value={sourceUrl} onChange={(event) => setSourceUrl(event.currentTarget.value)} /> : null}
          <Group justify="flex-end">
            <UiButton
              leftSection={<Send size={16} />}
              disabled={!title.trim()}
              onClick={() => saveContent("in_review")}
            >
              Gửi duyệt
            </UiButton>
          </Group>
        </Stack>
      </UiEditModal>
      <UiModal opened={preview !== null} onClose={closePreview} title={preview ? `Xem lại học liệu · ${preview.title}` : "Xem lại học liệu"} size="lg">
        {preview ? <Stack gap="md"><Group justify="space-between"><div><Text fw={700} fz="lg">{preview.title}</Text><Text size="sm" c="dimmed">{preview.type} · {preview.scope}</Text></div><UiStatusBadge role={statusRole[preview.status]}>{statusLabel[preview.status]}</UiStatusBadge></Group><Paper className="panelHighlight" p="md"><Text>{preview.body}</Text></Paper>{preview.sourceKind === "youtube" && youtubeEmbed(preview.source) ? <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden", borderRadius: 6, background: "#111" }}><iframe title={preview.title} src={youtubeEmbed(preview.source)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen /></div> : preview.sourceKind === "file" && previewUrl && /\.(mp4|webm)$/i.test(preview.fileName ?? "") ? <video src={previewUrl} controls style={{ width: "100%", borderRadius: 6, background: "#111" }} /> : preview.sourceKind === "file" && previewUrl && /\.pdf$/i.test(preview.fileName ?? "") ? <iframe title={preview.title} src={`${previewUrl}#toolbar=0`} style={{ width: "100%", height: 580, border: 0 }} /> : preview.sourceKind === "link" && preview.source ? <Paper p="lg" withBorder><Group gap="xs"><Link2 size={16} /><Text size="sm">Liên kết học liệu</Text></Group><Text size="sm" c="dimmed" mt="xs" style={{ overflowWrap: "anywhere" }}>{preview.source}</Text><UiButton onClick={() => window.open(preview.source, "_blank", "noopener,noreferrer")} variant="light" size="xs" mt="md" leftSection={<ExternalLink size={14} />}>Mở liên kết</UiButton></Paper> : <Paper p="lg" withBorder><Text c="dimmed">Đã lưu thông tin học liệu. Định dạng này sẽ được mở bằng viewer tương ứng khi có URL stream được cấp quyền.</Text>{preview.fileName ? <Text size="sm" mt="xs">Tệp: {preview.fileName}</Text> : null}</Paper>}<Group justify="flex-end"><UiButton variant="default" onClick={closePreview}>Đóng</UiButton></Group></Stack> : null}
      </UiModal>
    </div>
  );
}
function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Paper className="panel" p="md" withBorder>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fz={25} fw={750}>
        {value}
      </Text>
      <Text size="xs" c="dimmed">
        {detail}
      </Text>
    </Paper>
  );
}
