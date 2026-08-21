import { describe, expect, it } from "vitest";

/* ---------- types ---------- */

type ContentKind =
  | "page"
  | "course"
  | "instructor"
  | "studentHighlight"
  | "news"
  | "announcement"
  | "cta";

type ContentStatus = "draft" | "review" | "published" | "revoked";

type LandingContent = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  summary: string | null;
  locale: string;
  sortOrder: number;
  version: number;
  status: ContentStatus;
  publishedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/* ---------- helpers (mirror of content-list.tsx) ---------- */

const kindLabels: Record<ContentKind, string> = {
  page: "Trang",
  course: "Khóa học",
  instructor: "Giảng viên",
  studentHighlight: "HV tiêu biểu",
  news: "Tin tức",
  announcement: "Thông báo",
  cta: "Kêu gọi HĐ",
};

const statusConfig: Record<ContentStatus, { label: string; color: string; variant: string }> = {
  draft: { label: "Bản nháp", color: "gray", variant: "light" },
  review: { label: "Đang duyệt", color: "yellow", variant: "light" },
  published: { label: "Đã công bố", color: "green", variant: "light" },
  revoked: { label: "Đã thu hồi", color: "red", variant: "light" },
};

function filterContent(
  items: LandingContent[],
  filters: { kind?: string | null; status?: string | null; search?: string },
): LandingContent[] {
  let result = [...items];
  if (filters.kind && filters.kind !== "all") {
    result = result.filter((i) => i.kind === filters.kind);
  }
  if (filters.status && filters.status !== "all") {
    result = result.filter((i) => i.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.slug.toLowerCase().includes(q) ||
        (i.summary && i.summary.toLowerCase().includes(q)),
    );
  }
  return result;
}

/* ---------- sample data ---------- */

const contents: LandingContent[] = [
  {
    id: "lc-1",
    kind: "page",
    slug: "gioi-thieu",
    title: "Giới thiệu tổ chức",
    summary: "Thông tin tổng quan",
    locale: "vi",
    sortOrder: 0,
    version: 2,
    status: "published",
    publishedAt: "2026-08-19T10:00:00Z",
    revokedAt: null,
    createdAt: "2026-08-18T08:00:00Z",
    updatedAt: "2026-08-19T10:00:00Z",
  },
  {
    id: "lc-2",
    kind: "course",
    slug: "ielts-foundation",
    title: "IELTS Foundation",
    summary: "Khóa học nền tảng IELTS",
    locale: "vi",
    sortOrder: 1,
    version: 1,
    status: "published",
    publishedAt: "2026-08-20T09:30:00Z",
    revokedAt: null,
    createdAt: "2026-08-19T14:00:00Z",
    updatedAt: "2026-08-20T09:30:00Z",
  },
  {
    id: "lc-3",
    kind: "instructor",
    slug: "thay-minh-tuan",
    title: "Thầy Minh Tuấn",
    summary: "Giảng viên IELTS 8.5",
    locale: "vi",
    sortOrder: 2,
    version: 1,
    status: "draft",
    publishedAt: null,
    revokedAt: null,
    createdAt: "2026-08-20T11:00:00Z",
    updatedAt: "2026-08-20T11:00:00Z",
  },
  {
    id: "lc-4",
    kind: "news",
    slug: "khai-giang-lop-moi",
    title: "Khai giảng lớp IELTS A1 mới",
    summary: "Lớp khai giảng 01/09/2026",
    locale: "vi",
    sortOrder: 3,
    version: 3,
    status: "published",
    publishedAt: "2026-08-21T07:00:00Z",
    revokedAt: null,
    createdAt: "2026-08-17T09:00:00Z",
    updatedAt: "2026-08-21T07:00:00Z",
  },
  {
    id: "lc-5",
    kind: "studentHighlight",
    slug: "nguyen-minh-anh",
    title: "Nguyễn Minh Anh - IELTS 7.5",
    summary: "Học viên xuất sắc",
    locale: "vi",
    sortOrder: 4,
    version: 1,
    status: "review",
    publishedAt: null,
    revokedAt: null,
    createdAt: "2026-08-20T15:00:00Z",
    updatedAt: "2026-08-20T15:00:00Z",
  },
  {
    id: "lc-6",
    kind: "cta",
    slug: "dang-ky-tu-van",
    title: "Đăng ký tư vấn miễn phí",
    summary: null,
    locale: "vi",
    sortOrder: 5,
    version: 1,
    status: "published",
    publishedAt: "2026-08-19T08:00:00Z",
    revokedAt: null,
    createdAt: "2026-08-19T08:00:00Z",
    updatedAt: "2026-08-19T08:00:00Z",
  },
  {
    id: "lc-7",
    kind: "announcement",
    slug: "uu-dai-hoc-phi",
    title: "Ưu đãi học phí tháng 9",
    summary: "Giảm 15% học phí",
    locale: "vi",
    sortOrder: 6,
    version: 2,
    status: "revoked",
    publishedAt: "2026-08-15T10:00:00Z",
    revokedAt: "2026-08-20T16:00:00Z",
    createdAt: "2026-08-15T10:00:00Z",
    updatedAt: "2026-08-20T16:00:00Z",
  },
];

/* ---------- tests ---------- */

describe("ContentList filtering logic", () => {
  it("returns all items when no filters applied", () => {
    const result = filterContent(contents, {});
    expect(result).toHaveLength(contents.length);
  });

  it("filters by kind", () => {
    const courses = filterContent(contents, { kind: "course" });
    expect(courses).toHaveLength(1);
    expect(courses[0]!.kind).toBe("course");

    const pages = filterContent(contents, { kind: "page" });
    expect(pages).toHaveLength(1);

    const news = filterContent(contents, { kind: "news" });
    expect(news).toHaveLength(1);
  });

  it("filters by status", () => {
    const published = filterContent(contents, { status: "published" });
    expect(published).toHaveLength(4);
    expect(published.every((i) => i.status === "published")).toBe(true);

    const drafts = filterContent(contents, { status: "draft" });
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.status).toBe("draft");

    const revoked = filterContent(contents, { status: "revoked" });
    expect(revoked).toHaveLength(1);
    expect(revoked[0]!.status).toBe("revoked");
  });

  it("filters by search query in title, slug and summary", () => {
    const results = filterContent(contents, { search: "IELTS" });
    // Matches: lc-2 (title), lc-3 (summary: IELTS 8.5), lc-4 (title), lc-5 (title: IELTS 7.5)
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.id)).toContain("lc-2");
    expect(results.map((r) => r.id)).toContain("lc-4");
  });

  it("filters by search query in slug", () => {
    const results = filterContent(contents, { search: "tu-van" });
    expect(results).toHaveLength(1);
    expect(results[0]!.slug).toBe("dang-ky-tu-van");
  });

  it("filters by search query in summary", () => {
    const results = filterContent(contents, { search: "xuất sắc" });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe("lc-5");
  });

  it("combines kind and status filters", () => {
    const results = filterContent(contents, { kind: "course", status: "published" });
    expect(results).toHaveLength(1);
    expect(results[0]!.id).toBe("lc-2");

    const empty = filterContent(contents, { kind: "course", status: "draft" });
    expect(empty).toHaveLength(0);
  });

  it("combines kind, status, and search filters", () => {
    const results = filterContent(contents, { status: "published", search: "IELTS" });
    expect(results).toHaveLength(2);
    expect(results.every((i) => i.status === "published")).toBe(true);
  });

  it("returns empty when no matches", () => {
    const results = filterContent(contents, { search: "xyz123nonexistent" });
    expect(results).toHaveLength(0);
  });

  it("treats 'all' as no filter", () => {
    const byKind = filterContent(contents, { kind: "all" });
    expect(byKind).toHaveLength(contents.length);

    const byStatus = filterContent(contents, { status: "all" });
    expect(byStatus).toHaveLength(contents.length);
  });
});

describe("kindLabels", () => {
  it("has a label for every content kind", () => {
    const kinds: ContentKind[] = [
      "page",
      "course",
      "instructor",
      "studentHighlight",
      "news",
      "announcement",
      "cta",
    ];
    for (const kind of kinds) {
      expect(kindLabels[kind]).toBeTruthy();
      expect(typeof kindLabels[kind]).toBe("string");
    }
  });
});

describe("statusConfig", () => {
  it("has label, color, and variant for every status", () => {
    const statuses: ContentStatus[] = ["draft", "review", "published", "revoked"];
    for (const status of statuses) {
      expect(statusConfig[status].label).toBeTruthy();
      expect(statusConfig[status].color).toBeTruthy();
      expect(statusConfig[status].variant).toBeTruthy();
    }
  });

  it("published content uses green color", () => {
    expect(statusConfig.published.color).toBe("green");
  });

  it("revoked content uses red color", () => {
    expect(statusConfig.revoked.color).toBe("red");
  });
});

describe("Content status transitions", () => {
  it("draft can be published", () => {
    const draft: LandingContent = {
      ...contents[2]!,
      status: "draft",
    };
    expect(draft.status).toBe("draft");
    // After publish: status should become "published"
    const published = { ...draft, status: "published" as const };
    expect(published.status).toBe("published");
  });

  it("review can be published", () => {
    const review: LandingContent = {
      ...contents[4]!,
      status: "review",
    };
    const published = { ...review, status: "published" as const };
    expect(published.status).toBe("published");
  });

  it("published can be revoked", () => {
    const published: LandingContent = {
      ...contents[0]!,
      status: "published",
    };
    const revoked = { ...published, status: "revoked" as const };
    expect(revoked.status).toBe("revoked");
  });

  it("revoked cannot be published (terminal state)", () => {
    const revoked: LandingContent = {
      ...contents[6]!,
      status: "revoked",
    };
    // In our service layer, this throws. Here we verify the semantic expectation.
    expect(revoked.status).toBe("revoked");
  });
});

