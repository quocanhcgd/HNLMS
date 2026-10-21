"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button, Checkbox, Drawer, Group, Paper, Stack, Text } from "@mantine/core";
import { Check, CircleOff, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import {
  PageToolbar,
  UiBadge,
  UiButton,
  UiDataTable,
  UiSelect,
  UiStatusBadge,
  UiTextInput,
  UiConfirmModal,
  UiEditModal,
  UiRowActions,
  uiStatusRoleColor,
  type UiStatusRole,
} from "@/components/ui";

/* ---------- types ---------- */

export type ContentKind = "page" | "course" | "instructor" | "studentHighlight" | "news" | "announcement" | "cta";

export type ContentStatus = "draft" | "review" | "published" | "revoked";

export type LandingContent = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  summary: string | null;
  body: unknown;
  media: unknown;
  locale: string;
  sortOrder: number;
  version: number;
  status: ContentStatus;
  publishedAt: string | null;
  revokedAt: string | null;
  publishedByUserId: string | null;
  revokedByUserId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentFilters = {
  kind?: ContentKind;
  status?: ContentStatus;
  search?: string;
};

/* ---------- helpers ---------- */

const kindLabels: Record<ContentKind, string> = {
  page: "Trang",
  course: "Khóa học",
  instructor: "Giảng viên",
  studentHighlight: "HV tiêu biểu",
  news: "Tin tức",
  announcement: "Thông báo",
  cta: "Kêu gọi HĐ",
};

const statusConfig: Record<ContentStatus, { label: string; role: UiStatusRole }> = {
  draft: { label: "Bản nháp", role: "neutral" },
  review: { label: "Đang duyệt", role: "warning" },
  published: { label: "Đã công bố", role: "success" },
  revoked: { label: "Đã thu hồi", role: "danger" },
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------- data (mock) ---------- */

const mockContent: LandingContent[] = [
  {
    id: "lc-1",
    kind: "page",
    slug: "gioi-thieu",
    title: "Giới thiệu tổ chức",
    summary: "Thông tin tổng quan về HN Learning",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 0,
    version: 2,
    status: "published",
    publishedAt: "2026-08-19T10:00:00Z",
    revokedAt: null,
    publishedByUserId: "admin-1",
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: "2026-08-18T08:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
  },
  {
    id: "lc-2",
    kind: "course",
    slug: "ielts-foundation",
    title: "IELTS Foundation",
    summary: "Khóa học nền tảng IELTS cho người mới bắt đầu",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 1,
    version: 1,
    status: "published",
    publishedAt: "2026-08-20T09:30:00Z",
    revokedAt: null,
    publishedByUserId: "admin-1",
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: "2026-08-19T14:00:00Z",
    updatedAt: "2026-08-20T09:30:00Z",
  },
  {
    id: "lc-3",
    kind: "instructor",
    slug: "thay-minh-tuan",
    title: "Thầy Minh Tuấn",
    summary: "Giảng viên IELTS 8.5, kinh nghiệm 10 năm",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 2,
    version: 1,
    status: "draft",
    publishedAt: null,
    revokedAt: null,
    publishedByUserId: null,
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: "2026-08-20T11:00:00Z",
    updatedAt: "2026-08-20T11:00:00Z",
  },
  {
    id: "lc-4",
    kind: "news",
    slug: "khai-giang-lop-moi",
    title: "Khai giảng lớp IELTS A1 mới",
    summary: "Lớp IELTS Foundation A1 khai giảng 01/09/2026",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 3,
    version: 3,
    status: "published",
    publishedAt: "2026-08-21T07:00:00Z",
    revokedAt: null,
    publishedByUserId: "admin-1",
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: "2026-08-17T09:00:00Z",
    updatedAt: "2026-08-21T07:00:00Z",
  },
  {
    id: "lc-5",
    kind: "studentHighlight",
    slug: "nguyen-minh-anh",
    title: "Nguyễn Minh Anh - IELTS 7.5",
    summary: "Học viên xuất sắc sau 6 tháng tại HN Learning",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 4,
    version: 1,
    status: "review",
    publishedAt: null,
    revokedAt: null,
    publishedByUserId: null,
    revokedByUserId: null,
    createdByUserId: "admin-2",
    createdAt: "2026-08-20T15:00:00Z",
    updatedAt: "2026-08-20T15:00:00Z",
  },
  {
    id: "lc-6",
    kind: "cta",
    slug: "dang-ky-tu-van",
    title: "Đăng ký tư vấn miễn phí",
    summary: "Liên hệ ngay để được tư vấn khóa học phù hợp",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 5,
    version: 1,
    status: "published",
    publishedAt: "2026-08-19T08:00:00Z",
    revokedAt: null,
    publishedByUserId: "admin-1",
    revokedByUserId: null,
    createdByUserId: "admin-1",
    createdAt: "2026-08-19T08:00:00Z",
    updatedAt: "2026-08-19T08:00:00Z",
  },
  {
    id: "lc-7",
    kind: "announcement",
    slug: "uu-dai-hoc-phi",
    title: "Ưu đãi học phí tháng 9",
    summary: "Giảm 15% học phí cho đăng ký trước 15/09",
    body: null,
    media: null,
    locale: "vi",
    sortOrder: 6,
    version: 2,
    status: "revoked",
    publishedAt: "2026-08-15T10:00:00Z",
    revokedAt: "2026-08-20T16:00:00Z",
    publishedByUserId: "admin-1",
    revokedByUserId: "admin-1",
    createdByUserId: "admin-1",
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-08-20T16:00:00Z",
  },
];

/* ---------- main component ---------- */

export function ContentListWorkspace() {
  const [items, setItems] = useState(mockContent);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string | null>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [selectedIds, setSelectedIds] = useState<RowSelectionState>({});
  const [previewItem, setPreviewItem] = useState<LandingContent | null>(null);
  const [editItem, setEditItem] = useState<LandingContent | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "revoke" | "delete";
    items: LandingContent[];
  } | null>(null);

  const filteredData = useMemo(() => {
    let result = [...items];
    if (kindFilter && kindFilter !== "all") {
      result = result.filter((i) => i.kind === kindFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.slug.toLowerCase().includes(q) ||
          (i.summary && i.summary.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, kindFilter, statusFilter, query]);

  function openCreate() {
    setEditItem(null);
    setEditModalOpen(true);
  }

  function saveContent(draft: LandingContent) {
    setItems((current) => current.some((item) => item.id === draft.id) ? current.map((item) => item.id === draft.id ? draft : item) : [...current, draft]);
    setNotice(`${draft.id.startsWith("lc-") && items.some((item) => item.id === draft.id) ? "Đã cập nhật" : "Đã tạo"} nội dung “${draft.title}”.`);
    setEditModalOpen(false);
    setEditItem(null);
  }

  function applyStatus(type: "publish" | "revoke" | "delete", targets: LandingContent[]) {
    if (type === "delete") {
      const ids = new Set(targets.map((target) => target.id));
      setItems((current) => current.filter((item) => !ids.has(item.id)));
      setNotice(`Đã xóa ${targets.length} nội dung.`);
    } else {
      const status: ContentStatus = type === "publish" ? "published" : "revoked";
      const now = new Date().toISOString();
      const ids = new Set(targets.map((target) => target.id));
      setItems((current) => current.map((item) => ids.has(item.id) ? { ...item, status, publishedAt: type === "publish" ? now : item.publishedAt, revokedAt: type === "revoke" ? now : item.revokedAt, updatedAt: now, version: item.version + (type === "publish" ? 1 : 0) } : item));
      setNotice(`${type === "publish" ? "Đã công bố" : "Đã thu hồi"} ${targets.length} nội dung.`);
    }
    setConfirmAction(null);
    setSelectedIds({});
  }

  const columns = useMemo<ColumnDef<LandingContent>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.currentTarget.checked)}
            aria-label="Chọn tất cả"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.currentTarget.checked)}
            aria-label={`Chọn ${row.original.title}`}
          />
        ),
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <Stack gap={2}>
            <Text size="sm" fw={600}>
              {row.original.title}
            </Text>
            <Text size="xs" c="dimmed">
              /{row.original.slug}
            </Text>
          </Stack>
        ),
      },
      {
        accessorKey: "kind",
        header: "Loại",
        cell: ({ getValue }) => (
          <UiBadge variant="outline" color="gray">
            {kindLabels[getValue() as ContentKind]}
          </UiBadge>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ getValue }) => {
          const s = statusConfig[getValue() as ContentStatus];
          return <UiStatusBadge role={s.role}>{s.label}</UiStatusBadge>;
        },
      },
      {
        accessorKey: "version",
        header: "Phiên bản",
        cell: ({ getValue }) => <Text size="sm">v{getValue() as number}</Text>,
      },
      {
        accessorKey: "sortOrder",
        header: "Thứ tự",
        cell: ({ getValue }) => <Text size="sm">{getValue() as number}</Text>,
      },
      {
        accessorKey: "updatedAt",
        header: "Cập nhật",
        cell: ({ getValue }) => (
          <Text size="sm" c="dimmed">
            {formatDate(getValue() as string)}
          </Text>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row }) => {
          const item = row.original;
          return <UiRowActions actions={{
            view: () => setPreviewItem(item),
            edit: item.status !== "published" && item.status !== "revoked" ? () => { setEditItem(item); setEditModalOpen(true); } : undefined,
            publish: item.status !== "published" && item.status !== "revoked" ? () => setConfirmAction({ type: "publish", items: [item] }) : undefined,
            void: item.status === "published" ? () => setConfirmAction({ type: "revoke", items: [item] }) : undefined,
            delete: item.status === "revoked" ? () => setConfirmAction({ type: "delete", items: [item] }) : undefined,
          }} labels={{ view: "Xem trước", edit: "Chỉnh sửa", publish: "Công bố", void: "Thu hồi", delete: "Xóa" }} />;
        },
        size: 220,
        enableSorting: false,
      },
    ],
    [items],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter: query, rowSelection: selectedIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    onRowSelectionChange: (updater) => {
      setSelectedIds((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
  });

  const selectedCount = Object.keys(table.getState().rowSelection).length;
  const selectedItems = table.getSelectedRowModel().rows.map((row) => row.original);
  const publishableItems = selectedItems.filter((item) => item.status !== "published" && item.status !== "revoked");
  const revokableItems = selectedItems.filter((item) => item.status === "published");

  return (
    <div className="page">
      <PageHeader
        title="Quản lý nội dung Landing Page"
        subtitle="Tạo, chỉnh sửa, công bố và sắp xếp nội dung hiển thị trên trang landing page."
        action="Tạo nội dung"
        onAction={openCreate}
      />
      <PageToolbar className="toolbar">
        <UiTextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          style={{ minWidth: 260 }}
          leftSection={<Search size={16} />}
          placeholder="Tìm kiếm nội dung..."
        />
        <UiSelect
          aria-label="Lọc theo loại"
          w={180}
          value={kindFilter}
          onChange={setKindFilter}
          data={[
            { value: "all", label: "Tất cả loại" },
            { value: "page", label: "Trang" },
            { value: "course", label: "Khóa học" },
            { value: "instructor", label: "Giảng viên" },
            { value: "studentHighlight", label: "HV tiêu biểu" },
            { value: "news", label: "Tin tức" },
            { value: "announcement", label: "Thông báo" },
            { value: "cta", label: "Kêu gọi HĐ" },
          ]}
        />
        <UiSelect
          aria-label="Lọc theo trạng thái"
          w={180}
          value={statusFilter}
          onChange={setStatusFilter}
          data={[
            { value: "all", label: "Tất cả trạng thái" },
            { value: "draft", label: "Bản nháp" },
            { value: "review", label: "Đang duyệt" },
            { value: "published", label: "Đã công bố" },
            { value: "revoked", label: "Đã thu hồi" },
          ]}
        />
        <div style={{ flex: 1 }} />
        {selectedCount > 0 && (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Đã chọn {selectedCount} nội dung
            </Text>
            <UiButton variant="light" color={uiStatusRoleColor.success} leftSection={<Check size={14} />} disabled={!publishableItems.length} onClick={() => setConfirmAction({ type: "publish", items: publishableItems })}>
              Công bố ({selectedCount})
            </UiButton>
            <UiButton variant="light" color="red" leftSection={<CircleOff size={14} />} disabled={!revokableItems.length} onClick={() => setConfirmAction({ type: "revoke", items: revokableItems })}>
              Thu hồi ({selectedCount})
            </UiButton>
          </Group>
        )}
      </PageToolbar>
      <Paper className="panel" p="md" withBorder>
        <Group justify="space-between" mb="sm">
          <div>
            <Text fw={700}>Danh sách nội dung</Text>
            <Text size="sm" c="dimmed">Theo dõi trạng thái công bố, phiên bản và thứ tự hiển thị.</Text>
          </div>
          <UiBadge>{filteredData.length} nội dung</UiBadge>
        </Group>
        <UiDataTable
          table={table}
          columnCount={columns.length}
          minWidth={960}
          emptyTitle="Không tìm thấy nội dung phù hợp."
          getRowProps={(row) => ({
            className: row.getIsSelected() ? "tableRow--selected" : undefined,
          })}
        />
        <Text size="xs" c="dimmed" mt="sm">
          {filteredData.length} / {items.length} bản ghi · hỗ trợ tìm kiếm, lọc, sắp xếp và chọn nhiều
        </Text>
      </Paper>
      {notice ? <Text size="sm" c="teal" mt="sm" role="status">{notice}</Text> : null}

      {/* Preview Drawer */}
      <Drawer
        opened={previewItem !== null}
        onClose={() => setPreviewItem(null)}
        title="Xem trước nội dung"
        position="right"
        size="md"
        padding="lg"
      >
        {previewItem && (
          <Stack gap="md">
            <Group>
              <UiBadge variant="outline" color="gray">
                {kindLabels[previewItem.kind]}
              </UiBadge>
              <UiStatusBadge role={statusConfig[previewItem.status].role}>
                {statusConfig[previewItem.status].label}
              </UiStatusBadge>
              <Text size="xs" c="dimmed">
                v{previewItem.version}
              </Text>
            </Group>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Đường dẫn
              </Text>
              <Text size="sm">/{previewItem.slug}</Text>
            </div>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase">
                Tiêu đề
              </Text>
              <Text fw={600}>{previewItem.title}</Text>
            </div>
            {previewItem.summary && (
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Tóm tắt
                </Text>
                <Text size="sm">{previewItem.summary}</Text>
              </div>
            )}
            <Group>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Thứ tự
                </Text>
                <Text size="sm">{previewItem.sortOrder}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Ngôn ngữ
                </Text>
                <Text size="sm">{previewItem.locale.toUpperCase()}</Text>
              </div>
            </Group>
            {previewItem.publishedAt && (
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Công bố lúc
                </Text>
                <Text size="sm">{formatDateTime(previewItem.publishedAt)}</Text>
              </div>
            )}
            {previewItem.revokedAt && (
              <div>
                <Text size="xs" c="dimmed" tt="uppercase">
                  Thu hồi lúc
                </Text>
                <Text size="sm">{formatDateTime(previewItem.revokedAt)}</Text>
              </div>
            )}
            <Paper p="md" withBorder>
              <Text size="xs" c="dimmed" tt="uppercase" mb="xs">
                Xem trước trên trang công khai
              </Text>
              <Text size="lg" fw={700}>
                {previewItem.title}
              </Text>
              {previewItem.summary && (
                <Text size="sm" c="dimmed" mt={4}>
                  {previewItem.summary}
                </Text>
              )}
              <Text size="xs" c="dimmed" mt="sm">
                Slug: /{previewItem.slug} · Loại: {kindLabels[previewItem.kind]} · Phiên bản: v{previewItem.version}
              </Text>
            </Paper>
          </Stack>
        )}
      </Drawer>

      <UiEditModal opened={editModalOpen} onClose={() => { setEditModalOpen(false); setEditItem(null); }} title={editItem ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"} saveLabel={editItem ? "Lưu thay đổi" : "Tạo nội dung"} onSave={() => (document.getElementById("content-edit-form") as HTMLFormElement | null)?.requestSubmit()}>
        <ContentEditForm content={editItem} onSave={saveContent} />
      </UiEditModal>
      <UiConfirmModal
        opened={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.type === "publish" ? "Công bố nội dung" : confirmAction?.type === "delete" ? "Xóa nội dung" : "Thu hồi nội dung"}
        description={confirmAction ? `${confirmAction.items.length} nội dung được chọn. Thao tác này sẽ cập nhật trạng thái ngay trên workspace marketing.` : ""}
        confirmLabel={confirmAction?.type === "publish" ? "Công bố" : confirmAction?.type === "delete" ? "Xóa" : "Thu hồi"}
        destructive={confirmAction?.type !== "publish"}
        onConfirm={() => confirmAction && applyStatus(confirmAction.type, confirmAction.items)}
      />
    </div>
  );
}

/* ---------- edit form ---------- */

function ContentEditForm({ content, onSave }: { content: LandingContent | null; onSave: (draft: LandingContent) => void }) {
  const [title, setTitle] = useState(content?.title ?? "");
  const [slug, setSlug] = useState(content?.slug ?? "");
  const [summary, setSummary] = useState(content?.summary ?? "");
  const [kind, setKind] = useState<ContentKind>(content?.kind ?? "page");
  const [locale, setLocale] = useState(content?.locale ?? "vi");
  const [sortOrder, setSortOrder] = useState(String(content?.sortOrder ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setTitle(content?.title ?? "");
    setSlug(content?.slug ?? "");
    setSummary(content?.summary ?? "");
    setKind(content?.kind ?? "page");
    setLocale(content?.locale ?? "vi");
    setSortOrder(String(content?.sortOrder ?? 0));
    setErrors({});
  }, [content]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề không được để trống";
    if (!slug.trim()) {
      errs.slug = "Đường dẫn không được để trống";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errs.slug = "Đường dẫn chỉ chứa chữ cái thường, số và dấu gạch ngang";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date().toISOString();
    onSave({
      ...(content ?? {
        id: `lc-${Date.now()}`,
        body: null,
        media: null,
        version: 1,
        status: "draft" as ContentStatus,
        publishedAt: null,
        revokedAt: null,
        publishedByUserId: null,
        revokedByUserId: null,
        createdByUserId: "demo-user",
        createdAt: now,
        updatedAt: now,
      }),
      kind,
      slug: slug.trim(),
      title: title.trim(),
      summary: summary.trim() || null,
      locale,
      sortOrder: Number(sortOrder) || 0,
      updatedAt: now,
    });
  }

  function handleAutoSlug() {
    const autoSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  }

  return (
    <form id="content-edit-form" onSubmit={handleSubmit}>
      <Stack gap="md">
        <UiTextInput
          label="Tiêu đề"
          placeholder="Nhập tiêu đề nội dung"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          error={errors.title}
          required
        />
        <Group grow>
          <UiTextInput
            label="Đường dẫn (slug)"
            placeholder="vi-du-cho-noi-dung"
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            error={errors.slug}
            required
          />
          <Button type="button" variant="subtle" size="xs" mt="xl" onClick={handleAutoSlug}>
            Tự động
          </Button>
        </Group>
        <UiTextInput
          label="Tóm tắt"
          placeholder="Mô tả ngắn nội dung"
          value={summary}
          onChange={(e) => setSummary(e.currentTarget.value)}
        />
        <UiSelect
          label="Loại nội dung"
          value={kind}
          onChange={(v) => setKind(v as ContentKind)}
          data={[
            { value: "page", label: "Trang" },
            { value: "course", label: "Khóa học" },
            { value: "instructor", label: "Giảng viên" },
            { value: "studentHighlight", label: "Học viên tiêu biểu" },
            { value: "news", label: "Tin tức" },
            { value: "announcement", label: "Thông báo" },
            { value: "cta", label: "Kêu gọi hành động" },
          ]}
        />
        <Group grow>
          <UiSelect
            label="Ngôn ngữ"
            value={locale}
            onChange={(v) => setLocale(v ?? "vi")}
            data={[
              { value: "vi", label: "Tiếng Việt" },
              { value: "en", label: "English" },
            ]}
          />
          <UiTextInput
            label="Thứ tự hiển thị"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.currentTarget.value)}
            description="Số nhỏ hơn hiển thị trước"
          />
        </Group>
        {content && (
          <Paper p="sm" withBorder>
            <Group>
              <UiStatusBadge role={statusConfig[content.status].role}>
                {statusConfig[content.status].label}
              </UiStatusBadge>
              <Text size="xs" c="dimmed">
                Phiên bản v{content.version} · Tạo: {formatDate(content.createdAt)}
              </Text>
            </Group>
          </Paper>
        )}
      </Stack>
    </form>
  );
}
