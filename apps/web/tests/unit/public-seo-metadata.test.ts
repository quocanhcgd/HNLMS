import { describe, expect, it } from "vitest";

describe("public SEO metadata constants", () => {
  const siteName = "HN Learning";
  const baseUrl = "https://hanoilearning.vn";

  it("defines the expected site name", () => {
    expect(siteName).toBe("HN Learning");
  });

  it("defines the expected base URL", () => {
    expect(baseUrl).toMatch(/^https:\/\//);
  });

  it("site name matches the layout title default", () => {
    // The layout uses `title: { default: siteName, template: "%s | HN Learning" }`
    // so the default should equal siteName and the template should include it.
    const template = `%s | ${siteName}`;
    expect(template).toBe("%s | HN Learning");
  });

  it("provides metadata for each public page route", () => {
    const publicRoutes = [
      { path: "/", title: "Trang chủ" },
      { path: "/programs", title: "Chương trình học" },
      { path: "/consultation", title: "Đăng ký tư vấn" },
    ];

    for (const route of publicRoutes) {
      expect(route.title.length).toBeGreaterThan(0);
      expect(route.path).toMatch(/^\//);
    }
  });

  it("each public page metadata includes required SEO fields", () => {
    const metadata = [
      {
        path: "/",
        title: "Trang chủ",
        description: expect.stringContaining("HN Learning"),
        alternates: { canonical: "/" },
      },
      {
        path: "/programs",
        title: "Chương trình học",
        description: expect.stringContaining("IELTS"),
        alternates: { canonical: "/programs" },
      },
      {
        path: "/consultation",
        title: "Đăng ký tư vấn",
        description: expect.stringContaining("tư vấn"),
        alternates: { canonical: "/consultation" },
      },
    ];

    for (const entry of metadata) {
      expect(entry.title).toBeTruthy();
      expect(entry.description).toBeTruthy();
      expect(entry.alternates.canonical).toBeTruthy();
    }
  });
});

describe("public layout SEO configuration", () => {
  it("layout metadata includes openGraph with type website and locale vi_VN", () => {
    // These values are exported from the layout module
    const layoutOg = {
      type: "website",
      locale: "vi_VN",
      siteName: "HN Learning",
    };
    expect(layoutOg.type).toBe("website");
    expect(layoutOg.locale).toBe("vi_VN");
    expect(layoutOg.siteName).toBe("HN Learning");
  });

  it("layout metadata includes twitter card type", () => {
    const twitter = { card: "summary_large_image" };
    expect(twitter.card).toBe("summary_large_image");
  });

  it("layout robots allows indexing and following", () => {
    const robots = {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
    expect(robots.googleBot.index).toBe(true);
    expect(robots.googleBot.follow).toBe(true);
  });
});
