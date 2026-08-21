"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ActionIcon,
  type BadgeProps,
  Button,
  Checkbox,
  Drawer,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { ArrowDown, ArrowUp, ArrowUpDown, Check, CircleOff, Eye, GripVertical, Pencil, Search } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { EmptyState } from "@/components/domain";
import { PageToolbar, UiBadge, UiTable, UiButton, UiSelect, UiTextInput } from "@/components/ui";

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

const statusConfig: Record<ContentStatus, { label: string; color: string; variant: BadgeProps["variant"] }> = {
  draft: { label: "Bản nháp", color: "gray", variant: "light" },
  review: { label: "Đang duyệt", color: "yellow", variant: "light" },
  published: { label: "Đã công bố", color: "green", variant: "light" },
  revoked: { label: "Đã thu hồi", color: "red", variant: "light" },
};

function SortIndicator({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp size={14} />;
  if (direction === "desc") return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} opacity={0.5} />;
}

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<string | null>("all");
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [selectedIds, setSelectedIds] = useState<RowSelectionState>({});
  const [previewItem, setPreviewItem] = useState<LandingContent | null>(null);
  const [editItem, setEditItem] = useState<LandingContent | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "publish" | "revoke" | "delete";
    item: LandingContent;
  } | null>(null);

  const filteredData = useMemo(() => {
    let items = [...mockContent];
    if (kindFilter && kindFilter !== "all") {
      items = items.filter((i) => i.kind === kindFilter);
    }
    if (statusFilter && statusFilter !== "all") {
      items = items.filter((i) => i.status === statusFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.slug.toLowerCase().includes(q) ||
          (i.summary && i.summary.toLowerCase().includes(q)),
      );
    }
    return items;
  }, [kindFilter, statusFilter, query]);

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
        id: "drag",
        header: () => <GripVertical size={16} opacity={0.3} />,
        cell: () => <GripVertical size={16} opacity={0.3} style={{ cursor: "grab" }} />,
        size: 36,
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
          return (
            <UiBadge variant={s.variant} color={s.color}>
              {s.label}
            </UiBadge>
          );
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
        header: () => <Text size="xs">Thao tác</Text>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <Group gap={4} wrap="nowrap">
              <Tooltip label="Xem trước">
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  size="sm"
                  onClick={() => setPreviewItem(item)}
                  aria-label={`Xem trước ${item.title}`}
                >
                  <Eye size={15} />
                </ActionIcon>
              </Tooltip>
              {item.status !== "published" && item.status !== "revoked" && (
                <Tooltip label="Chỉnh sửa">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={() => {
                      setEditItem(item);
                      setEditDrawerOpen(true);
                    }}
                    aria-label={`Chỉnh sửa ${item.title}`}
                  >
                    <Pencil size={15} />
                  </ActionIcon>
                </Tooltip>
              )}
              {item.status !== "published" && item.status !== "revoked" && (
                <Tooltip label="Công bố">
                  <ActionIcon
                    variant="subtle"
                    color="green"
                    size="sm"
                    onClick={() => setConfirmAction({ type: "publish", item })}
                    aria-label={`Công bố ${item.title}`}
                  >
                    <Check size={15} />
                  </ActionIcon>
                </Tooltip>
              )}
              {item.status === "published" && (
                <Tooltip label="Thu hồi">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => setConfirmAction({ type: "revoke", item })}
                    aria-label={`Thu hồi ${item.title}`}
                  >
                    <CircleOff size={15} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          );
        },
        size: 110,
        enableSorting: false,
      },
    ],
    [],
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

  return (
    <div className="page">
      <PageHeader
        title="Quản lý nội dung Landing Page"
        subtitle="Tạo, chỉnh sửa, công bố và sắp xếp nội dung hiển thị trên trang landing page."
        action="Tạo nội dung"
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
            <UiButton variant="light" color="green" leftSection={<Check size={14} />}>
              Công bố ({selectedCount})
            </UiButton>
            <UiButton variant="light" color="red" leftSection={<CircleOff size={14} />}>
              Thu hồi ({selectedCount})
            </UiButton>
          </Group>
        )}
      </PageToolbar>
      <div className="tableWrap">
        <UiTable verticalSpacing="md" horizontalSpacing="lg">
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        className="tableSortButton"
                        type="button"
                        disabled={!header.column.getCanSort()}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && <SortIndicator direction={header.column.getIsSorted()} />}
                      </button>
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id} bg={row.getIsSelected() ? "blue.0" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Table.Td>
                  ))}
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={columns.length}>
                  <EmptyState title="Không tìm thấy nội dung" description="Hãy thay đổi từ khóa hoặc bộ lọc." />
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </UiTable>
      </div>
      <Text size="xs" c="dimmed" mt="sm">
        {filteredData.length} / {mockContent.length} bản ghi · hỗ trợ tìm kiếm, lọc, sắp xếp và chọn nhiều
      </Text>

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
              <UiBadge
                variant={statusConfig[previewItem.status].variant}
                color={statusConfig[previewItem.status].color}
              >
                {statusConfig[previewItem.status].label}
              </UiBadge>
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

      {/* Edit/Create Drawer */}
      <Drawer
        opened={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditItem(null);
        }}
        title={editItem ? "Chỉnh sửa nội dung" : "Tạo nội dung mới"}
        position="right"
        size="lg"
        padding="lg"
      >
        <ContentEditForm
          content={editItem}
          onClose={() => {
            setEditDrawerOpen(false);
            setEditItem(null);
          }}
        />
      </Drawer>

      {/* Confirm Dialog */}
      {confirmAction && (
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={() => setConfirmAction(null)}>
            Hủy
          </Button>
          <Button
            color={confirmAction.type === "publish" ? "green" : "red"}
            onClick={() => {
              // TODO: wire to real service
              setConfirmAction(null);
            }}
          >
            {confirmAction.type === "publish" ? "Xác nhận công bố" : "Xác nhận thu hồi"}
          </Button>
        </Group>
      )}
    </div>
  );
}

/* ---------- edit form ---------- */

function ContentEditForm({ content, onClose }: { content: LandingContent | null; onClose: () => void }) {
  const [title, setTitle] = useState(content?.title ?? "");
  const [slug, setSlug] = useState(content?.slug ?? "");
  const [summary, setSummary] = useState(content?.summary ?? "");
  const [kind, setKind] = useState<ContentKind>(content?.kind ?? "page");
  const [locale, setLocale] = useState(content?.locale ?? "vi");
  const [sortOrder, setSortOrder] = useState(String(content?.sortOrder ?? 0));
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    // TODO: wire to real service
    onClose();
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
    <form onSubmit={handleSubmit}>
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
          <Button variant="subtle" size="xs" mt="xl" onClick={handleAutoSlug}>
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
              <UiBadge variant={statusConfig[content.status].variant} color={statusConfig[content.status].color}>
                {statusConfig[content.status].label}
              </UiBadge>
              <Text size="xs" c="dimmed">
                Phiên bản v{content.version} · Tạo: {formatDate(content.createdAt)}
              </Text>
            </Group>
          </Paper>
        )}
        <Group justify="flex-end" mt="md">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit">{content ? "Lưu thay đổi" : "Tạo nội dung"}</Button>
        </Group>
      </Stack>
    </form>
  );
}
